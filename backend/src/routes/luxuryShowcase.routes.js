const express = require('express');
const router = express.Router();
const luxuryShowcaseController = require('../controllers/luxuryShowcase.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadSingleVideo } = require('../middlewares/videoUpload');

// Public routes
router.get('/', luxuryShowcaseController.getLuxuryShowcase);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), luxuryShowcaseController.getLuxuryShowcaseAdmin);
router.put('/admin', authenticate, authorize('admin'), uploadSingleVideo, luxuryShowcaseController.updateLuxuryShowcase);

module.exports = router;
