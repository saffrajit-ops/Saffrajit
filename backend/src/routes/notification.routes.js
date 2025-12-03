const express = require('express');
const router = express.Router();
const { getNotificationCounts } = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Admin routes (require admin role)
router.get('/counts', authenticate, authorize('admin'), getNotificationCounts);

module.exports = router;
