const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

describe('Booking creation response includes required fields', () => {
  const custEmail = `cust_${Date.now()}@example.com`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';
  let customerToken;
  let laborerId;
  let bookingId;

  afterAll(async () => {
    if (bookingId) await Booking.deleteOne({ _id: bookingId });
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
  });

  it('prepares identities', async () => {
    const u = await request(app).post('/api/users').send({ name: 'Lab', email: laborerEmail, password: laborerPass, role: 'laborer' });
    expect([200,201]).toContain(u.statusCode);
    laborerId = u.body._id;
    const reg = await request(app).post('/api/customers').send({ firstName: 'Jane', lastName: 'Doe', email: custEmail, phone: `+92300${Math.floor(1000000 + Math.random()*8999999)}`, password: custPass, confirmPassword: custPass });
    expect(reg.statusCode).toBe(201);
    const login = await request(app).post('/api/customers/login').send({ email: custEmail, password: custPass });
    expect(login.statusCode).toBe(200);
    customerToken = login.body.token;
  }, 20000);

  it('returns complete booking document with associations', async () => {
    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const t0 = Date.now();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId,
        service: 'Electrical',
        scheduledAt,
        address: 'X Street',
        latitude: 33.7,
        longitude: 73.0,
        price: 1500
      });
    const t1 = Date.now();
    expect(res.statusCode).toBe(201);
    const b = res.body;
    bookingId = b._id;
    expect(b._id).toBeTruthy();
    expect(b.status).toBeTruthy();
    expect(b.createdAt).toBeTruthy();
    expect(b.updatedAt).toBeTruthy();
    expect(b.customer).toBeTruthy();
    expect(b.laborer).toBeTruthy();
    expect(b.scheduledAt).toBe(scheduledAt || b.scheduledAt);
    expect(t1 - t0).toBeLessThan(2000);
  }, 20000);
});
