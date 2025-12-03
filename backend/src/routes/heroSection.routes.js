const express = require('express');
const router = express.Router();
const heroSectionController = require('../controllers/heroSection.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadSingleVideo } = require('../middlewares/videoUpload');

// Public routes
router.get('/', heroSectionController.getHeroSection);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), heroSectionController.getHeroSectionAdmin);
router.put('/admin', authenticate, authorize('admin'), uploadSingleVideo, heroSectionController.updateHeroSection);

module.exports = router;
