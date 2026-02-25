const mongoose = require('mongoose');
const ServiceOffering = require('../models/ServiceOffering');
const Subcategory = require('../models/Subcategory');
const User = require('../models/User');

// Ensure requester is an approved laborer
const assertApprovedLaborer = async (req) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'laborer') {
    const err = new Error('Only laborers can manage services');
    err.statusCode = 403;
    throw err;
  }
  if (user.status !== 'approved') {
    const err = new Error('Account is not verified');
    err.statusCode = 403;
    throw err;
  }
  return user;
};

// POST /api/services
// Create or update a service offering for the current laborer
const upsertServiceOffering = async (req, res) => {
  try {
    const laborer = await assertApprovedLaborer(req);
    const { subcategoryId, price, description } = req.body;

    if (!subcategoryId || price == null) {
      return res.status(400).json({ message: 'subcategoryId and price are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ message: 'Invalid subcategoryId' });
    }

    const sub = await Subcategory.findById(subcategoryId);
    if (!sub) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum)) {
      return res.status(400).json({ message: 'Price must be a number' });
    }

    if (priceNum < sub.minPrice || priceNum > sub.maxPrice) {
      return res.status(400).json({ message: `Price must be between ${sub.minPrice} and ${sub.maxPrice}` });
    }

    const payload = {
      laborer: req.user._id,
      category: sub.category,
      subcategory: sub._id,
      price: priceNum,
      description: description || '',
      isActive: !!laborer.isAvailable,
    };

    // Upsert by laborer + subcategory
    const offering = await ServiceOffering.findOneAndUpdate(
      { laborer: req.user._id, subcategory: sub._id },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('category', 'name icon').populate('subcategory', 'name minPrice maxPrice');

    res.status(201).json(offering);
  } catch (error) {
    console.error('upsertServiceOffering error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// GET /api/services/mine
// List current laborer's service offerings
const listMyOfferings = async (req, res) => {
  try {
    await assertApprovedLaborer(req);
    const offerings = await ServiceOffering.find({ laborer: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('category', 'name icon')
      .populate('subcategory', 'name minPrice maxPrice');
    res.json(offerings);
  } catch (error) {
    console.error('listMyOfferings error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/services/:id
// Delete a service offering owned by current laborer
const deleteServiceOffering = async (req, res) => {
  try {
    await assertApprovedLaborer(req);
    const off = await ServiceOffering.findById(req.params.id);
    if (!off) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (off.laborer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await off.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    console.error('deleteServiceOffering error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  upsertServiceOffering,
  listMyOfferings,
  deleteServiceOffering,
  async searchLaborers(req, res) {
    try {
      const { subcategory, page = 1, limit = 20, minPrice, maxPrice, minRating, nearLat, nearLng, radiusKm, onlineOnly, includeUnapproved, debug } = req.query;
      if (!subcategory) return res.status(400).json({ message: 'subcategory is required' });
      const q = { subcategory, isActive: true };
      if (minPrice != null) q.price = Object.assign(q.price || {}, { $gte: Number(minPrice) });
      if (maxPrice != null) q.price = Object.assign(q.price || {}, { $lte: Number(maxPrice) });
      const skip = (Number(page) - 1) * Number(limit);
      let offerings = await ServiceOffering.find(q)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('subcategory', 'name minPrice maxPrice');
      if (offerings.length === 0) {
        try {
          const subDoc = await Subcategory.findById(subcategory).lean();
          if (subDoc?.name) {
            const sameNameSubs = await Subcategory.find({ name: subDoc.name }).select('_id').lean();
            const ids = sameNameSubs.map(s => s._id);
            if (ids.length > 0) {
              offerings = await ServiceOffering.find({ subcategory: { $in: ids }, isActive: true })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('subcategory', 'name minPrice maxPrice');
            }
          }
        } catch {}
      }
      const laborerIds = offerings.map(o => o.laborer);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const users = await User.find({
        _id: { $in: laborerIds },
        role: 'laborer'
      }).select('name profileImage rating experience currentLocation isAvailable lastActive status completedJobs');
      const userMap = new Map(users.map(u => [u._id.toString(), u]));
      let approvedCount = 0, onlineCount = 0;
      const data = offerings.map(o => {
        const u = userMap.get(o.laborer.toString());
        const online = !!u && (!!u.isAvailable || (u.lastActive && u.lastActive > fiveMinAgo));
        if (u && u.status === 'approved') approvedCount++;
        if (online) onlineCount++;
        let distanceKm = null;
        if (u?.currentLocation?.latitude != null && nearLat != null && nearLng != null) {
          const toRad = d => (d * Math.PI) / 180;
          const R = 6371;
          const dLat = toRad(u.currentLocation.latitude - Number(nearLat));
          const dLon = toRad(u.currentLocation.longitude - Number(nearLng));
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(nearLat))) * Math.cos(toRad(u.currentLocation.latitude)) * Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = R * c;
        }
        return {
          laborerId: o.laborer.toString(),
          price: o.price,
          subcategory: o.subcategory,
          profile: u ? {
            name: u.name,
            profileImage: u.profileImage,
            rating: u.rating || 0,
            experience: u.experience || '',
            currentLocation: u.currentLocation || null,
            online,
            status: u.status,
            completedJobs: u.completedJobs || 0
          } : null,
          distanceKm
        };
      }).filter(item => {
        if (!includeUnapproved || includeUnapproved === 'false') {
          if (!item.profile || item.profile.status !== 'approved') return false;
        }
        if (onlineOnly === 'true') {
          if (!item.profile || !item.profile.online) return false;
        }
        if (minRating != null && item.profile) {
          if ((item.profile.rating || 0) < Number(minRating)) return false;
        }
        if (radiusKm != null && item.distanceKm != null) {
          if (item.distanceKm > Number(radiusKm)) return false;
        }
        return true;
      });
      if (debug === 'true') {
        return res.json({
          results: data,
          page: Number(page),
          limit: Number(limit),
          count: data.length,
          meta: {
            offeringsCount: offerings.length,
            usersFetched: users.length,
            approvedCount,
            onlineCount
          }
        });
      }
      res.json({ results: data, page: Number(page), limit: Number(limit), count: data.length });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
};
