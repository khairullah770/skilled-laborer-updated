const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const laborers = await User.find({ role: 'laborer' });
    const customers = await User.find({ role: 'customer' });

    console.log(`Laborers count: ${laborers.length}`);
    console.log(`Customers count: ${customers.length}`);
    
    if (laborers.length > 0) {
        console.log('Sample Laborer:', laborers[0]);
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUsers();
