const request = require('supertest');
const app = require('../server');

describe('Customer Signup Validation', () => {
  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/users').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@invalid',
      phone: '+923001234567',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      role: 'customer',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Invalid email format/i);
  });

  it('rejects invalid phone format', async () => {
    const res = await request(app).post('/api/users').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      phone: '03001234567',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      role: 'customer',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/\+92/i);
  });

  it('rejects mismatched passwords', async () => {
    const res = await request(app).post('/api/users').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      phone: '+923001234567',
      password: 'Password1!',
      confirmPassword: 'Password2!',
      role: 'customer',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Passwords do not match/i);
  });
});
