const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

describe('Booking visibility across customer and laborer', () => {
  const custEmail = `cust_${Date.now()}@example.com`;
  const custPhone = `+92300${Math.floor(1000000 + Math.random()*8999999)}`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';

  let customerToken;
  let laborerToken;
  let laborerId;
  let bookingId;
  let customerId;

  afterAll(async () => {
    if (bookingId) {
      await Booking.deleteOne({ _id: bookingId });
    }
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
    // Close mongoose connections if opened by tests
    if (mongoose.connection.readyState === 1) {
      // leave open for other test files
    }
  });

  it('registers laborer user', async () => {
    const res = await request(app).post('/api/users').send({
      name: 'Test Laborer',
      email: laborerEmail,
      password: laborerPass,
      role: 'laborer'
    });
    expect([200,201]).toContain(res.statusCode);
    laborerId = res.body._id || (await User.findOne({ email: laborerEmail }))._id.toString();
  });

  it('registers and logs in customer', async () => {
    const reg = await request(app).post('/api/customers').send({
      firstName: 'Jane',
      lastName: 'Doe',
      email: custEmail,
      phone: custPhone,
      password: custPass,
      confirmPassword: custPass
    });
    expect(reg.statusCode).toBe(201);
    const login = await request(app).post('/api/customers/login').send({
      email: custEmail,
      password: custPass
    });
    expect(login.statusCode).toBe(200);
    customerToken = login.body.token;
    customerId = login.body._id;
  });

  it('logs in laborer and creates booking as customer', async () => {
    const lLogin = await request(app).post('/api/users/login').send({
      email: laborerEmail,
      password: laborerPass
    });
    expect(lLogin.statusCode).toBe(200);
    laborerToken = lLogin.body.token;

    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId,
        service: 'Electrical',
        serviceDescription: 'Fix light',
        scheduledAt,
        address: 'Test Address',
        latitude: 33.7,
        longitude: 73.0,
        estimatedDurationMin: 45,
        price: 1600
      });
    expect(create.statusCode).toBe(201);
    expect(create.body._id).toBeTruthy();
    bookingId = create.body._id;
  });

  it('shows booking in customer upcoming list', async () => {
    const my = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(my.statusCode).toBe(200);
    const ids = (my.body.upcoming || []).map(b => b._id);
    expect(ids).toContain(bookingId);
  });

  it('shows booking in laborer upcoming jobs with populated customer', async () => {
    const jobs = await request(app)
      .get('/api/bookings/laborer')
      .set('Authorization', `Bearer ${laborerToken}`);
    expect(jobs.statusCode).toBe(200);
    const item = (jobs.body.upcoming || []).find(b => b._id === bookingId);
    expect(item).toBeTruthy();
    // Customer populate should have a name
    expect(item.customer && item.customer.name).toBeTruthy();
  });
});

