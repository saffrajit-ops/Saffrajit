const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  type: {
    type: String,
    enum: ['popup', 'footer', 'sidebar'],
    default: 'sidebar'
  },
  link: {
    type: String,
    trim: true
  },
  linkText: {
    type: String,
    default: 'Shop Now'
  },

  // Page targeting (required for footer/sidebar, not for popup)
  pages: {
    type: [{
      type: String,
      enum: [
        'home',
        'skincare',
        'gifts',
        'product-detail',
        'checkout',
        'profile',
        'about',
        'cana-gold-story',
        'our-ingredients',
        'contact',
        'blog',
        'faq',
        'shipping',
        'privacy',
        'terms',
        'login',
        'register',
        'order-confirmation'
      ]
    }],
    default: []
  },
  // Category targeting (for product pages)
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // Advanced Triggers
  triggers: {
    // Device-Based Triggers
    device: {
      enabled: { type: Boolean, default: false },
      types: [{
        type: String,
        enum: ['mobile', 'tablet', 'desktop']
      }]
    },
    
    // User Behavior Triggers
    behavior: {
      enabled: { type: Boolean, default: false },
      scrollPercentage: { type: Number, min: 0, max: 100 }, // Show after X% scroll
      exitIntent: { type: Boolean, default: false }, // Show on exit intent
      addToCart: { type: Boolean, default: false }, // Show when item added to cart
      searchKeywords: [{ type: String, trim: true }] // Show based on search keywords
    },
    
    // User-Type Triggers
    userType: {
      enabled: { type: Boolean, default: false },
      types: [{
        type: String,
        enum: ['guest', 'logged-in', 'new-user', 'returning-user', 'premium']
      }]
    },
    
    // Inventory/Product-Based Triggers
    inventory: {
      enabled: { type: Boolean, default: false },
      outOfStock: { type: Boolean, default: false }, // Show if product out of stock
      codAvailable: { type: Boolean, default: false }, // Show if COD available
      specificCategories: [{ // Show for specific product categories
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }]
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clickCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
bannerSchema.index({ isActive: 1, type: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ pages: 1 });
bannerSchema.index({ 'triggers.device.enabled': 1 });
bannerSchema.index({ 'triggers.userType.enabled': 1 });

// Method to check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const isWithinDateRange = now >= this.startDate && (!this.endDate || now <= this.endDate);
  return this.isActive && isWithinDateRange;
};

// Static method to get active banners by type
bannerSchema.statics.getActiveBanners = async function(type) {
  const now = new Date();
  return this.find({
    isActive: true,
    type: type || { $exists: true },
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get banners by page
bannerSchema.statics.getBannersByPage = async function(page, type) {
  const now = new Date();
  const query = {
    isActive: true,
    pages: page,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  };

  if (type) {
    query.type = type;
  }

  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Banner', bannerSchema);
