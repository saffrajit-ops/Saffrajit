const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');


// Coupon validation route (moved here for cart functionality)
router.post('/validate-coupon', require('../controllers/coupon.controller').validateCoupon);

// Public routes only - Admin routes are in /api/admin/products
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getAllCategories);
router.get('/id/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id/similar', productController.getSimilarProducts);

module.exports = router;