const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Mock User Data
const mockUser = {
  name: 'Verification Test User',
  email: 'verif_test@example.com',
  password: 'password123',
  phone: '0000000000',
  role: 'laborer'
};

let userId;

// Ensure DB connection
beforeAll(async () => {
    // Wait for connection if not established
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
});

afterAll(async () => {
  // Cleanup
  if (userId) {
    await User.findByIdAndDelete(userId);
  }
  // Do not close connection if it causes issues with other tests or server
  // await mongoose.connection.close(); 
});

describe('Verification API', () => {
  it('should register a user', async () => {
    // Clean up if exists
    await User.deleteOne({ email: mockUser.email });

    const res = await request(app)
      .post('/api/users')
      .send(mockUser);
    
    expect(res.statusCode).toEqual(201);
    userId = res.body._id;
  });

  it('should fail with invalid email format', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}/verification`)
        .field('email', 'invalid-email');
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Invalid email format');
  });

  it('should submit verification details with ID card and profile image', async () => {
    const testFilePath = path.join(__dirname, '../test.png');
    // Ensure test file exists
    if (!fs.existsSync(testFilePath)) {
        // Create a dummy file if not exists
        fs.writeFileSync(testFilePath, 'fake png content');
    }

    const res = await request(app)
      .put(`/api/users/${userId}/verification`)
      .field('name', 'Updated Name')
      .field('phone', '0000000000')
      .field('dob', '01/01/1990')
      .field('address', '123 Test St')
      .field('experience', '5 years')
      .field('categories', JSON.stringify(['cat1', 'cat2']))
      .field('email', 'updated_verif@example.com')
      .attach('profileImage', testFilePath)
      .attach('idCardImage', testFilePath);

    if (res.statusCode !== 200) {
        console.log(res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('pending');
    expect(res.body.email).toEqual('updated_verif@example.com');
    expect(res.body.idCardImage).toBeDefined();
    expect(res.body.profileImage).toBeDefined();
    expect(res.body.idCardImage).toMatch(/uploads/);
  });
});
