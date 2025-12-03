const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    default: 'single'
  },
  title: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    default: 'Cana Gold',
    trim: true
  },
  shortDescription: {
    type: String
  },
  description: {
    type: String
  },
  benefits: [{
    type: String
  }],
  howToApply: {
    type: String
  },
  ingredientsText: {
    type: String
  },
  ingredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient'
  }],
  price: {
    type: Number,
    default: 0
  },
  compareAtPrice: {
    type: Number
  },
  discount: {
    value: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },
  shipping: {
    charges: {
      type: Number,
      default: 0
    },
    freeShippingThreshold: {
      type: Number,
      default: 0
    },
    freeShippingMinQuantity: {
      type: Number,
      default: 0
    }
  },
  // Cash on Delivery settings
  cashOnDelivery: {
    enabled: {
      type: Boolean,
      default: false // Default: COD not available
    }
  },
  // Return policy settings
  returnPolicy: {
    returnable: {
      type: Boolean,
      default: false // Default: Non-returnable
    },
    returnWindowDays: {
      type: Number,
      default: 7 // Default 7 days return window (if returnable is set to true)
    }
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  stock: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  images: [{
    url: {
      type: String
    },
    publicId: {
      type: String
    },
    alt: {
      type: String,
      default: ''
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  attributes: {
    shade: String,
    size: String,
    skinType: String
  },
  ratingAvg: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  collection: {
    type: String,
    trim: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  concern: [{
    type: String,
    trim: true
  }],
  components: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    qty: {
      type: Number
    }
  }],
  relatedProductIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  meta: {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String
  },
  viewCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (slug and sku indexes are created by unique: true in field definitions)
productSchema.index({ title: 'text', brand: 'text', ingredientsText: 'text' });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratingAvg: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ collection: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ concern: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Pre-save middleware to generate slug if not provided
productSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static method to find similar products
productSchema.statics.findSimilar = function (productId, categories, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    categories: { $in: categories },
    isActive: true,
    stock: { $gt: 0 }
  })
    .sort({ ratingAvg: -1, salesCount: -1 })
    .limit(limit);
};

// Static method to find by category
productSchema.statics.findByCategory = function (category, options = {}) {
  const { page = 1, limit = 12, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  return this.find({
    categories: category,
    isActive: true
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Method to increment view count
productSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
