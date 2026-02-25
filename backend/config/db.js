const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (maxRetries = 5, initialDelayMs = 1000) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      console.log(
        `MongoDB connecting (attempt ${attempt + 1}/${maxRetries + 1})`
      );
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      attempt += 1;
      console.error('MongoDB connection error', {
        name: error.name,
        code: error.code,
        message: error.message,
        reason: error.reason && error.reason.message,
      });

      if (attempt > maxRetries) {
        throw error;
      }

      console.log(`MongoDB retrying in ${delay}ms`);
      await wait(delay);
      delay *= 2;
    }
  }
};

module.exports = connectDB;
