const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

describe('GET /api/bookings/:id authorization', () => {
  const custEmail = `cust_detail_${Date.now()}@example.com`;
  const custPhone = `+92300${Math.floor(1000000 + Math.random() * 8999999)}`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_detail_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';

  let customerToken;
  let otherCustomerToken;
  let laborerToken;
  let bookingId;

  afterAll(async () => {
    if (bookingId) {
      await Booking.deleteOne({ _id: bookingId });
    }
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
    await Customer.deleteOne({ email: `other_${custEmail}` });
    if (mongoose.connection.readyState === 1) {
    }
  });

  it('sets up laborer and customers', async () => {
    const regLab = await request(app).post('/api/users').send({
      name: 'Detail Laborer',
      email: laborerEmail,
      password: laborerPass,
      role: 'laborer',
    });
    expect([200, 201]).toContain(regLab.statusCode);

    const regCust = await request(app).post('/api/customers').send({
      firstName: 'Jane',
      lastName: 'Detail',
      email: custEmail,
      phone: custPhone,
      password: custPass,
      confirmPassword: custPass,
    });
    expect(regCust.statusCode).toBe(201);

    const loginCust = await request(app).post('/api/customers/login').send({
      email: custEmail,
      password: custPass,
    });
    expect(loginCust.statusCode).toBe(200);
    customerToken = loginCust.body.token;

    const loginLab = await request(app).post('/api/users/login').send({
      email: laborerEmail,
      password: laborerPass,
    });
    expect(loginLab.statusCode).toBe(200);
    laborerToken = loginLab.body.token;

    const regOther = await request(app).post('/api/customers').send({
      firstName: 'Other',
      lastName: 'User',
      email: `other_${custEmail}`,
      phone: `+92301${Math.floor(1000000 + Math.random() * 8999999)}`,
      password: custPass,
      confirmPassword: custPass,
    });
    expect(regOther.statusCode).toBe(201);

    const loginOther = await request(app).post('/api/customers/login').send({
      email: `other_${custEmail}`,
      password: custPass,
    });
    expect(loginOther.statusCode).toBe(200);
    otherCustomerToken = loginOther.body.token;
  });

  it('creates a booking as customer', async () => {
    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId: (await User.findOne({ email: laborerEmail }))._id.toString(),
        service: 'Electrical',
        serviceDescription: 'Detail test booking',
        scheduledAt,
        address: 'Detail Address',
        latitude: 33.7,
        longitude: 73.0,
        estimatedDurationMin: 60,
        price: 2000,
      });
    expect(create.statusCode).toBe(201);
    bookingId = create.body._id;
  });

  it('allows owning customer to fetch booking details', async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body._id).toBe(bookingId);
  });

  it('allows assigned laborer to fetch booking details', async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${laborerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body._id).toBe(bookingId);
  });

  it('denies other customers from fetching booking details', async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${otherCustomerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

