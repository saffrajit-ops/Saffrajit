const mongoose = require('mongoose');

const taxonomySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['collection', 'category', 'concern', 'gift-type'],
      message: 'Type must be one of: collection, category, concern, gift-type'
    }
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taxonomy',
    default: null
  },
  position: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    url: String,
    publicId: String,
    alt: String
  },
  meta: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
taxonomySchema.index({ slug: 1 }, { unique: true });
taxonomySchema.index({ type: 1, name: 1 });
taxonomySchema.index({ parentId: 1 });
taxonomySchema.index({ isActive: 1 });

// Virtual for children
taxonomySchema.virtual('children', {
  ref: 'Taxonomy',
  localField: '_id',
  foreignField: 'parentId'
});

// Pre-save middleware to generate slug if not provided
taxonomySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static method to find by type
taxonomySchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true }).sort({ position: 1, name: 1 });
};

// Static method to find with children
taxonomySchema.statics.findWithChildren = function(filter = {}) {
  return this.find(filter).populate('children').sort({ position: 1, name: 1 });
};

module.exports = mongoose.model('Taxonomy', taxonomySchema);