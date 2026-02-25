const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ServiceOffering = require('../models/ServiceOffering');

describe('Search laborers by subcategory', () => {
  let laborer;
  let category;
  let subcategory;

  beforeAll(async () => {
    category = await Category.create({
      name: `Test Category ${Date.now()}`,
      icon: 'uploads/icons/test.png'
    });
    subcategory = await Subcategory.create({
      category: category._id,
      name: `Test Sub ${Date.now()}`,
      description: 'desc',
      minPrice: 10,
      maxPrice: 1000,
      picture: 'uploads/pictures/test.png'
    });
    laborer = await User.create({
      name: 'Test Laborer',
      email: `laborer_${Date.now()}@example.com`,
      password: 'hashed',
      role: 'laborer',
      status: 'approved',
      isAvailable: true,
      rating: 4.5,
      currentLocation: { latitude: 33.65, longitude: 73.09, address: 'Test' },
      lastActive: new Date()
    });
    await ServiceOffering.create({
      laborer: laborer._id,
      category: category._id,
      subcategory: subcategory._id,
      price: 50,
      description: 'service',
      isActive: true
    });
  });

  afterAll(async () => {
    if (laborer) await User.findByIdAndDelete(laborer._id);
    if (subcategory) await Subcategory.findByIdAndDelete(subcategory._id);
    if (category) await Category.findByIdAndDelete(category._id);
    await ServiceOffering.deleteMany({});
  });

  it('returns active laborers for subcategory', async () => {
    const res = await request(app).get(`/api/services/search-laborers?subcategory=${subcategory._id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    const item = res.body.results[0];
    expect(item.profile.name).toBe('Test Laborer');
    expect(item.price).toBe(50);
  });
});
