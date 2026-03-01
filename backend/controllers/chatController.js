const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Booking = require("../models/Booking");

/**
 * GET /api/chat/by-booking/:bookingId
 * Get or create a chat for a booking (only if booking is Accepted / In Progress).
 * Works for both customer and laborer auth.
 */
const getChatByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Allow chat viewing for accepted, in-progress, or completed bookings
    const allowedStatuses = ["Accepted", "In Progress", "Completed"];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(403).json({
        message:
          "Chat is only available for accepted, in-progress, or completed bookings",
      });
    }

    // Verify the requester is part of this booking
    const userId = req.user?._id?.toString() || req.customer?._id?.toString();
    const isLaborer = booking.laborer.toString() === userId;
    const isCustomer = booking.customer.toString() === userId;
    if (!isLaborer && !isCustomer) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    // Find or create chat
    let chat = await Chat.findOne({ booking: bookingId });
    if (!chat) {
      // Don't create new chats for completed bookings
      if (booking.status === "Completed") {
        return res
          .status(404)
          .json({ message: "No chat found for this completed booking" });
      }
      chat = await Chat.create({
        booking: bookingId,
        customer: booking.customer,
        laborer: booking.laborer,
      });
    }

    res.json(chat);
  } catch (err) {
    console.error("getChatByBooking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/chat/:chatId/messages?page=1&limit=50
 * Get messages for a chat, paginated (newest first).
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const chat = await Chat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Verify the requester is part of this chat
    const userId = req.user?._id?.toString() || req.customer?._id?.toString();
    const isLaborer = chat.laborer.toString() === userId;
    const isCustomer = chat.customer.toString() === userId;
    if (!isLaborer && !isCustomer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Mark messages as read for the current user
    const otherRole = isCustomer ? "laborer" : "customer";
    await Message.updateMany(
      { chat: chatId, senderRole: otherRole, read: false },
      { $set: { read: true } },
    );

    // Reset unread counter
    if (isCustomer) {
      await Chat.updateOne({ _id: chatId }, { $set: { unreadCustomer: 0 } });
    } else {
      await Chat.updateOne({ _id: chatId }, { $set: { unreadLaborer: 0 } });
    }

    // Check if chat is active; also check booking status as fallback
    let isActive = chat.isActive !== false;
    if (isActive) {
      const booking = await Booking.findById(chat.booking)
        .select("status")
        .lean();
      if (
        booking &&
        (booking.status === "Completed" || booking.status === "Cancelled")
      ) {
        isActive = false;
        // Fix the chat record for future lookups
        await Chat.updateOne({ _id: chatId }, { $set: { isActive: false } });
      }
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
      page,
      hasMore: messages.length === limit,
      isActive,
    });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/chat/:chatId/messages
 * Send a message (REST fallback — real-time via Socket.IO is preferred).
 */
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.isActive) {
      return res
        .status(403)
        .json({ message: "This chat is closed. The job has been completed." });
    }

    const userId = req.user?._id?.toString() || req.customer?._id?.toString();
    const isLaborer = chat.laborer.toString() === userId;
    const isCustomer = chat.customer.toString() === userId;
    if (!isLaborer && !isCustomer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const senderRole = isCustomer ? "customer" : "laborer";

    const message = await Message.create({
      chat: chatId,
      senderId: userId,
      senderRole,
      text: text.trim(),
    });

    // Update chat with last message info and increment unread for the other party
    const updateData = {
      lastMessage: {
        text: text.trim(),
        senderId: userId,
        senderRole,
        createdAt: message.createdAt,
      },
    };
    if (isCustomer) {
      updateData.$inc = { unreadLaborer: 1 };
    } else {
      updateData.$inc = { unreadCustomer: 1 };
    }
    await Chat.findByIdAndUpdate(chatId, updateData);

    // Emit via Socket.IO if available
    const io = req.app.get("io");
    if (io) {
      io.to(`chat_${chatId}`).emit("newMessage", message);
      // Also notify the recipient's personal room for badge updates
      if (isCustomer) {
        io.to(`user_${chat.laborer.toString()}`).emit("chatUpdate", {
          chatId,
          lastMessage: updateData.lastMessage,
        });
      } else {
        io.to(`user_${chat.customer.toString()}`).emit("chatUpdate", {
          chatId,
          lastMessage: updateData.lastMessage,
        });
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/chat/my-chats
 * Get all chats for the authenticated user (customer or laborer).
 */
const getMyChats = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.customer?._id?.toString();
    const role = req.customer ? "customer" : "laborer";

    const query =
      role === "customer" ? { customer: userId } : { laborer: userId };

    const chats = await Chat.find(query)
      .sort({ updatedAt: -1 })
      .populate("customer", "firstName lastName name profileImage")
      .populate("laborer", "name profileImage email verificationHistory")
      .populate("booking", "service status compensation")
      .lean();

    // Resolve laborer names from verificationHistory if empty
    const result = chats.map((chat) => {
      if (chat.laborer && (!chat.laborer.name || !chat.laborer.name.trim())) {
        const vHistory = chat.laborer.verificationHistory;
        if (vHistory && vHistory.length > 0) {
          const last = [...vHistory]
            .reverse()
            .find((h) => h.submittedData?.name);
          if (last?.submittedData?.name) {
            chat.laborer.name = last.submittedData.name;
          }
          if (last?.submittedData?.profileImage) {
            chat.laborer.profileImage = last.submittedData.profileImage;
          }
        }
        if (!chat.laborer.name || !chat.laborer.name.trim()) {
          chat.laborer.name = chat.laborer.email || "Laborer";
        }
      }
      // Resolve customer name
      if (chat.customer && !chat.customer.name) {
        chat.customer.name =
          `${chat.customer.firstName || ""} ${chat.customer.lastName || ""}`.trim() ||
          "Customer";
      }
      return chat;
    });

    res.json(result);
  } catch (err) {
    console.error("getMyChats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getChatByBooking,
  getMessages,
  sendMessage,
  getMyChats,
};
