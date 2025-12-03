const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Cart operations
router.get('/', cartController.getUserCart);
router.post('/add', cartController.addToCart);
router.put('/items/:itemId', cartController.updateCartItem);
router.put('/items/:itemId/increase', cartController.increaseQuantity);
router.put('/items/:itemId/decrease', cartController.decreaseQuantity);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.get('/total', cartController.getCartTotal);

module.exports = router;