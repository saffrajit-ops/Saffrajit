const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  removeProfileImage,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All user routes require authentication
router.use(authenticate);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/change-password', changePassword);

// Profile image management
router.post('/profile/image', uploadProfileImage);
router.delete('/profile/image', removeProfileImage);

// Address management
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

module.exports = router;