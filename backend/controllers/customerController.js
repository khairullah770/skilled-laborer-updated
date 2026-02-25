const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/customers
const registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
    console.log('registerCustomer payload:', { firstName, lastName, email, phoneMasked: phone ? `${phone.slice(0, 4)}***` : undefined });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pkRegex = /^\+92\d{10}$/;

    if (!firstName || !lastName) {
      console.log('Validation failed: missing names');
      return res.status(400).json({ message: 'First and Last name are required' });
    }
    if (!email && !phone) {
      console.log('Validation failed: missing email and phone');
      return res.status(400).json({ message: 'Provide email or phone' });
    }
    if (email && !emailRegex.test(email)) {
      console.log('Validation failed: invalid email');
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (phone && !pkRegex.test(phone)) {
      console.log('Validation failed: invalid phone');
      return res.status(400).json({ message: 'Phone must be in format +92XXXXXXXXXX' });
    }
    if (!password) {
      console.log('Validation failed: missing password');
      return res.status(400).json({ message: 'Password is required' });
    }
    if (confirmPassword != null && password !== confirmPassword) {
      console.log('Validation failed: passwords mismatch');
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Ensure uniqueness
    if (email) {
      const exists = await Customer.findOne({ email });
      if (exists) {
        console.log('Uniqueness check failed: email exists');
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    if (phone) {
      const existsP = await Customer.findOne({ phone });
      if (existsP) {
        console.log('Uniqueness check failed: phone exists');
        return res.status(400).json({ message: 'Phone already registered' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = await Customer.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone || undefined,
      password: hashedPassword,
      status: 'active',
    });

    res.status(201).json({
      _id: customer._id,
      message: 'Account created successfully. You can now log in.',
    });
  } catch (error) {
    console.error('registerCustomer error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate email or phone' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/customers/login
const loginCustomer = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    let customer;
    if (email) {
      customer = await Customer.findOne({ email });
    } else if (phone) {
      customer = await Customer.findOne({ phone });
    }

    if (customer && (await bcrypt.compare(password, customer.password))) {
      return res.json({
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'customer',
        token: generateToken(customer._id),
      });
    }
    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('loginCustomer error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET /api/customers/me
const getCustomerProfile = async (req, res) => {
  const c = await Customer.findById(req.customer._id).select('-password');
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  res.json(c);
};

// PUT /api/customers/me
const updateCustomerProfile = async (req, res) => {
  // Restrict updates: do not allow changing name, email, or phone
  const c = await Customer.findById(req.customer._id);
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  // Allow only profileImage updates via JSON body (optional)
  if (req.body && typeof req.body.profileImage === 'string') {
    c.profileImage = req.body.profileImage;
    await c.save();
  }
  res.json(await Customer.findById(c._id).select('-password'));
};

// PUT /api/customers/me/password
const changeCustomerPassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password required' });
  if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
  const c = await Customer.findById(req.customer._id).select('+password');
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  const ok = await bcrypt.compare(oldPassword || '', c.password);
  if (!ok) return res.status(400).json({ message: 'Invalid current password' });
  const salt = await bcrypt.genSalt(10);
  c.password = await bcrypt.hash(newPassword, salt);
  await c.save();
  res.json({ message: 'Password updated' });
};

// Admin endpoints
// GET /api/customers (admin)
const listCustomers = async (_req, res) => {
  const items = await Customer.find().select('-password').sort({ createdAt: -1 });
  res.json(items);
};

// GET /api/customers/:id (admin)
const getCustomerById = async (req, res) => {
  const c = await Customer.findById(req.params.id).select('-password');
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  res.json(c);
};

// DELETE /api/customers/:id (admin)
const deleteCustomer = async (req, res) => {
  const c = await Customer.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  await c.deleteOne();
  res.json({ message: 'Customer deleted' });
};

// PUT /api/customers/me/profile-image
const updateCustomerProfileImage = async (req, res) => {
  const c = await Customer.findById(req.customer._id);
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  c.profileImage = `/uploads/${req.file.filename}`;
  await c.save();
  res.json({ profileImage: c.profileImage });
};

// PUT /api/customers/me/location
const updateCustomerLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const c = await Customer.findById(req.customer._id);
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    if (
      (latitude != null && isNaN(Number(latitude))) ||
      (longitude != null && isNaN(Number(longitude)))
    ) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }
    c.currentLocation = {
      latitude: latitude != null ? Number(latitude) : c.currentLocation?.latitude,
      longitude: longitude != null ? Number(longitude) : c.currentLocation?.longitude,
      address: address != null ? String(address).trim() : c.currentLocation?.address
    };
    await c.save();
    res.json({ currentLocation: c.currentLocation });
  } catch (e) {
    console.error('updateCustomerLocation error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
};

module.exports = {
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
};
