const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    laborer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.ObjectId },
      senderRole: { type: String, enum: ["customer", "laborer"] },
      createdAt: { type: Date },
    },
    unreadCustomer: { type: Number, default: 0 },
    unreadLaborer: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One chat per booking
chatSchema.index({ booking: 1 }, { unique: true });
chatSchema.index({ customer: 1, updatedAt: -1 });
chatSchema.index({ laborer: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
