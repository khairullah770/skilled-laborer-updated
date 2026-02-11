const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subcategories',
        },
      },
    ]);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const category = await Category.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subcategories',
        },
      },
    ]);

    if (!category || category.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an icon' });
    }

    const category = await Category.create({
      name,
      icon: req.file.path,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let iconPath = category.icon;
    if (req.file) {
      // Delete old icon
      if (fs.existsSync(category.icon)) {
        fs.unlinkSync(category.icon);
      }
      iconPath = req.file.path;
    }

    category.name = name || category.name;
    category.icon = iconPath;

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete icon
    if (fs.existsSync(category.icon)) {
      fs.unlinkSync(category.icon);
    }

    // Delete associated subcategories
    await Subcategory.deleteMany({ category: category._id });

    await category.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subcategories by category ID
// @route   GET /api/categories/:categoryId/subcategories
// @access  Public
const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ category: req.params.categoryId });
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
const createSubcategory = async (req, res) => {
  try {
    const { categoryId, name, description, minPrice, maxPrice } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a picture' });
    }

    const subcategory = await Subcategory.create({
      category: categoryId,
      name,
      description,
      minPrice,
      maxPrice,
      picture: req.file.path,
    });

    res.status(201).json(subcategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
const updateSubcategory = async (req, res) => {
  try {
    const { name, description, minPrice, maxPrice } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    let picturePath = subcategory.picture;
    if (req.file) {
      // Delete old picture
      if (fs.existsSync(subcategory.picture)) {
        fs.unlinkSync(subcategory.picture);
      }
      picturePath = req.file.path;
    }

    subcategory.name = name || subcategory.name;
    subcategory.description = description || subcategory.description;
    subcategory.minPrice = minPrice || subcategory.minPrice;
    subcategory.maxPrice = maxPrice || subcategory.maxPrice;
    subcategory.picture = picturePath;

    const updatedSubcategory = await subcategory.save();
    res.status(200).json(updatedSubcategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Delete picture
    if (fs.existsSync(subcategory.picture)) {
      fs.unlinkSync(subcategory.picture);
    }

    await subcategory.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
