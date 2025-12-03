const express = require('express');
const router = express.Router();
const {
    getAllBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    trackBannerView,
    trackBannerClick,
    getOccupiedPages,
    getBannersByPages
} = require('../controllers/banner.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/active', getActiveBanners);
router.post('/:id/view', trackBannerView);
router.post('/:id/click', trackBannerClick);

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllBanners);
router.get('/occupied-pages', authenticate, authorize('admin'), getOccupiedPages);
router.get('/by-pages', authenticate, authorize('admin'), getBannersByPages);
router.get('/:id', authenticate, authorize('admin'), getBannerById);
router.post('/', authenticate, authorize('admin'), createBanner);
router.put('/:id', authenticate, authorize('admin'), updateBanner);
router.delete('/:id', authenticate, authorize('admin'), deleteBanner);
router.patch('/:id/status', authenticate, authorize('admin'), toggleBannerStatus);

module.exports = router;
