const express = require("express");
const router = express.Router();
const {
  getBookings,
  updateBookingStatus,
  createBooking,
  getMyBookings,
  getMyJobs,
  acceptBooking,
  declineBooking,
  goOnTheWay,
  arrivedAtLocation,
  startBooking,
  completeBooking,
  rateBooking,
  cancelBooking,
  rescheduleBooking,
  getBookingById,
  checkAcceptedBooking,
  uploadBookingPhotos,
  getPickupRecommendations,
} = require("../controllers/bookingController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Admin & Create
router.route("/").get(protect, admin, getBookings).post(protect, createBooking);

// Specific routes MUST come before '/:id'
// Customer
router.get("/my", protect, getMyBookings);
router.get("/check-accepted/:laborerId", protect, checkAcceptedBooking);
router.put("/:id/cancel", protect, cancelBooking);
router.put("/:id/reschedule", protect, rescheduleBooking);
router.post(
  "/:id/photos",
  protect,
  upload.array("workPhotos", 10),
  uploadBookingPhotos,
);

// Laborer
router.get("/laborer", protect, getMyJobs);
router.get("/:id/pickup-recommendations", protect, getPickupRecommendations);
router.put("/:id/accept", protect, acceptBooking);
router.put("/:id/decline", protect, declineBooking);
router.put("/:id/go", protect, goOnTheWay);
router.put("/:id/arrived", protect, arrivedAtLocation);
router.put("/:id/start", protect, startBooking);
router.put("/:id/complete", protect, completeBooking);

router.post("/:id/rate", protect, rateBooking);

// Admin get/update by id
router
  .route("/:id")
  .put(protect, admin, updateBookingStatus)
  .get(protect, getBookingById);

module.exports = router;
