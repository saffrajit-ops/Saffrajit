const router = require('express').Router();
const payments = require('../controllers/payments.controller');
const { optionalAuth, authenticate } = require('../middlewares/auth');

// Create checkout session (optional auth for user-specific features)
router.post('/checkout-session', optionalAuth, payments.createCheckoutSession);

// Create COD order (requires authentication)
router.post('/cod-order', authenticate, payments.createCODOrder);

// Verify session and create order (fallback for webhooks)
router.post('/verify-session', authenticate, payments.verifySession);

// Stripe webhook (no auth required, uses raw body)
router.post('/webhook', payments.webhook);

module.exports = router;