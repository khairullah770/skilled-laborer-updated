const mongoose = require('mongoose');

const serviceOfferingSchema = new mongoose.Schema(
  {
    laborer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate offerings of the same subcategory per laborer
serviceOfferingSchema.index({ laborer: 1, subcategory: 1 }, { unique: true });

module.exports = mongoose.model('ServiceOffering', serviceOfferingSchema);

