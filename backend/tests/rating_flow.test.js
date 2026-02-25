const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../utils/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  notifyAdmin: jest.fn().mockResolvedValue(true),
  sendPushNotification: jest.fn().mockResolvedValue(true),
}));

const app = require('../server');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const JobRating = require('../models/JobRating');
const { sendPushNotification } = require('../utils/notificationService');

describe('Job rating flow', () => {
  let laborer;
  let customer;
  let customerToken;
  let laborerToken;
  let bookingId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    await JobRating.deleteMany({});
    await Booking.deleteMany({});
    await User.deleteMany({ email: /rating_test_laborer/ });
    await Customer.deleteMany({ email: /rating_test_customer/ });

    const laborerEmail = `rating_test_laborer_${Date.now()}@example.com`;
    const customerEmail = `rating_test_customer_${Date.now()}@example.com`;

    const laborerRes = await request(app).post('/api/users').send({
      name: 'Rating Test Laborer',
      email: laborerEmail,
      password: 'Password1!',
      phone: `0000${Math.floor(100000 + Math.random() * 899999)}`,
      role: 'laborer',
    });
    laborer = await User.findById(laborerRes.body._id);

    const loginLaborer = await request(app).post('/api/users/login').send({
      email: laborerEmail,
      password: 'Password1!',
    });
    laborerToken = loginLaborer.body.token;

    const registerCustomer = await request(app).post('/api/customers').send({
      firstName: 'Jane',
      lastName: 'Rater',
      email: customerEmail,
      phone: `+92300${Math.floor(1000000 + Math.random() * 8999999)}`,
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });
    customer = await Customer.findById(registerCustomer.body._id);

    const loginCustomer = await request(app).post('/api/customers/login').send({
      email: customerEmail,
      password: 'Password1!',
    });
    customerToken = loginCustomer.body.token;

    const scheduledAt = new Date().toISOString();
    const createBooking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId: laborer._id.toString(),
        service: 'Plumbing',
        serviceDescription: 'Fix sink',
        scheduledAt,
        address: 'Test Address',
        latitude: 33.6844,
        longitude: 73.0479,
        price: 1000,
      });
    bookingId = createBooking.body._id;

    await request(app)
      .put(`/api/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${laborerToken}`);
    await request(app)
      .put(`/api/bookings/${bookingId}/start`)
      .set('Authorization', `Bearer ${laborerToken}`);
    await request(app)
      .put(`/api/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${laborerToken}`);
  });

  it('allows customer to rate a completed job and updates laborer rating', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Excellent service, very professional.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.averageRating).toBe(5);

    const updatedLaborer = await User.findById(laborer._id);
    expect(updatedLaborer.rating).toBe(5);

    const ratingDoc = await JobRating.findOne({ booking: bookingId, customer: customer._id });
    expect(ratingDoc).toBeTruthy();
  });

  it('prevents duplicate ratings for the same job and customer', async () => {
    const first = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 4,
        comment: 'Good job overall.',
      });
    expect(first.statusCode).toBe(201);

    const second = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Trying to rate again.',
      });
    expect(second.statusCode).toBe(400);
  });

  it('enforces rating value constraints', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 6,
        comment: 'Too high rating value.',
      });
    expect(res.statusCode).toBe(400);
  });

  it('calls push notification on successful rating', async () => {
    sendPushNotification.mockClear();

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Notification test review.',
      });

    expect(res.statusCode).toBe(201);
    expect(sendPushNotification).toHaveBeenCalled();
  });

  it('handles push notification failure gracefully', async () => {
    sendPushNotification.mockRejectedValueOnce(new Error('Push service down'));

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Failure scenario review.',
      });

    expect(res.statusCode).toBe(201);
  });

  it('prevents rating non-completed jobs', async () => {
    const scheduledAt = new Date().toISOString();
    const createBooking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        laborerId: laborer._id.toString(),
        service: 'Electrical',
        serviceDescription: 'Check wiring',
        scheduledAt,
        address: 'Another Address',
        latitude: 33.6844,
        longitude: 73.0479,
        price: 1500,
      });
    const pendingBookingId = createBooking.body._id;

    const res = await request(app)
      .post(`/api/bookings/${pendingBookingId}/rate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 4,
        comment: 'Trying to rate pending job.',
      });

    expect(res.statusCode).toBe(400);
  });
});
