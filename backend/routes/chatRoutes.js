const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getChatByBooking,
  getMessages,
  sendMessage,
  getMyChats,
} = require("../controllers/chatController");

// All chat routes require authentication
router.use(protect);

// Get all chats for the authenticated user
router.get("/my-chats", getMyChats);

// Get or create chat for a booking
router.get("/by-booking/:bookingId", getChatByBooking);

// Get messages for a chat (paginated)
router.get("/:chatId/messages", getMessages);

// Send a message (REST fallback)
router.post("/:chatId/messages", sendMessage);

module.exports = router;
