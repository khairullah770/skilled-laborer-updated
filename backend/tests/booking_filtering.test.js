const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

describe('Booking filtering for upcoming and past', () => {
  const custEmail = `cust_${Date.now()}@example.com`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';
  let customerToken;
  let laborerId;

  afterAll(async () => {
    await Booking.deleteMany({}); // cleanup test-created docs
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
  });

  it('sets up identities', async () => {
    const u = await request(app).post('/api/users').send({ name: 'Lab', email: laborerEmail, password: laborerPass, role: 'laborer' });
    expect([200,201]).toContain(u.statusCode);
    laborerId = u.body._id;
    const reg = await request(app).post('/api/customers').send({ firstName: 'Jane', lastName: 'Doe', email: custEmail, phone: `+92300${Math.floor(1000000 + Math.random()*8999999)}`, password: custPass, confirmPassword: custPass });
    expect(reg.statusCode).toBe(201);
    const login = await request(app).post('/api/customers/login').send({ email: custEmail, password: custPass });
    expect(login.statusCode).toBe(200);
    customerToken = login.body.token;
  }, 20000);

  it('creates pending future, pending past, completed past and cancelled past and validates filters', async () => {
    const now = Date.now();
    const future = new Date(now + 3600_000).toISOString(); // +1h
    const earlierToday = new Date(now - 3600_000).toISOString(); // -1h

    // Pending future booking (should show in upcoming)
    const b1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ laborerId, service: 'Test', scheduledAt: future, address: 'A', latitude: 0, longitude: 0, price: 100 });
    expect(b1.statusCode).toBe(201);

    // Pending past booking: create then manually set date to past (should still show in upcoming)
    const b2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ laborerId, service: 'Test', scheduledAt: future, address: 'A', latitude: 0, longitude: 0, price: 100 });
    expect(b2.statusCode).toBe(201);
    await Booking.updateOne({ _id: b2.body._id }, { $set: { scheduledAt: new Date(earlierToday) } });

    // Completed past booking (should show in past only)
    const b3 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ laborerId, service: 'Test', scheduledAt: earlierToday, address: 'A', latitude: 0, longitude: 0, price: 100 });
    expect(b3.statusCode).toBe(201);
    await Booking.updateOne({ _id: b3.body._id }, { $set: { status: 'Completed' } });

    // Cancelled past booking (should not show in past)
    const b4 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ laborerId, service: 'Test', scheduledAt: earlierToday, address: 'A', latitude: 0, longitude: 0, price: 100 });
    expect(b4.statusCode).toBe(201);
    await Booking.updateOne({ _id: b4.body._id }, { $set: { status: 'Cancelled' } });

    // Legacy "waiting for laborer approval" status should still be treated as pending
    const b5 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ laborerId, service: 'Test', scheduledAt: future, address: 'A', latitude: 0, longitude: 0, price: 100 });
    expect(b5.statusCode).toBe(201);
    await Booking.updateOne({ _id: b5.body._id }, { $set: { status: 'waiting for laborer approval' } });

    // Validate filters
    const my = await request(app).get('/api/bookings/my').set('Authorization', `Bearer ${customerToken}`);
    expect(my.statusCode).toBe(200);
    const upcomingIds = (my.body.upcoming || []).map(x => x._id);
    const pastIds = (my.body.past || []).map(x => x._id);

    expect(upcomingIds).toContain(b1.body._id);
    expect(upcomingIds).toContain(b2.body._id);
    expect(upcomingIds).toContain(b5.body._id);
    expect(pastIds).toContain(b3.body._id);
    expect(pastIds).not.toContain(b4.body._id);
  }, 25000);
});
