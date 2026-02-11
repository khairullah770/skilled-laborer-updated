const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Booking = require('./models/Booking');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany();
    await Booking.deleteMany();
    console.log('Existing data cleared');

    // Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@skilledlabor.com',
      password: 'admin123',
      role: 'admin',
      status: 'Verified'
    });

    const laborer1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'laborer',
      category: 'Electrician',
      status: 'Verified',
      phone: '123-456-7890',
      experience: '5 years',
      rating: 4.5,
      completedJobs: 12
    });

    const laborer2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'laborer',
      category: 'Plumber',
      status: 'Pending',
      phone: '098-765-4321',
      experience: '3 years',
      rating: 0,
      completedJobs: 0
    });

    const customer1 = await User.create({
      name: 'Alice Brown',
      email: 'alice@example.com',
      password: 'password123',
      role: 'customer',
      status: 'Verified',
      phone: '111-222-3333'
    });

    console.log('Users seeded');

    // Create Bookings
    const bookings = [
      {
        customer: customer1._id,
        laborer: laborer1._id,
        service: 'Fix wiring',
        status: 'Completed',
        date: new Date(),
        address: '123 Main St, City',
        price: 150,
        paymentStatus: 'Paid'
      },
      {
        customer: customer1._id,
        laborer: laborer1._id,
        service: 'Install Fan',
        status: 'In Progress',
        date: new Date(),
        address: '123 Main St, City',
        price: 80,
        paymentStatus: 'Pending'
      },
      {
        customer: customer1._id,
        laborer: laborer2._id,
        service: 'Pipe Leak',
        status: 'Pending',
        date: new Date(),
        address: '456 Oak Ave, City',
        price: 120,
        paymentStatus: 'Pending'
      }
    ];

    await Booking.insertMany(bookings);
    console.log('Bookings seeded');

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
