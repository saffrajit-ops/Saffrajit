const Review = require('../models/review.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

// Create review for order
const createReview = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { productId, rating, comment, images } = req.body;
    const userId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only review delivered orders'
      });
    }

    // Check if product is in the order
    const orderItem = order.items.find(item => item.product.toString() === productId);
    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Check if THIS USER has already reviewed this product from this order
    console.log('🔍 Checking for existing review:', {
      orderId,
      productId,
      userId
    });

    const existingReview = await Review.findOne({ 
      order: orderId, 
      product: productId,
      user: userId  // IMPORTANT: Check for THIS user's review
    });

    console.log('📝 Existing review found:', existingReview ? {
      reviewId: existingReview._id,
      order: existingReview.order,
      product: existingReview.product,
      user: existingReview.user
    } : 'None');

    if (existingReview) {
      console.log('❌ Blocking duplicate review for order:', orderId, 'product:', productId);
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product from this order'
      });
    }

    console.log('✅ No existing review, proceeding to create');

    // Create review
    console.log('📝 Creating review with data:', {
      order: orderId,
      user: userId,
      product: productId,
      rating
    });

    const review = await Review.create({
      order: orderId,
      user: userId,
      product: productId,
      rating,
      comment: comment || '',
      images: images || [],
      isVerifiedPurchase: true
    });

    console.log('✅ Review created successfully:', review._id);

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('❌ Error creating review:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      console.log('🔒 Duplicate key error - review already exists');
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product from this order'
      });
    }
    next(error);
  }
};

// Get reviews for an order
const getOrderReviews = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Verify order belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const reviews = await Review.find({ order: orderId })
      .populate('product', 'title images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Update product rating average
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        ratingAvg: 0,
        ratingCount: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      ratingAvg: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      ratingCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

// Get product reviews (public)
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ product: productId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getOrderReviews,
  getProductReviews,
  updateProductRating
};
