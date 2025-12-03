const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

// Wishlist operations
router.get('/', wishlistController.getUserWishlist);
router.post('/add', wishlistController.addToWishlist);
router.put('/items/:itemId', wishlistController.updateWishlistItem);
router.put('/items/:itemId/increase', wishlistController.increaseQuantity);
router.put('/items/:itemId/decrease', wishlistController.decreaseQuantity);
router.delete('/items/:itemId', wishlistController.removeFromWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.post('/items/:itemId/move-to-cart', wishlistController.moveToCart);

module.exports = router;