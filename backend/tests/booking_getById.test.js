const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

describe('GET /api/bookings/:id returns populated customer for laborer', () => {
  const custEmail = `cust_getby_${Date.now()}@example.com`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_getby_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';
  let customerToken;
  let laborerToken;
  let laborerId;
  let bookingId;

  afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
  });

  it('sets up customer and laborer and booking', async () => {
    const l = await request(app)
      .post('/api/users')
      .send({ name: 'Laborer GetBy', email: laborerEmail, password: laborerPass, role: 'laborer' });
    expect([200, 201]).toContain(l.statusCode);
    laborerId = l.body._id;

    const reg = await request(app)
      .post('/api/customers')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: custEmail,
        phone: '+921234567890',
        password: custPass,
        confirmPassword: custPass,
      });
    expect(reg.statusCode).toBe(201);

    const loginCustomer = await request(app)
      .post('/api/customers/login')
      .send({ email: custEmail, password: custPass });
    expect(loginCustomer.statusCode).toBe(200);
    customerToken = loginCustomer.body.token;

    const loginLaborer = await request(app)
      .post('/api/users/login')
      .send({ email: laborerEmail, password: laborerPass });
    expect(loginLaborer.statusCode).toBe(200);
    laborerToken = loginLaborer.body.token;

    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId,
        service: 'Electrical',
        serviceDescription: 'Fix light',
        scheduledAt,
        address: 'Test GetById Address',
        latitude: 33.7,
        longitude: 73.0,
        estimatedDurationMin: 60,
        price: 1800,
      });
    expect(create.statusCode).toBe(201);
    expect(create.body && create.body._id).toBeTruthy();
    bookingId = create.body._id;
  }, 25000);

  it('allows laborer to fetch booking with populated customer', async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${laborerToken}`);
    expect(res.statusCode).toBe(200);
    const b = res.body;
    expect(b._id).toBe(bookingId);
    expect(b.customer).toBeTruthy();
    expect(b.customer.name).toBeTruthy();
    expect(b.customer.email).toBeTruthy();
    expect(b.customer.phone).toBeTruthy();
    expect(b.location && b.location.address).toBeTruthy();
  }, 20000);
});

