const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const runTest = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Cleanup test users
    await User.deleteMany({ email: { $regex: /test.*@example.com/ } });
    await User.deleteMany({ phone: { $regex: /\+999/ } });

    console.log('Creating User 1 (Email only)...');
    const user1 = await User.create({
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'password123',
      role: 'laborer'
      // phone is undefined
    });
    console.log('User 1 created:', user1.phone === undefined ? 'Phone is undefined' : `Phone is "${user1.phone}"`);

    console.log('Creating User 2 (Email only)...');
    const user2 = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
      role: 'laborer'
      // phone is undefined
    });
    console.log('User 2 created:', user2.phone === undefined ? 'Phone is undefined' : `Phone is "${user2.phone}"`);

    console.log('Creating User 3 (Phone only)...');
    const user3 = await User.create({
      name: 'Test User 3',
      phone: '+9990000001',
      password: 'password123',
      role: 'laborer'
      // email is undefined
    });
    console.log('User 3 created:', user3.email === undefined ? 'Email is undefined' : `Email is "${user3.email}"`);

    console.log('Creating User 4 (Phone only)...');
    const user4 = await User.create({
      name: 'Test User 4',
      phone: '+9990000002',
      password: 'password123',
      role: 'laborer'
      // email is undefined
    });
    console.log('User 4 created:', user4.email === undefined ? 'Email is undefined' : `Email is "${user4.email}"`);

    console.log('TEST PASSED: Multiple users created without collision on missing fields.');
    process.exit(0);
  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exit(1);
  }
};

runTest();
