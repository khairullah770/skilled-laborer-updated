const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ServiceOffering = require('../models/ServiceOffering');
const Booking = require('../models/Booking');

describe('Booking service consistency between creation and job details', () => {
  const custEmail = `cust_service_${Date.now()}@example.com`;
  const custPass = 'Password1!';
  const laborerEmail = `lab_service_${Date.now()}@example.com`;
  const laborerPass = 'Password1!';

  let customerToken;
  let laborerToken;
  let laborerId;
  let categoryId;
  let subcategoryId;
  let offeringId;
  let bookingId;

  afterAll(async () => {
    if (bookingId) await Booking.deleteOne({ _id: bookingId });
    if (offeringId) await ServiceOffering.deleteOne({ _id: offeringId });
    if (subcategoryId) await Subcategory.deleteOne({ _id: subcategoryId });
    if (categoryId) await Category.deleteOne({ _id: categoryId });
    await User.deleteOne({ email: laborerEmail });
    await Customer.deleteOne({ email: custEmail });
  });

  it('sets up laborer with a service offering and customer', async () => {
    const u = await request(app)
      .post('/api/users')
      .send({ name: 'Service Lab', email: laborerEmail, password: laborerPass, role: 'laborer', status: 'approved' });
    expect([200, 201]).toContain(u.statusCode);
    laborerId = u.body._id;

    const cat = await Category.create({
      name: `SvcCat_${Date.now()}`,
      icon: 'uploads/icons/x.png',
    });
    categoryId = cat._id;
    const sub = await Subcategory.create({
      category: categoryId,
      name: `SvcSub_${Date.now()}`,
      description: 'Test sub',
      minPrice: 100,
      maxPrice: 1000,
      picture: 'uploads/pictures/x.png',
    });
    subcategoryId = sub._id;

    const off = await ServiceOffering.create({
      laborer: laborerId,
      category: categoryId,
      subcategory: subcategoryId,
      price: 750,
      description: 'Ceiling fan installation',
      isActive: true,
    });
    offeringId = off._id;

    const reg = await request(app)
      .post('/api/customers')
      .send({
        firstName: 'Service',
        lastName: 'Customer',
        email: custEmail,
        phone: `+92300${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: custPass,
        confirmPassword: custPass,
      });
    expect(reg.statusCode).toBe(201);
    const loginCust = await request(app)
      .post('/api/customers/login')
      .send({ email: custEmail, password: custPass });
    expect(loginCust.statusCode).toBe(200);
    customerToken = loginCust.body.token;

    const loginLab = await request(app)
      .post('/api/users/login')
      .send({ email: laborerEmail, password: laborerPass });
    expect(loginLab.statusCode).toBe(200);
    laborerToken = loginLab.body.token;
  }, 30000);

  it('creates a booking using offeringId and enforces service consistency', async () => {
    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId,
        offeringId,
        service: 'Wrong name from client',
        serviceDescription: 'Need ceiling fan installation in living room',
        scheduledAt,
        address: 'Svc Address',
        latitude: 33.7,
        longitude: 73.0,
        estimatedDurationMin: 60,
        price: 1,
      });
    expect(res.statusCode).toBe(201);
    const b = res.body;
    bookingId = b._id;
    expect(b.service).toBeTruthy();
    expect(b.compensation).toBe(750);
  }, 20000);

  it('returns the same service details in laborer jobs and booking detail', async () => {
    const jobs = await request(app)
      .get('/api/bookings/laborer')
      .set('Authorization', `Bearer ${laborerToken}`);
    expect(jobs.statusCode).toBe(200);
    const job = (jobs.body.upcoming || []).find((x) => x._id === bookingId);
    expect(job).toBeTruthy();

    const detail = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${laborerToken}`);
    expect(detail.statusCode).toBe(200);

    expect(job.service).toBe(detail.body.service);
    expect(job.compensation).toBe(detail.body.compensation);
    expect(new Date(job.scheduledAt).toISOString()).toBe(new Date(detail.body.scheduledAt).toISOString());
    expect(job.location.address).toBe(detail.body.location.address);
  }, 25000);
});

