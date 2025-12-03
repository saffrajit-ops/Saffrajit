const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  sendOTP,
  verifyOTPAndRegister,
  sendPasswordResetOTPController,
  verifyResetPasswordOTP,
  verifyOTPAndResetPassword,
  sendLoginOTPController,
  verifyLoginOTP
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// Public routes
router.post('/register', register);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/login', login);
router.post('/google', googleAuth);

// Password reset routes
router.post('/forgot-password', sendPasswordResetOTPController);
router.post('/verify-reset-otp', verifyResetPasswordOTP);
router.post('/reset-password', verifyOTPAndResetPassword);

// Login with OTP routes
router.post('/send-login-otp', sendLoginOTPController);
router.post('/verify-login-otp', verifyLoginOTP);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', getMe);
router.post('/logout', logout);

module.exports = router;