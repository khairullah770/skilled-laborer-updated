const express = require("express");
const router = express.Router();
const { customerProtect } = require("../middleware/customerAuth");
const {
  sendMessage,
  getHistory,
  clearHistory,
  getSuggestions,
} = require("../controllers/chatbotController");

// All chatbot routes require customer authentication
router.post("/message", customerProtect, sendMessage);
router.get("/history", customerProtect, getHistory);
router.delete("/history", customerProtect, clearHistory);
router.get("/suggestions", customerProtect, getSuggestions);

module.exports = router;
