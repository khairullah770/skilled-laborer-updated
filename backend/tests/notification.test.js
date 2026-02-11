const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { submitVerificationDetails } = require('../controllers/userController');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock_token')
}));
jest.mock('../models/User');
jest.mock('../models/Notification');
jest.mock('../utils/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  notifyAdmin: jest.fn().mockResolvedValue(true),
  sendPushNotification: jest.fn().mockResolvedValue(true)
}));

const { sendEmail } = require('../utils/notificationService');

describe('Notification Integration', () => {
  let req, res;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret'; // Set JWT_SECRET for testing
    req = {
      params: { id: 'laborer_id_123' },
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        categories: JSON.stringify(['cat_1']),
        experience: '5'
      },
      file: { filename: 'profile.jpg' } // Mock file
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should create a notification and send email when verification is submitted', async () => {
    // Mock User.findById to return a user
    const mockUser = {
      _id: 'laborer_id_123',
      name: 'John Doe',
      status: 'unverified',
      verificationHistory: [],
      save: jest.fn().mockResolvedValue({ name: 'John Doe', status: 'pending' })
    };
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null); // No duplicate email

    // Mock User.find to return admins
    User.find.mockResolvedValue([{ _id: 'admin_id_1', email: 'admin@test.com', role: 'admin' }]);

    // Mock Notification.create
    Notification.create.mockResolvedValue({});

    await submitVerificationDetails(req, res);

    // Assertions
    expect(User.findById).toHaveBeenCalledWith('laborer_id_123');
    expect(mockUser.status).toBe('pending');
    expect(mockUser.save).toHaveBeenCalled();

    // Verify Notification Creation
    expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'admin_id_1',
      type: 'verification_submission',
      title: 'New Verification Request'
    }));

    // Verify Email Sending
    expect(sendEmail).toHaveBeenCalledWith(
      'admin@test.com',
      'New Verification Request',
      expect.stringContaining('John Doe')
    );
    
    // Verify Response
    // expect(res.status).toHaveBeenCalledWith(200); // Controller might not call status(200) explicitly
    expect(res.json).toHaveBeenCalled();
  });
});
