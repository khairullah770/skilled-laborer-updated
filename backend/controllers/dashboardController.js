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

module.exports = {
  getDashboardStats,
};
