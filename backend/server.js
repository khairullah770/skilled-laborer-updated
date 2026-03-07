const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const Chat = require("./models/Chat");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Make io accessible to controllers
app.set("io", io);

const { errorHandler } = require("./middleware/errorMiddleware");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", require("./routes/categoryRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));

app.use(errorHandler);

/* ── Socket.IO authentication & chat handling ── */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.userId} (${socket.userRole})`);

  // Join personal room for notifications
  socket.join(`user_${socket.userId}`);

  // Join a chat room
  socket.on("joinChat", (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`${socket.userId} joined chat_${chatId}`);
  });

  // Leave a chat room
  socket.on("leaveChat", (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  // Real-time message sending
  socket.on("sendMessage", async ({ chatId, text }) => {
    try {
      if (!text || !text.trim()) return;

      const chat = await Chat.findById(chatId);
      if (!chat) return;
      if (!chat.isActive) return; // Chat closed after job completion

      const userId = socket.userId;
      const isLaborer = chat.laborer.toString() === userId;
      const isCustomer = chat.customer.toString() === userId;
      if (!isLaborer && !isCustomer) return;

      const senderRole = isCustomer ? "customer" : "laborer";

      const message = await Message.create({
        chat: chatId,
        senderId: userId,
        senderRole,
        text: text.trim(),
      });

      // Update chat metadata
      const updateData = {
        lastMessage: {
          text: text.trim(),
          senderId: userId,
          senderRole,
          createdAt: message.createdAt,
        },
      };
      if (isCustomer) {
        await Chat.findByIdAndUpdate(chatId, {
          ...updateData,
          $inc: { unreadLaborer: 1 },
        });
      } else {
        await Chat.findByIdAndUpdate(chatId, {
          ...updateData,
          $inc: { unreadCustomer: 1 },
        });
      }

      // Broadcast to everyone in the chat room
      io.to(`chat_${chatId}`).emit("newMessage", message);

      // Notify the other party's personal room for inbox updates
      const recipientId = isCustomer
        ? chat.laborer.toString()
        : chat.customer.toString();
      io.to(`user_${recipientId}`).emit("chatUpdate", {
        chatId,
        lastMessage: updateData.lastMessage,
      });
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  // Mark messages as read
  socket.on("markRead", async (chatId) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const userId = socket.userId;
      const isCustomer = chat.customer.toString() === userId;
      const isLaborer = chat.laborer.toString() === userId;
      if (!isCustomer && !isLaborer) return;

      const otherRole = isCustomer ? "laborer" : "customer";
      await Message.updateMany(
        { chat: chatId, senderRole: otherRole, read: false },
        { $set: { read: true } },
      );

      if (isCustomer) {
        await Chat.updateOne({ _id: chatId }, { $set: { unreadCustomer: 0 } });
      } else {
        await Chat.updateOne({ _id: chatId }, { $set: { unreadLaborer: 0 } });
      }

      // Notify sender that messages were read
      socket
        .to(`chat_${chatId}`)
        .emit("messagesRead", { chatId, readBy: userId });
    } catch (err) {
      console.error("Socket markRead error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    })
    .catch((err) => {
      console.error(
        "Failed to connect to MongoDB after retries, exiting",
        err && err.message,
      );
      process.exit(1);
    });
}

module.exports = app;
