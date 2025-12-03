const User = require('../models/user.model');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile image
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = req.user;

    // Delete old image if exists
    if (user.profileImage?.publicId) {
      try {
        await deleteImage(user.profileImage.publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'profile_images'
    });

    // Update user profile image
    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id
    };

    await user.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove profile image
const removeProfileImage = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.profileImage?.publicId) {
      try {
        await deleteImage(user.profileImage.publicId);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    user.profileImage = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    // Check if user has a password (not OAuth only)
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for OAuth-only accounts'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add address
const addAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const addressData = req.body;

    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

// Update address
const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = req.user;
    const updateData = req.body;

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other default addresses
    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    Object.assign(address, updateData);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

// Delete address
const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = req.user;

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    user.addresses.pull(addressId);
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile (same as getMe but for user routes)
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
};

module.exports = {
  updateProfile,
  uploadProfileImage: [upload.single('image'), uploadProfileImage],
  removeProfileImage,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getProfile
};