const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const { generateAuthToken, verifyToken } = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail, sendLoginNotification, sendOTPEmail, sendPasswordResetOTP, sendLoginOTP } = require('../utils/emailHelpers');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Register new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password,
      phone,
      isEmailVerified: false
    });

    await user.save();

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user).catch(err => console.error('Welcome email failed:', err));

    // Generate token
    const token = generateAuthToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send login notification (async, don't wait)
    const ipAddress = req.ip || req.connection.remoteAddress;
    sendLoginNotification(user, ipAddress).catch(err => console.error('Login notification failed:', err));

    // Generate token
    const token = generateAuthToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth login
const googleAuth = async (req, res, next) => {
  try {
    const { token: googleToken, accessToken, userInfo } = req.body;

    let email, name, picture, googleId;

    // Handle both ID token and access token flows
    if (googleToken) {
      // Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (accessToken && userInfo) {
      // Use provided user info from access token flow
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google token or user info is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update existing user
      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.isEmailVerified = true;
      if (picture && !user.profileImage?.url) {
        user.profileImage = { url: picture };
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        isEmailVerified: true,
        profileImage: picture ? { url: picture } : undefined
      });
    }

    const isNewUser = !user._id;
    await user.save();

    // Send welcome email for new users (async, don't wait)
    if (isNewUser) {
      sendWelcomeEmail(user).catch(err => console.error('Welcome email failed:', err));
    } else {
      // Send login notification for existing users
      const ipAddress = req.ip || req.connection.remoteAddress;
      sendLoginNotification(user, ipAddress).catch(err => console.error('Login notification failed:', err));
    }

    // Generate auth token
    const token = generateAuthToken(user);

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
};

// Logout (client-side token removal)
const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful. Please remove token from client.'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for email verification
const sendOTP = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, type: 'signup' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    const otpDoc = new OTP({
      email,
      otp,
      type: 'signup',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });
    await otpDoc.save();

    // Send OTP email
    await sendOTPEmail(email, name, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
};

// Verify OTP and register user
const verifyOTPAndRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: 'signup',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password,
      phone,
      isEmailVerified: true
    });

    await user.save();

    // Generate auth token
    const token = generateAuthToken(user);

    // Send welcome email
    await sendWelcomeEmail(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP and register error:', error);
    next(error);
  }
};

// Send password reset OTP
const sendPasswordResetOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Delete any existing password reset OTPs for this email
    await OTP.deleteMany({ email, type: 'password-reset' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    const otpDoc = new OTP({
      email,
      otp,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });
    await otpDoc.save();

    // Send OTP email
    await sendPasswordResetOTP(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    next(error);
  }
};

// Verify reset password OTP (Step 1)
const verifyResetPasswordOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: 'password-reset',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify reset password OTP error:', error);
    next(error);
  }
};

// Reset password with verified OTP (Step 2)
const verifyOTPAndResetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    // Check if there's a verified OTP within expiry time
    const otpDoc = await OTP.findOne({
      email,
      type: 'password-reset',
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please request a new OTP.'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    // Delete the used OTP
    await OTP.deleteMany({ email, type: 'password-reset' });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

// Send login OTP
const sendLoginOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Delete any existing login OTPs for this email
    await OTP.deleteMany({ email, type: 'login' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    const otpDoc = new OTP({
      email,
      otp,
      type: 'login',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });
    await otpDoc.save();

    // Send OTP email
    await sendLoginOTP(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Login OTP sent to your email'
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    next(error);
  }
};

// Verify login OTP
const verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: 'login',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Generate auth token
    const token = generateAuthToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    next(error);
  }
};

module.exports = {
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
};