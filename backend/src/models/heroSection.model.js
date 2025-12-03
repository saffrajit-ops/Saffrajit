const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
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
    default: 'DISCOVER COLLECTION',
  },
  buttonLink: {
    type: String,
    required: [true, 'Button link is required'],
    default: '/skincare',
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

// Ensure only one hero section exists
heroSectionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Only one hero section is allowed. Please update the existing one.');
    }
  }
  next();
});

const HeroSection = mongoose.model('HeroSection', heroSectionSchema);

module.exports = HeroSection;
