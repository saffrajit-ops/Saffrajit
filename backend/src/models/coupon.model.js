const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  type: {
    type: String,
    enum: ['flat', 'percent'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minSubtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  startsAt: {
    type: Date,
    default: Date.now
  },
  endsAt: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  appliesTo: {
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    taxonomyIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries (code index is created by unique: true)
couponSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

// Validation: percent coupons should not exceed 100%
couponSchema.pre('save', function(next) {
  if (this.type === 'percent' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startsAt && 
         now <= this.endsAt &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid() || subtotal < this.minSubtotal) {
    return 0;
  }
  
  let discount;
  if (this.type === 'flat') {
    discount = Math.min(this.value, subtotal);
  } else {
    // For percentage, ensure it doesn't exceed 100% of subtotal
    const percentageDiscount = Math.round((subtotal * this.value / 100) * 100) / 100;
    discount = Math.min(percentageDiscount, subtotal);
  }
  
  // Ensure discount is never negative and doesn't exceed subtotal
  return Math.max(0, Math.min(discount, subtotal));
};

module.exports = mongoose.model('Coupon', couponSchema);