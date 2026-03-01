const mongoose = require("mongoose");

const jobRatingSchema = mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    laborer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    rating: {
      type: Number,
      min: 0.5,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

jobRatingSchema.index({ laborer: 1 });
jobRatingSchema.index({ booking: 1 });
jobRatingSchema.index({ customer: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model("JobRating", jobRatingSchema);
