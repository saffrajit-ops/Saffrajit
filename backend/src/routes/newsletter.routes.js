const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin routes
router.get('/admin/subscribers', authenticate, authorize('admin'), newsletterController.getAllSubscribers);
router.patch('/admin/subscribers/:id/status', authenticate, authorize('admin'), newsletterController.updateStatus);
router.delete('/admin/subscribers/:id', authenticate, authorize('admin'), newsletterController.deleteSubscriber);
router.post('/admin/subscribers/bulk-delete', authenticate, authorize('admin'), newsletterController.bulkDelete);
router.get('/admin/subscribers/export', authenticate, authorize('admin'), newsletterController.exportSubscribers);

module.exports = router;
