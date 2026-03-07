const User = require("../models/User");
const Booking = require("../models/Booking");
const JobRating = require("../models/JobRating");

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLaborers = await User.countDocuments({ role: "laborer" });
    const activeBookings = await Booking.countDocuments({
      status: "In Progress",
    });
    const pendingApprovals = await User.countDocuments({
      role: "laborer",
      status: "pending",
    });

    // Calculate revenue from completed bookings
    const completedBookings = await Booking.find({ status: "Completed" });
    const totalRevenue = completedBookings.reduce(
      (acc, booking) => acc + (booking.compensation || 0),
      0,
    );

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "name")
      .populate("laborer", "name");

    res.status(200).json({
      totalUsers,
      totalLaborers,
      activeBookings,
      totalRevenue,
      pendingApprovals,
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get laborer dashboard stats
// @route   GET /api/dashboard/laborer-stats
// @access  Private
const getLaborerStats = async (req, res) => {
  try {
    const laborerId = req.user._id;

    // Get ALL completed bookings for this laborer
    const allCompletedBookings = await Booking.find({
      laborer: laborerId,
      status: "Completed",
    });

    const totalEarnings = allCompletedBookings.reduce(
      (acc, booking) => acc + (booking.compensation || 0),
      0,
    );

    // Get the laborer's current rating and completedJobs from the User document
    // These are the authoritative values, kept in sync by completeBooking and rateBooking
    const user = await User.findById(laborerId);

    // Use the higher of the two sources for completed jobs:
    // - User.completedJobs (incremented on each completion)
    // - Actual Booking count (ground truth from DB)
    const totalCompletedJobs = Math.max(
      user?.completedJobs || 0,
      allCompletedBookings.length,
    );

    // Get real rating stats from JobRating collection
    const ratingStats = await JobRating.aggregate([
      { $match: { laborer: user._id } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$rating" },
        },
      },
    ]);

    const totalReviews = ratingStats[0]?.count || 0;
    // Use JobRating-computed average if reviews exist, otherwise fall back to User.rating
    // (User.rating is kept in sync by rateBooking and may also reflect seeded/imported data)
    const avgRating =
      totalReviews > 0
        ? ratingStats[0].total / totalReviews
        : user?.rating || 0;

    // Get real rating breakdown from JobRating collection
    const breakdownAgg = await JobRating.aggregate([
      { $match: { laborer: user._id } },
      {
        $group: {
          _id: { $ceil: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const entry of breakdownAgg) {
      const bucket = Math.min(Math.max(entry._id, 1), 5);
      ratingBreakdown[bucket] = (ratingBreakdown[bucket] || 0) + entry.count;
    }

    res.status(200).json({
      totalEarnings,
      totalCompletedJobs,
      currentRating: avgRating,
      totalReviews,
      ratingBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getLaborerStats,
};
