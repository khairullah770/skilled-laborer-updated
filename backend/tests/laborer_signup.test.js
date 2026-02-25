const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Laborer signup flow', () => {
  const baseEmail = `laborer_signup_${Date.now()}@example.com`;
  const password = 'Password1!';

  afterAll(async () => {
    await User.deleteMany({ email: new RegExp(`^laborer_signup_`) });
    await User.deleteMany({ phone: '+923001234567' });
  });

  it('registers laborer with email successfully', async () => {
    const res = await request(app).post('/api/users').send({
      email: baseEmail,
      password,
      role: 'laborer',
    });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('laborer');
    expect(res.body.status).toBe('unverified');
  });

  it('prevents duplicate laborer signup with same email', async () => {
    const res = await request(app).post('/api/users').send({
      email: baseEmail,
      password,
      role: 'laborer',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('validates phone format for laborer', async () => {
    const bad = await request(app).post('/api/users').send({
      phone: '03001234567',
      password,
      role: 'laborer',
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.body.message).toBe('Phone must be in format +92XXXXXXXXXX');

    const good = await request(app).post('/api/users').send({
      phone: '+923001234567',
      password,
      role: 'laborer',
    });
    expect([200, 201]).toContain(good.statusCode);
    expect(good.body.role).toBe('laborer');
  });

  it('rejects signup when passwords do not match if confirmPassword provided', async () => {
    const res = await request(app).post('/api/users').send({
      email: `laborer_mismatch_${Date.now()}@example.com`,
      password,
      confirmPassword: 'OtherPass1!',
      role: 'laborer',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Passwords do not match');
  });
});

