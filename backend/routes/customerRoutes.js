const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  listCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomerProfileImage,
  updateCustomerLocation,
} = require('../controllers/customerController');
const { customerProtect } = require('../middleware/customerAuth');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', registerCustomer);
router.post('/login', loginCustomer);
router.get('/me', customerProtect, getCustomerProfile);
router.put('/me', customerProtect, updateCustomerProfile);
router.put('/me/password', customerProtect, changeCustomerPassword);
router.put('/me/profile-image', customerProtect, upload.single('profileImage'), updateCustomerProfileImage);
router.put('/me/location', customerProtect, updateCustomerLocation);

// Admin-facing
router.get('/', protect, admin, listCustomers);
router.get('/:id', protect, admin, getCustomerById);
router.delete('/:id', protect, admin, deleteCustomer);

module.exports = router;
