const mongoose = require('mongoose');

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
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      enum: ['customer', 'laborer', 'admin'],
      default: 'customer',
    },
    // Laborer specific fields
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: [],
    }],
    status: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified', // Default status for laborers
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    experience: {
        type: String,
        default: ''
    },
    dob: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    idCardImage: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0
    },
    completedJobs: {
        type: Number,
        default: 0
    },
    verificationHistory: [{
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
  },
  {
    timestamps: true,
  }
);

userSchema.index({ status: 1 }); // Index for efficient status queries

module.exports = mongoose.model('User', userSchema);
