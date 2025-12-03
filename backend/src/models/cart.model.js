const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  titleSnapshot: {
    type: String,
    required: [true, 'Product title snapshot is required']
  },
  priceSnapshot: {
    type: Number,
    required: [true, 'Product price snapshot is required'],
    min: [0, 'Price cannot be negative']
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [99, 'Quantity cannot exceed 99']
  },
  variant: {
    shade: String,
    size: String,
    skinType: String
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  items: [cartItemSchema],
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ userId: 1 }, { unique: true });
cartSchema.index({ updatedAt: 1 });

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.qty, 0);
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.priceSnapshot * item.qty), 0);
});

// Virtual for total after discount
cartSchema.virtual('total').get(function() {
  const subtotal = this.subtotal;
  return Math.max(0, subtotal - (this.couponDiscount || 0));
});

// Method to add item to cart
cartSchema.methods.addItem = function(productData, quantity = 1, variant = {}) {
  // Normalize variant to handle empty objects and undefined
  const normalizeVariant = (v) => {
    if (!v || Object.keys(v).length === 0) return null;
    return v;
  };

  const normalizedVariant = normalizeVariant(variant);

  // Handle populated productId (document) or ObjectId
  const existingItemIndex = this.items.findIndex(item => {
    const itemVariant = normalizeVariant(item.variant);
    const itemProductId = item.productId && item.productId._id ? item.productId._id : item.productId;

    // Safely stringify variants (null if empty) so {} and undefined match
    const itemVariantStr = JSON.stringify(itemVariant);
    const normalizedVariantStr = JSON.stringify(normalizedVariant);

    return itemProductId && itemProductId.toString() === productData._id.toString() &&
           itemVariantStr === normalizedVariantStr;
  });

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].qty += quantity;
    this.items[existingItemIndex].priceSnapshot = productData.price; // Update price snapshot
  } else {
    // Add new item
    this.items.push({
      productId: productData._id,
      titleSnapshot: productData.title,
      priceSnapshot: productData.price,
      qty: quantity,
      variant: normalizedVariant
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.qty = Math.min(quantity, 99); // Max quantity limit
    }
  }
  return this.save();
};

// Method to increase item quantity
cartSchema.methods.increaseQuantity = function(itemId, amount = 1) {
  const item = this.items.id(itemId);
  if (item) {
    item.qty = Math.min(item.qty + amount, 99); // Max quantity limit
  }
  return this.save();
};

// Method to decrease item quantity
cartSchema.methods.decreaseQuantity = function(itemId, amount = 1) {
  const item = this.items.id(itemId);
  if (item) {
    const newQty = item.qty - amount;
    if (newQty <= 0) {
      item.deleteOne();
    } else {
      item.qty = newQty;
    }
  }
  return this.save();
};

// Method to remove item
cartSchema.methods.removeItem = function(itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.deleteOne();
  }
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.couponCode = undefined;
  this.couponDiscount = 0;
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discountAmount) {
  this.couponCode = couponCode;
  this.couponDiscount = discountAmount;
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.couponCode = undefined;
  this.couponDiscount = 0;
  return this.save();
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ userId }).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
  
  if (!cart) {
    cart = new this({ userId, items: [] });
    await cart.save();
    cart = await this.findById(cart._id).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
  }
  
  return cart;
};

module.exports = mongoose.model('Cart', cartSchema);