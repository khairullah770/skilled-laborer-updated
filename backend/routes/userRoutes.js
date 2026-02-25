const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    getUserById, 
    updateUserStatus, 
    registerUser, 
    loginUser, 
    submitVerificationDetails,
    getNotifications,
    markNotificationRead,
    updateLocation,
    getUserProfile, 
    updateAvailability, 
    updateSubcategories,
    changePassword,
    getPublicLaborerProfile
} = require('../controllers/userController');
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getUsers).post(registerUser);
router.route('/login').post(loginUser);

// Notification Routes (Must be before /:id)
router.route('/notifications').get(protect, getNotifications);
router.route('/notifications/:id/read').put(protect, markNotificationRead);

router.put('/location', protect, updateLocation);
router.put('/availability', protect, updateAvailability);
router.put('/subcategories', protect, updateSubcategories);
router.put('/change-password', protect, changePassword);
router.get('/profile', protect, getUserProfile);
router.route('/:id').get(protect, getUserById); // Laborer can view self, Admin can view all
router.route('/:id/status').put(protect, admin, updateUserStatus);
router.get('/:id/public', getPublicLaborerProfile);
router.route('/:id/verification').put(
    protect,
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'idCardImage', maxCount: 1 }
    ]), 
    submitVerificationDetails
);

module.exports = router;
