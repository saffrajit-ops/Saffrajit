const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/coupon.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// Public route - validate coupon
router.post('/validate', validateCoupon);

// Admin routes
router.post('/', authenticate, authorize('admin'), createCoupon);
router.get('/', authenticate, authorize('admin'), getAllCoupons);
router.put('/:id', authenticate, authorize('admin'), updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), deleteCoupon);

module.exports = router;