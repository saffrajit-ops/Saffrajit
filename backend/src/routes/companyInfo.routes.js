const express = require('express');
const router = express.Router();
const companyInfoController = require('../controllers/companyInfo.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', companyInfoController.getCompanyInfo);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), companyInfoController.getCompanyInfoAdmin);
router.put('/admin', authenticate, authorize('admin'), companyInfoController.updateCompanyInfo);

module.exports = router;
