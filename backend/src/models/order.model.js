const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: String,
  price: Number,
  quantity: Number,
  subtotal: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  currency: { type: String, default: 'usd' },
  subtotal: Number,
  discount: { type: Number, default: 0 }, // Product discounts
  shippingCharges: { type: Number, default: 0 }, // Shipping charges
  total: Number,

  // Coupon information
  coupon: {
    code: String,
    type: { type: String, enum: ['flat', 'percent'] },
    value: Number,
    discount: Number
  },

  // Payment information
  payment: {
    method: { type: String, enum: ['stripe', 'cod'], default: 'stripe' },
    sessionId: String,
    paymentIntentId: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paidAt: Date,
    failedAt: Date,
    failureReason: String
  },

  // Order status and timestamps
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'failed'],
    default: 'pending'
  },
  confirmedAt: Date,

  // Processing information
  processing: {
    startedAt: Date,
    notes: String
  },

  // Shipping information
  shipping: {
    shippedAt: Date,
    trackingNumber: String,
    notes: String
  },

  // Delivery information
  delivery: {
    deliveredAt: Date,
    notes: String
  },

  // Cancellation information
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Return information
  return: {
    status: { type: String, enum: ['requested', 'approved', 'rejected', 'refunded', 'completed'] },
    reason: String,
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      reason: String
    }],
    requestedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundedAt: Date,
    refundAmount: Number,
    notes: String,
    // Bank details for COD refunds (US Banking)
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountType: { type: String, enum: ['checking', 'savings'] }
    }
  },

  // Refund information
  refunds: [{
    amount: Number,
    reason: String,
    method: String,
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    stripeRefundId: String // Stripe refund ID for tracking
  }],

  // Status history
  statusHistory: [{
    status: String,
    changedTo: String,
    changedAt: Date,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],

  // Shipping address
  shippingAddress: {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String
  }
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);