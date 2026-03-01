const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
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
    service: {
      type: String,
      required: true,
    },
    serviceDescription: {
      type: String,
      default: "",
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    location: {
      address: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    estimatedDurationMin: {
      type: Number,
      default: 45,
    },
    compensation: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Declined",
        "In Progress",
        "Completed",
        "Cancelled",
        "Rescheduled",
      ],
      default: "Pending",
    },
    acceptedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    workPhotos: [{ type: String }],
    log: [
      {
        at: { type: Date, default: Date.now },
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId },
        meta: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Backwards compatibility virtuals
bookingSchema.virtual("date").get(function () {
  return this.scheduledAt;
});
bookingSchema.virtual("address").get(function () {
  return this.location?.address;
});
bookingSchema.virtual("price").get(function () {
  return this.compensation;
});
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Booking", bookingSchema);
