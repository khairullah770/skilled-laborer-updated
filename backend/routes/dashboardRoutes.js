const express = require('express');
const router = express.Router();
const { getDashboardStats, getLaborerStats } = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getDashboardStats);
router.get('/laborer-stats', protect, getLaborerStats);

module.exports = router;
