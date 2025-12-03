const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema({
  // Contact Information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  
  // Social Media Links
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    pinterest: String,
    youtube: String,
  },
  
  // Business Hours
  businessHours: {
    monday: { type: String, default: '9:00 AM - 5:00 PM' },
    tuesday: { type: String, default: '9:00 AM - 5:00 PM' },
    wednesday: { type: String, default: '9:00 AM - 5:00 PM' },
    thursday: { type: String, default: '9:00 AM - 5:00 PM' },
    friday: { type: String, default: '9:00 AM - 5:00 PM' },
    saturday: { type: String, default: 'Closed' },
    sunday: { type: String, default: 'Closed' },
  },
  
  // Company Details
  companyName: {
    type: String,
    default: 'CANAGOLD',
  },
  tagline: String,
  description: String,
  foundedYear: {
    type: Number,
    default: 2009,
  },
  
  // Footer Text
  copyrightText: {
    type: String,
    default: '© 2009 - 2022 CANAGOLD. ALL RIGHTS RESERVED. WEBSITE BY FIXL SOLUTIONS.',
  },
  
}, {
  timestamps: true,
});

// Ensure only one company info document exists
companyInfoSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Only one company info document is allowed. Please update the existing one.');
    }
  }
  next();
});

const CompanyInfo = mongoose.model('CompanyInfo', companyInfoSchema);

module.exports = CompanyInfo;
