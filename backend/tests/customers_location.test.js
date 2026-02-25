const request = require('supertest');
const app = require('../server');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

describe('Customer location update', () => {
  let customer;
  let token;

  beforeAll(async () => {
    customer = await Customer.create({
      firstName: 'Loc',
      lastName: 'Tester',
      email: `loc_${Date.now()}@example.com`,
      password: 'hashed',
      status: 'active'
    });
    token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  });

  afterAll(async () => {
    if (customer) await Customer.findByIdAndDelete(customer._id);
  });

  it('updates customer location and persists', async () => {
    const payload = { latitude: 33.6844, longitude: 73.0479, address: 'Islamabad' };
    const res = await request(app)
      .put('/api/customers/me/location')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.currentLocation.address).toBe('Islamabad');
    const reloaded = await Customer.findById(customer._id);
    expect(reloaded.currentLocation.address).toBe('Islamabad');
  });
});
