const express = require('express');
const router = express.Router();
const {
  getBookings,
  updateBookingStatus,
  createBooking,
  getMyBookings,
  getMyJobs,
  acceptBooking,
  declineBooking,
  startBooking,
  completeBooking,
  rateBooking,
  cancelBooking,
  rescheduleBooking,
  getBookingById
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin & Create
router.route('/').get(protect, admin, getBookings).post(protect, createBooking);

// Specific routes MUST come before '/:id'
// Customer
router.get('/my', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, rescheduleBooking);

// Laborer
router.get('/laborer', protect, getMyJobs);
router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/decline', protect, declineBooking);
router.put('/:id/start', protect, startBooking);
router.put('/:id/complete', protect, completeBooking);

router.post('/:id/rate', protect, rateBooking);

// Admin get/update by id
router.route('/:id').put(protect, admin, updateBookingStatus).get(protect, getBookingById);

module.exports = router;
