const mongoose = require("mongoose");

const chatbotMessageSchema = mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatbotConversationSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    messages: [chatbotMessageSchema],
    context: {
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      lastCategory: String,
      lastSubcategory: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Keep only 1 active conversation per customer (latest)
chatbotConversationSchema.index({ customer: 1, isActive: 1 });

module.exports = mongoose.model(
  "ChatbotConversation",
  chatbotConversationSchema,
);
