const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Mock User Data
const mockUser = {
  name: 'Workflow Test User',
  email: 'workflow_test@example.com',
  password: 'password123',
  phone: '0000000001',
  role: 'laborer'
};

let userId;
let token; // If we implement auth later, but currently endpoints might be open or using basic auth logic in tests

// Ensure DB connection
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
    // Cleanup
    await User.deleteOne({ email: mockUser.email });
});

afterAll(async () => {
  if (userId) {
    await User.findByIdAndDelete(userId);
  }
});

describe('Verification Workflow', () => {
    // 1. Register User
    it('should register a user', async () => {
        const res = await request(app)
          .post('/api/users')
          .send(mockUser);
        
        expect(res.statusCode).toEqual(201);
        userId = res.body._id;
        expect(res.body.status).toEqual('unverified');
    });

    // 2. Submit Verification (First Time)
    it('should submit verification details successfully', async () => {
        const testFilePath = path.join(__dirname, '../test.png');
        if (!fs.existsSync(testFilePath)) {
            fs.writeFileSync(testFilePath, 'fake png content');
        }

        const res = await request(app)
          .put(`/api/users/${userId}/verification`)
          .field('name', 'Workflow User')
          .field('phone', '0000000001')
          .field('dob', '01/01/1990')
          .field('address', '123 Test St')
          .field('experience', '5 years')
          .field('categories', JSON.stringify(['cat1']))
          .attach('idCardImage', testFilePath);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('pending');
        
        // Verify history was logged
        const user = await User.findById(userId);
        expect(user.verificationHistory.length).toBe(1);
        expect(user.verificationHistory[0].status).toBe('pending');
    });

    // 3. Attempt Duplicate Submission (Should Fail)
    it('should block duplicate submission while pending', async () => {
        const testFilePath = path.join(__dirname, '../test.png');
        const res = await request(app)
          .put(`/api/users/${userId}/verification`)
          .field('name', 'Workflow User')
          .attach('idCardImage', testFilePath);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Verification already pending/);
    });

    // 4. Admin Rejects Verification
    it('should allow admin to reject verification with reason', async () => {
        const res = await request(app)
          .put(`/api/users/${userId}/status`)
          .send({
              status: 'rejected',
              rejectionReason: 'Blurry ID card'
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('rejected');

        // Verify history
        const user = await User.findById(userId);
        const lastEntry = user.verificationHistory[user.verificationHistory.length - 1];
        expect(lastEntry.status).toBe('rejected');
        expect(lastEntry.reason).toBe('Blurry ID card');
    });

    // 5. Resubmit Verification (Should Succeed after Rejection)
    it('should allow resubmission after rejection', async () => {
        const testFilePath = path.join(__dirname, '../test.png');
        const res = await request(app)
          .put(`/api/users/${userId}/verification`)
          .field('name', 'Workflow User Fixed')
          .field('phone', '0000000001')
          .field('dob', '01/01/1990')
          .field('address', '123 Test St')
          .field('experience', '5 years')
          .field('categories', JSON.stringify(['cat1']))
          .attach('idCardImage', testFilePath);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('pending');
        expect(res.body.name).toEqual('Workflow User Fixed');
    });

    // 6. Admin Approves Verification
    it('should allow admin to approve verification with rating', async () => {
        const res = await request(app)
          .put(`/api/users/${userId}/status`)
          .send({
              status: 'approved',
              rating: 4.5
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('approved');
        expect(res.body.rating).toEqual(4.5);
    });

    // 7. Attempt Submission after Approval (Should Fail)
    it('should block submission after approval', async () => {
        const testFilePath = path.join(__dirname, '../test.png');
        const res = await request(app)
          .put(`/api/users/${userId}/verification`)
          .field('name', 'Workflow User')
          .attach('idCardImage', testFilePath);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Verification already approved/);
    });
});
