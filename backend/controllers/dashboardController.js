const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'In Progress' });
    const pendingApprovals = await User.countDocuments({ role: 'laborer', status: 'pending' });

    // Calculate revenue from completed bookings
    const completedBookings = await Booking.find({ status: 'Completed' });
    const totalRevenue = completedBookings.reduce((acc, booking) => acc + booking.price, 0);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('laborer', 'name');

    res.status(200).json({
      totalUsers,
      activeBookings,
      totalRevenue,
      pendingApprovals,
      recentBookings
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's completed bookings
    const todayCompletedBookings = await Booking.find({
      laborer: laborerId,
      status: 'Completed',
      updatedAt: { $gte: today }
    });

    const todayEarnings = todayCompletedBookings.reduce((acc, booking) => acc + booking.price, 0);
    const completedJobsToday = todayCompletedBookings.length;
    
    // Mock shift hours (can be calculated if we had start/end times)
    const shiftHours = 0; 

    // Get overall stats
    const user = await User.findById(laborerId);
    
    // Mock rating breakdown since we don't have reviews collection yet
    const ratingBreakdown = {
      5: user.rating >= 4.5 ? Math.floor(Math.random() * 10) + 5 : 0,
      4: user.rating >= 3.5 && user.rating < 4.5 ? Math.floor(Math.random() * 5) + 2 : 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    const totalReviews = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);

    res.status(200).json({
      todayEarnings,
      completedJobsToday,
      shiftHours,
      currentRating: user.rating || 0,
      totalReviews: totalReviews || 0, // Mocked for now
      ratingBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getLaborerStats
};
