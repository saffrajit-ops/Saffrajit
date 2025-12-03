const express = require('express');
const router = express.Router();
const {
  createReview,
  getOrderReviews,
  getProductReviews
} = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth');

// Order review routes (require authentication)
router.post('/orders/:orderId/reviews', authenticate, createReview);
router.get('/orders/:orderId/reviews', authenticate, getOrderReviews);

// Product review routes (public)
router.get('/products/:productId/reviews', getProductReviews);

module.exports = router;
