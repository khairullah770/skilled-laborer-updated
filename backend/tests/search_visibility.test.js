const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ServiceOffering = require('../models/ServiceOffering');

describe('Laborer visibility by subcategory and online status', () => {
  let category, sub, approvedAvailable, approvedOfflineRecent, approvedOfflineOld, pendingAvailable;

  beforeAll(async () => {
    category = await Category.create({ name: `VisCat_${Date.now()}`, icon: 'uploads/icons/x.png' });
    sub = await Subcategory.create({
      category: category._id,
      name: `VisSub_${Date.now()}`,
      description: 'v',
      minPrice: 10,
      maxPrice: 1000,
      picture: 'uploads/pictures/x.png'
    });

    approvedAvailable = await User.create({
      name: 'Avail Online',
      email: `avail_${Date.now()}@example.com`,
      password: 'hashed',
      role: 'laborer',
      status: 'approved',
      isAvailable: true,
      currentLocation: { latitude: 33.7, longitude: 73.1, address: 'Loc' },
      rating: 4.2,
      lastActive: new Date(Date.now() - 30 * 1000)
    });
    await ServiceOffering.create({
      laborer: approvedAvailable._id,
      category: category._id,
      subcategory: sub._id,
      price: 50,
      isActive: true
    });

    approvedOfflineRecent = await User.create({
      name: 'Recent Online',
      email: `recent_${Date.now()}@example.com`,
      password: 'hashed',
      role: 'laborer',
      status: 'approved',
      isAvailable: false,
      currentLocation: { latitude: 33.7, longitude: 73.1, address: 'Loc' },
      lastActive: new Date(Date.now() - 2 * 60 * 1000) // within 5 minutes
    });
    await ServiceOffering.create({
      laborer: approvedOfflineRecent._id,
      category: category._id,
      subcategory: sub._id,
      price: 60,
      isActive: true
    });

    approvedOfflineOld = await User.create({
      name: 'Old Offline',
      email: `old_${Date.now()}@example.com`,
      password: 'hashed',
      role: 'laborer',
      status: 'approved',
      isAvailable: false,
      currentLocation: { latitude: 33.7, longitude: 73.1, address: 'Loc' },
      lastActive: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    });
    await ServiceOffering.create({
      laborer: approvedOfflineOld._id,
      category: category._id,
      subcategory: sub._id,
      price: 70,
      isActive: true
    });

    pendingAvailable = await User.create({
      name: 'Pending',
      email: `pending_${Date.now()}@example.com`,
      password: 'hashed',
      role: 'laborer',
      status: 'pending',
      isAvailable: true,
      currentLocation: { latitude: 33.7, longitude: 73.1, address: 'Loc' },
      lastActive: new Date()
    });
    await ServiceOffering.create({
      laborer: pendingAvailable._id,
      category: category._id,
      subcategory: sub._id,
      price: 80,
      isActive: true
    });
  });

  afterAll(async () => {
    await ServiceOffering.deleteMany({ subcategory: sub._id });
    await User.deleteMany({ email: /@(example\.com)$/ });
    if (sub) await Subcategory.findByIdAndDelete(sub._id);
    if (category) await Category.findByIdAndDelete(category._id);
  });

  it('returns only online (available or recently active) approved laborers with active offerings', async () => {
    const res = await request(app).get(`/api/services/search-laborers?subcategory=${sub._id}`);
    expect(res.statusCode).toBe(200);
    const names = (res.body.results || []).map(r => r.profile?.name).sort();
    // Default now includes all active approved (online + offline) unless onlineOnly=true
    expect(names).toContain('Avail Online');
    expect(names).toContain('Recent Online');
    expect(names).toContain('Old Offline');        // offline shown by default
    expect(names).not.toContain('Pending');            // not approved
  });

  it('filters to online only when onlineOnly=true', async () => {
    const res = await request(app).get(`/api/services/search-laborers?subcategory=${sub._id}&onlineOnly=true`);
    expect(res.statusCode).toBe(200);
    const names = (res.body.results || []).map(r => r.profile?.name).sort();
    expect(names).toContain('Avail Online');
    expect(names).toContain('Recent Online');
    expect(names).not.toContain('Old Offline');
    expect(names).not.toContain('Pending');
  });
});
