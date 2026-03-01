const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      // required: [true, 'Please add a name'], // Made optional for laborer signup
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined to be non-unique (if multiple users have no email)
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    role: {
      type: String,
      enum: ["customer", "laborer", "admin"],
      default: "customer",
    },
    // Laborer specific fields
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: [],
      },
    ],
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        default: [],
      },
    ],
    status: {
      type: String,
      enum: ["unverified", "pending", "approved", "rejected"],
      default: "unverified", // Default status for laborers
    },
    accountStatus: {
      type: String,
      enum: ["active", "warned", "temp_blocked", "perm_blocked"],
      default: "active",
    },
    warnings: [
      {
        reason: { type: String, required: true },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ratingAtTime: { type: Number },
        completedJobsAtTime: { type: Number },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    blockInfo: {
      type: { type: String, enum: ["temporary", "permanent"] },
      reason: { type: String },
      blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      blockedAt: { type: Date },
      unblockedAt: { type: Date },
      ratingAtTime: { type: Number },
      completedJobsAtTime: { type: Number },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    experience: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: "",
    },
    idCardImage: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    verificationHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
        },
        // Store submitted data here so profile remains unchanged until approval
        submittedData: {
          name: String,
          email: String,
          phone: String,
          dob: String,
          address: String,
          experience: String,
          categories: [String],
          profileImage: String,
          idCardImage: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.index({ status: 1 }); // Index for efficient status queries
userSchema.index({ subcategories: 1 });
userSchema.index({ isAvailable: 1 });
userSchema.index({ lastActive: 1 });

module.exports = mongoose.model("User", userSchema);
