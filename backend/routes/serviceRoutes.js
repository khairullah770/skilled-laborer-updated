const express = require('express');
const router = express.Router();
const { upsertServiceOffering, listMyOfferings, deleteServiceOffering, searchLaborers } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upsertServiceOffering);
router.get('/mine', protect, listMyOfferings);
router.delete('/:id', protect, deleteServiceOffering);
router.get('/search-laborers', searchLaborers);

module.exports = router;
