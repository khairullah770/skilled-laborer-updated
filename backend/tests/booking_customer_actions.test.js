const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

describe('Customer booking cancel and reschedule rules', () => {
  const custEmail = `cust_actions_${Date.now()}@example.com`;
  const custPhone = `+92300${Math.floor(1000000 + Math.random() * 8999999)}`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_actions_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';

  let customerToken;
  let laborerToken;
  let laborerId;
  let bookingId;

  afterAll(async () => {
    if (bookingId) {
      await Booking.deleteOne({ _id: bookingId });
    }
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
    await Notification.deleteMany({ 'data.bookingId': bookingId });
    if (mongoose.connection.readyState === 1) {
    }
  });

  it('sets up laborer and customer and booking', async () => {
    const regLab = await request(app).post('/api/users').send({
      name: 'Actions Laborer',
      email: laborerEmail,
      password: laborerPass,
      role: 'laborer',
    });
    expect([200, 201]).toContain(regLab.statusCode);
    laborerId = (await User.findOne({ email: laborerEmail }))._id.toString();

    const regCust = await request(app).post('/api/customers').send({
      firstName: 'Jane',
      lastName: 'Actions',
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

    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId,
        service: 'Electrical',
        serviceDescription: 'Actions test booking',
        scheduledAt,
        address: 'Actions Address',
        latitude: 33.7,
        longitude: 73.0,
        estimatedDurationMin: 60,
        price: 2000,
      });
    expect(create.statusCode).toBe(201);
    bookingId = create.body._id;
  });

  it('allows reschedule when pending and sends notification to laborer', async () => {
    const newTime = new Date(Date.now() + 7200_000).toISOString();
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/reschedule`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ scheduledAt: newTime });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Rescheduled');

    const notif = await Notification.findOne({
      recipient: laborerId,
      title: 'Booking Rescheduled',
      'data.bookingId': bookingId,
    });
    expect(notif).toBeTruthy();
  });

  it('prevents cancel and reschedule after booking is accepted', async () => {
    const accept = await request(app)
      .put(`/api/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${laborerToken}`)
      .send();
    expect(accept.statusCode).toBe(200);
    expect(accept.body.status).toBe('Accepted');

    const cancelAttempt = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send();
    expect(cancelAttempt.statusCode).toBe(400);
    expect(cancelAttempt.body.message).toMatch(/cannot cancel/i);

    const newTime = new Date(Date.now() + 10800_000).toISOString();
    const rescheduleAttempt = await request(app)
      .put(`/api/bookings/${bookingId}/reschedule`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ scheduledAt: newTime });
    expect(rescheduleAttempt.statusCode).toBe(400);
    expect(rescheduleAttempt.body.message).toMatch(/cannot reschedule/i);
  });
});

