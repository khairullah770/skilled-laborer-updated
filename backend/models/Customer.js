const mongoose = require('mongoose');
// Use main Skilled Labor App database connection

const CustomerSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    name: { type: String, trim: true }, // Optional denormalized full name
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    phone: { type: String, trim: true, unique: true, sparse: true, index: true },
    password: { type: String, required: true, select: true },
    profileImage: { type: String },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, trim: true }
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

CustomerSchema.pre('save', function (next) {
  if (!this.name) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  next();
});

// Indexes for efficient location-related queries
CustomerSchema.index({ 'currentLocation.address': 1 });
CustomerSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
