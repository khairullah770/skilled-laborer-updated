const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skilled-labor-app');
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ email: 'admin@admin.com' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@admin.com',
            password: hashedPassword,
            role: 'admin',
            status: 'approved',
            phone: '0000000000'
        });

        console.log(`Admin created: ${admin.email} / 123456`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
