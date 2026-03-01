const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const ServiceOffering = require("../models/ServiceOffering");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const { sendEmail, notifyAdmin } = require("../utils/notificationService");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
      phone,
    } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please add a password" });
    }

    if (confirmPassword != null && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Please provide email or phone" });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    const effectiveRole = role || "customer";
    if (phone) {
      const pkRegex = /^\+92\d{10}$/;
      if (!pkRegex.test(phone)) {
        return res
          .status(400)
          .json({ message: "Phone must be in format +92XXXXXXXXXX" });
      }
    }

    // Check if user exists
    let userExists;
    if (email) {
      userExists = await User.findOne({ email });
    }
    if (!userExists && phone) {
      userExists = await User.findOne({ phone });
    }

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: (name || `${firstName || ""} ${lastName || ""}`).trim(),
      email: email || undefined,
      password: hashedPassword,
      phone: phone || undefined,
      role: role || "customer",
      status: role === "laborer" ? "unverified" : "approved",
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit verification details
// @route   POST /api/users/:id/verification
// @access  Private
const submitVerificationDetails = async (req, res) => {
  try {
    const { name, email, phone, experience, address, dob } = req.body;
    let { categories } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse categories if it's a JSON string
    let parsedCategories = categories;
    if (typeof categories === "string") {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (e) {
        console.error("Error parsing categories:", e);
      }
    }

    // Store file paths
    let profileImagePath = user.profileImage;
    let idCardImagePath = user.idCardImage;

    if (req.files) {
      if (req.files.profileImage) {
        profileImagePath = `/uploads/${req.files.profileImage[0].filename}`;
      }
      if (req.files.idCardImage) {
        idCardImagePath = `/uploads/${req.files.idCardImage[0].filename}`;
      }
    }

    // Do NOT update main profile fields yet.
    // Only update status and add to history with submitted data.
    user.status = "pending";

    // Add to history with the data to be reviewed
    user.verificationHistory.push({
      status: "pending",
      reason: "Submitted verification details for review",
      submittedData: {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        dob: dob || user.dob,
        address: address || user.address,
        experience: experience || user.experience,
        categories: Array.isArray(parsedCategories)
          ? parsedCategories
          : [parsedCategories].filter(Boolean),
        profileImage: profileImagePath,
        idCardImage: idCardImagePath,
      },
    });

    const updatedUser = await user.save();

    // --- NOTIFICATION SYSTEM START ---
    try {
      console.log(
        `Sending verification submission notifications for laborer: ${user.name} (${user._id})`,
      );

      // Get the submitted data for the notification
      const latestSubmission =
        user.verificationHistory[user.verificationHistory.length - 1];
      const submittedName = latestSubmission?.submittedData?.name || user.name;
      const submittedProfileImage =
        latestSubmission?.submittedData?.profileImage || user.profileImage;

      // 1. Find all admins
      const admins = await User.find({ role: "admin" });

      if (admins.length > 0) {
        const notificationPromises = admins.map((admin) => {
          // Create In-App Notification with full metadata
          return Notification.create({
            recipient: admin._id,
            type: "verification_submission",
            title: "New Verification Request",
            message: `Laborer ${submittedName} has submitted verification details for review.`,
            data: {
              laborerId: user._id,
              laborerName: submittedName,
              laborerProfileImage: submittedProfileImage,
              submittedAt: new Date().toISOString(),
              submissionId: latestSubmission._id,
            },
          });
        });

        // Send Email to all admins (mock)
        const emailPromises = admins
          .filter((a) => a.email)
          .map((admin) =>
            sendEmail(
              admin.email,
              "New Verification Request",
              `
                        <h3>New Verification Submission</h3>
                        <p>A laborer has submitted new verification details for review.</p>
                        <ul>
                            <li><b>Name:</b> ${name || user.name}</li>
                            <li><b>ID:</b> ${user._id}</li>
                            <li><b>Time:</b> ${new Date().toLocaleString()}</li>
                        </ul>
                        <p>Please log in to the Admin Dashboard to review the documents.</p>
                        `,
            ),
          );

        await Promise.all([...notificationPromises, ...emailPromises]);
        console.log(
          `Successfully sent notifications to ${admins.length} admins.`,
        );
      } else {
        console.warn("No admins found to receive verification notification.");
      }
    } catch (notifError) {
      console.error("CRITICAL: Notification Delivery Failed:", notifError);
      // In a production app, we might queue this for retry
    }
    // --- NOTIFICATION SYSTEM END ---

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: updatedUser.status,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error("Error in submitVerificationDetails:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Email or Phone already exists" });
    } else {
      res.status(500).json({
        message: error.message || "Server Error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
};

// @desc    Get all users (with filters)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select("-password")
      .populate("category", "name")
      .populate("categories", "name")
      .sort({ updatedAt: -1 })
      .lean();

    // Compute actual completed bookings count for laborers
    const laborerIds = users
      .filter((u) => u.role === "laborer")
      .map((u) => u._id);

    if (laborerIds.length > 0) {
      const counts = await Booking.aggregate([
        { $match: { laborer: { $in: laborerIds }, status: "Completed" } },
        { $group: { _id: "$laborer", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
      for (const user of users) {
        if (user.role === "laborer") {
          user.completedJobs = countMap.get(user._id.toString()) || 0;
        }
      }
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("category", "name")
      .populate("categories", "name")
      .lean();
    if (user) {
      // Compute actual completed bookings count from Booking collection
      if (user.role === "laborer") {
        const actualCount = await Booking.countDocuments({
          laborer: user._id,
          status: "Completed",
        });
        user.completedJobs = actualCount;
      }
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status (Admin)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status, rejectionReason, rating } = req.body;
    console.log(
      `Updating user status: ID=${req.params.id}, Status=${status}, Rating=${rating}`,
    );

    const user = await User.findById(req.params.id);

    if (!user) {
      console.log("User not found for status update");
      return res.status(404).json({ message: "User not found" });
    }

    const oldStatus = user.status;
    user.status = status;

    // If approving, apply the submitted data to the main profile
    if (status === "approved" && oldStatus === "pending") {
      // Find the most recent pending entry in history to get the submitted data
      const lastPending = [...user.verificationHistory]
        .reverse()
        .find((h) => h.status === "pending" && h.submittedData);

      if (lastPending && lastPending.submittedData) {
        const data = lastPending.submittedData;
        user.name = data.name || user.name;
        user.email = data.email || user.email;
        user.phone = data.phone || user.phone;
        user.dob = data.dob || user.dob;
        user.address = data.address || user.address;
        user.experience = data.experience || user.experience;
        user.profileImage = data.profileImage || user.profileImage;
        user.idCardImage = data.idCardImage || user.idCardImage;

        if (data.categories && data.categories.length > 0) {
          // Filter out invalid categories (like strings that aren't IDs)
          const validCategoryIds = data.categories.filter((id) =>
            mongoose.Types.ObjectId.isValid(id),
          );
          user.categories = validCategoryIds;
          if (validCategoryIds.length > 0) {
            user.category = validCategoryIds[0];
          }
        }
      }
    }

    // Update rating if provided
    if (rating !== undefined) {
      user.rating = rating;
    }

    user.verificationHistory.push({
      status,
      changedBy: req.user._id,
      reason: rejectionReason || `Status updated to ${status}`,
    });

    const updatedUser = await user.save();

    // --- NOTIFICATION FOR LABORER START ---
    try {
      const title =
        status === "approved"
          ? "Verification Approved"
          : "Verification Rejected";
      const message =
        status === "approved"
          ? "Congratulations! Your verification has been approved. Your profile is now updated."
          : `Your verification was rejected. Reason: ${rejectionReason || "Please check your details and resubmit."}`;

      await Notification.create({
        recipient: user._id,
        type: "verification_update",
        title: title,
        message: message,
        data: { status, rejectionReason },
      });

      // Mock email notification
      if (user.email) {
        await sendEmail(user.email, title, `<p>${message}</p>`);
      }
    } catch (notifError) {
      console.error("Laborer Notification Error:", notifError);
    }
    // --- NOTIFICATION FOR LABORER END ---

    console.log("User updated successfully:", updatedUser._id);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notifications for a user
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const principalId = req.user?._id || req.customer?._id;
    if (!principalId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const notifications = await Notification.find({ recipient: principalId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update laborer subcategories
// @route   PUT /api/users/subcategories
// @access  Private
const updateSubcategories = async (req, res) => {
  try {
    const { subcategories } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subcategories = subcategories;
    await user.save();

    res.json({
      message: "Subcategories updated successfully",
      subcategories: user.subcategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const principalId = req.user?._id || req.customer?._id;
    if (!principalId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (notification.recipient.toString() !== principalId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.currentLocation = {
      latitude,
      longitude,
      address,
    };

    const updatedUser = await user.save();

    res.json({
      currentLocation: updatedUser.currentLocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("category", "name icon")
      .populate("categories", "name icon")
      .populate({
        path: "subcategories",
        select: "name description minPrice maxPrice picture category",
      });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update laborer availability
// @route   PUT /api/users/availability
// @access  Private
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isAvailable = isAvailable;
    const updatedUser = await user.save();

    // Sync service offerings visibility with availability
    try {
      await ServiceOffering.updateMany(
        { laborer: updatedUser._id },
        { $set: { isActive: !!updatedUser.isAvailable } },
      );
    } catch (syncErr) {
      console.error("Failed to sync service offerings active state:", syncErr);
      // Do not fail the request; availability change is primary
    }

    res.json({
      isAvailable: updatedUser.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicLaborerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        "name profileImage rating experience status currentLocation isAvailable lastActive phone completedJobs verificationHistory role",
      )
      .lean();
    const allowUnapproved = req.query.includeUnapproved === "true";
    if (
      !user ||
      user.role !== "laborer" ||
      (!allowUnapproved && user.status !== "approved")
    ) {
      return res.status(404).json({ message: "Laborer not found" });
    }
    // Fallback to the most recent submittedData if main fields are empty
    let fallback = {};
    if (
      Array.isArray(user.verificationHistory) &&
      user.verificationHistory.length > 0
    ) {
      const lastWithData = [...user.verificationHistory]
        .reverse()
        .find((h) => h.submittedData);
      if (lastWithData && lastWithData.submittedData) {
        fallback = lastWithData.submittedData;
      }
    }
    const name = user.name || fallback.name || "";
    const phone = user.phone || fallback.phone || "";
    const experience = user.experience || fallback.experience || "";
    const profileImage = user.profileImage || fallback.profileImage || "";

    const offerings = await ServiceOffering.find({ laborer: req.params.id })
      .populate("subcategory", "name minPrice maxPrice")
      .lean();
    let reviews = [];
    let totalReviews = 0;
    try {
      const JobRating = require("../models/JobRating");
      reviews = await JobRating.find({ laborer: req.params.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("customer", "name profileImage")
        .lean();
      totalReviews = await JobRating.countDocuments({ laborer: req.params.id });
    } catch (e) {
      // reviews subsystem may not exist in all environments
    }
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const online =
      !!user.isAvailable || (user.lastActive && user.lastActive > fiveMinAgo);
    res.json({
      laborerId: req.params.id,
      name,
      profileImage,
      rating: user.rating || 0,
      totalReviews,
      phone,
      completedJobs: user.completedJobs || 0,
      experience,
      currentLocation: user.currentLocation || null,
      online,
      servicesProvided: offerings.length,
      offerings: offerings.map((o) => ({
        id: o._id,
        subcategory: o.subcategory,
        price: o.price,
        description: o.description || "",
      })),
      portfolio: [],
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        customerName:
          r.customer?.name ||
          `${r.customer?.firstName || ""} ${r.customer?.lastName || ""}`.trim() ||
          "Customer",
        customerImage: r.customer?.profileImage || "",
        rating: r.rating,
        comment: r.comment || "",
        createdAt: r.createdAt,
      })),
      availability: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Perform account action on laborer (warning, temp block, perm block, unblock)
// @route   PUT /api/users/:id/account-action
// @access  Private/Admin
const laborerAccountAction = async (req, res) => {
  try {
    const { action, reason } = req.body;
    // action: 'warning' | 'temp_block' | 'perm_block' | 'unblock'

    if (!action || !reason) {
      return res
        .status(400)
        .json({ message: "Action and reason are required" });
    }

    const validActions = ["warning", "temp_block", "perm_block", "unblock"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "laborer") {
      return res
        .status(400)
        .json({ message: "Action can only be performed on laborers" });
    }

    // Get actual completed jobs count
    const actualCompletedJobs = await Booking.countDocuments({
      laborer: user._id,
      status: "Completed",
    });

    const currentRating = user.rating || 0;

    let notifType = "";
    let notifTitle = "";
    let notifMessage = "";

    switch (action) {
      case "warning":
        user.accountStatus = "warned";
        user.warnings.push({
          reason,
          issuedBy: req.user._id,
          ratingAtTime: currentRating,
          completedJobsAtTime: actualCompletedJobs,
        });
        notifType = "account_warning";
        notifTitle = "Performance Warning";
        notifMessage = `You have received a warning from the admin. Reason: ${reason}. Your current rating is ${currentRating}. Please improve your service quality to avoid further action.`;
        break;

      case "temp_block":
        user.accountStatus = "temp_blocked";
        user.isAvailable = false;
        user.blockInfo = {
          type: "temporary",
          reason,
          blockedBy: req.user._id,
          blockedAt: new Date(),
          ratingAtTime: currentRating,
          completedJobsAtTime: actualCompletedJobs,
        };
        notifType = "account_temp_block";
        notifTitle = "Account Temporarily Blocked";
        notifMessage = `Your account has been temporarily blocked by the admin. Reason: ${reason}. Your current rating is ${currentRating}. Please contact support for more information.`;
        break;

      case "perm_block":
        user.accountStatus = "perm_blocked";
        user.isAvailable = false;
        user.blockInfo = {
          type: "permanent",
          reason,
          blockedBy: req.user._id,
          blockedAt: new Date(),
          ratingAtTime: currentRating,
          completedJobsAtTime: actualCompletedJobs,
        };
        notifType = "account_perm_block";
        notifTitle = "Account Permanently Blocked";
        notifMessage = `Your account has been permanently blocked by the admin. Reason: ${reason}. Your current rating is ${currentRating}. Please contact support if you believe this is an error.`;
        break;

      case "unblock":
        user.accountStatus = "active";
        user.isAvailable = true;
        if (user.blockInfo) {
          user.blockInfo.unblockedAt = new Date();
        }
        notifType = "account_unblock";
        notifTitle = "Account Unblocked";
        notifMessage = `Your account has been unblocked by the admin. Reason: ${reason}. You can now accept new jobs.`;
        break;
    }

    await user.save();

    // Send notification to the laborer
    try {
      await Notification.create({
        recipient: user._id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        data: {
          action,
          reason,
          ratingAtTime: currentRating,
          completedJobsAtTime: actualCompletedJobs,
        },
      });

      if (user.email) {
        await sendEmail(user.email, notifTitle, `<p>${notifMessage}</p>`);
      }
    } catch (notifError) {
      console.error("Account action notification error:", notifError);
    }

    // Notify admin(s) as well
    try {
      await notifyAdmin(
        "Account Action Taken",
        `Admin performed "${action}" on laborer ${user.name || user.email}. Reason: ${reason}`,
      );
    } catch (e) {
      console.error("Admin notification error:", e);
    }

    res.json({
      message: `Action "${action}" performed successfully`,
      user: {
        _id: user._id,
        name: user.name,
        accountStatus: user.accountStatus,
        warnings: user.warnings,
        blockInfo: user.blockInfo,
      },
    });
  } catch (error) {
    console.error("Account action error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  submitVerificationDetails,
  getUsers,
  getUserById,
  updateUserStatus,
  getNotifications,
  markNotificationRead,
  updateLocation,
  getUserProfile,
  updateAvailability,
  updateSubcategories,
  changePassword,
  getPublicLaborerProfile,
  laborerAccountAction,
};
