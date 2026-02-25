const request = require('supertest');
const app = require('../server');
const Customer = require('../models/Customer');

describe('Customer signup to login flow', () => {
  const email = `cust_${Date.now()}@example.com`;
  const phone = `+92300${Math.floor(1000000 + Math.random()*8999999)}`;
  const password = 'Password1!';
  let token;

  afterAll(async () => {
    await Customer.deleteOne({ email });
  });

  it('signs up a new customer in separate DB', async () => {
    const res = await request(app).post('/api/customers').send({
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      phone,
      password,
      confirmPassword: password,
    });
    expect(res.statusCode).toBe(201);
    const doc = await Customer.findOne({ email });
    expect(doc).toBeTruthy();
  });

  it('logs in with email and fetches profile', async () => {
    const login = await request(app).post('/api/customers/login').send({
      email,
      password,
    });
    expect(login.statusCode).toBe(200);
    token = login.body.token;
    expect(token).toBeTruthy();
    const me = await request(app)
      .get('/api/customers/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.statusCode).toBe(200);
    expect(me.body.email).toBe(email);
  });
});
