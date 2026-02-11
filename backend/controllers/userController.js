const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, notifyAdmin } = require('../utils/notificationService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please add a password' });
        }

        if (!email && !phone) {
            return res.status(400).json({ message: 'Please provide email or phone' });
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
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name: name || '',
            email: email || undefined,
            password: hashedPassword,
            phone: phone || undefined,
            role: role || 'customer',
            status: role === 'laborer' ? 'unverified' : 'approved'
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        // Check for user by email or phone
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
            res.status(400).json({ message: 'Invalid credentials' });
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
            return res.status(404).json({ message: 'User not found' });
        }

        // Parse categories if it's a JSON string (common with FormData)
        if (typeof categories === 'string') {
            try {
                categories = JSON.parse(categories);
            } catch (e) {
                console.error('Error parsing categories:', e);
                // If parsing fails, assume it might be a single ID string or invalid
                // Keep it as is or handle error? For now, if it fails to parse, 
                // it might cause issues downstream if it's not an array of ObjectIds.
                // But let's proceed and see if Mongoose can handle it or if we should fallback.
            }
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email; // Ensure email is updated if provided
        user.phone = phone || user.phone; // Allow updating phone if provided
        
        if (categories) {
            user.categories = categories;
            // Set primary category safely
            if (Array.isArray(categories) && categories.length > 0) {
                 user.category = categories[0];
            } else if (typeof categories === 'string' && categories.length > 0 && categories !== '[]') {
                 // If it's a single ID string that wasn't JSON (rare with the frontend logic but possible)
                 user.category = categories; 
            }
        }

        user.experience = experience || user.experience;
        user.address = address || user.address;
        user.dob = dob || user.dob;
        user.status = 'pending'; // Update status to pending

        // Handle file uploads
        if (req.files) {
            if (req.files.profileImage) {
                user.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
            }
            if (req.files.idCardImage) {
                user.idCardImage = `/uploads/${req.files.idCardImage[0].filename}`;
            }
        }

        // Add to history
        user.verificationHistory.push({
            status: 'pending',
            reason: 'Submitted verification details'
        });

        const updatedUser = await user.save();

        // --- NOTIFICATION SYSTEM START ---
        try {
            // 1. Find all admins
            const admins = await User.find({ role: 'admin' });
            
            if (admins.length > 0) {
                const notificationPromises = admins.map(admin => {
                    // Create In-App Notification
                    return Notification.create({
                        recipient: admin._id,
                        type: 'verification_submission',
                        title: 'New Verification Request',
                        message: `Laborer ${user.name} has submitted verification details.`,
                        data: { laborerId: user._id, laborerName: user.name }
                    });
                });

                // Send Email to first admin (mock)
                await sendEmail(
                    admins[0].email,
                    'New Verification Request',
                    `<p>Laborer <b>${user.name}</b> has submitted verification details.</p>`
                );

                await Promise.all(notificationPromises);
            }
        } catch (notifError) {
            console.error('Notification Error:', notifError);
            // Don't fail the request if notifications fail
        }
        // --- NOTIFICATION SYSTEM END ---

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            status: updatedUser.status,
            profileImage: updatedUser.profileImage,
            token: generateToken(updatedUser._id)
        });

    } catch (error) {
        console.error('Error in submitVerificationDetails:', error);
        if (error.code === 11000) {
             res.status(400).json({ message: 'Email or Phone already exists' });
        } else {
             res.status(500).json({ 
                 message: error.message || 'Server Error',
                 stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
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
            .select('-password')
            .populate('category', 'name')
            .populate('categories', 'name')
            .sort({ updatedAt: -1 });
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
            .select('-password')
            .populate('category', 'name')
            .populate('categories', 'name');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
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
        console.log(`Updating user status: ID=${req.params.id}, Status=${status}, Rating=${rating}`);

        const user = await User.findById(req.params.id);

        if (!user) {
            console.log('User not found for status update');
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        
        // Update rating if provided (e.g., initial rating upon approval)
        if (rating !== undefined) {
            user.rating = rating;
            console.log(`Updated user rating to ${rating}`);
        }
        
        user.verificationHistory.push({
            status,
            changedBy: req.user._id,
            reason: rejectionReason || `Status updated to ${status}`
        });

        const updatedUser = await user.save();
        console.log('User updated successfully:', updatedUser._id);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notifications for a user
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
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
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
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
    markNotificationRead
};
