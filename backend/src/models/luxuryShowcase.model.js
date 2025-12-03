const mongoose = require('mongoose');

const luxuryShowcaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  subtitle: {
    type: String,
    required: [true, 'Subtitle is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  buttonText: {
    type: String,
    required: [true, 'Button text is required'],
    default: 'EXPLORE GIFT SETS',
  },
  buttonLink: {
    type: String,
    required: [true, 'Button link is required'],
    default: '/gifts',
  },
  video: {
    url: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    publicId: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    format: {
      type: String,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure only one luxury showcase exists
luxuryShowcaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Only one luxury showcase is allowed. Please update the existing one.');
    }
  }
  next();
});

const LuxuryShowcase = mongoose.model('LuxuryShowcase', luxuryShowcaseSchema);

module.exports = LuxuryShowcase;
