const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  status: {
    type: String,
    enum: ['pending', 'subscribed', 'unsubscribed', 'bounced'],
    default: 'pending',
  },
  source: {
    type: String,
    enum: ['footer', 'newsletter-section', 'popup', 'other'],
    default: 'footer',
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: {
    type: Date,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Index for faster queries
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ createdAt: -1 });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
