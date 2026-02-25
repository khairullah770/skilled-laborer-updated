const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  searchSubcategories,
} = require('../controllers/categoryController');
const upload = require('../middleware/upload');

// Category routes
router.route('/categories').get(getCategories).post(upload.single('icon'), createCategory);
router.route('/categories/:id').get(getCategory).put(upload.single('icon'), updateCategory).delete(deleteCategory);

// Subcategory routes
router.get('/subcategories/search', searchSubcategories);
router.route('/categories/:categoryId/subcategories').get(getSubcategories);
router.route('/subcategories').post(upload.single('picture'), createSubcategory);
router.route('/subcategories/:id').put(upload.single('picture'), updateSubcategory).delete(deleteSubcategory);

module.exports = router;
