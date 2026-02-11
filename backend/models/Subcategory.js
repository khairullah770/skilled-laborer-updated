const mongoose = require('mongoose');

const subcategorySchema = mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    name: {
      type: String,
      required: [true, 'Please add a subcategory name'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    minPrice: {
      type: Number,
      required: [true, 'Please add a minimum price'],
    },
    maxPrice: {
      type: Number,
      required: [true, 'Please add a maximum price'],
    },
    picture: {
      type: String, // Path to the image file
      required: [true, 'Please add a picture'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subcategory', subcategorySchema);
