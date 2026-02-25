const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');

describe('Customers data isolation', () => {
  it('creates customer in Customers DB and not in Users collection', async () => {
    const uniqueEmail = `jane_${Date.now()}@example.com`;
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: uniqueEmail,
      phone: `+92300${Math.floor(1000000 + Math.random()*8999999)}`,
      password: 'Password1!',
      confirmPassword: 'Password1!',
    };
    const res = await request(app).post('/api/customers').send(payload);
    expect(res.statusCode).toBe(201);
    const c = await Customer.findOne({ email: uniqueEmail });
    expect(c).toBeTruthy();
    const u = await User.findOne({ email: uniqueEmail });
    expect(u).toBeFalsy();
  });
});
