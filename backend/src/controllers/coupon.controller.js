const Coupon = require('../models/coupon.model');
const mongoose = require('mongoose');

// Admin: Create coupon
const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Admin: Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, type } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (type) filter.type = type;
    
    const coupons = await Coupon.find(filter)
      .populate('appliesTo.productIds', 'title')
      .populate('appliesTo.taxonomyIds', 'name type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Coupon.countDocuments(filter);
    
    res.json({
      success: true,
      data: coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons'
    });
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('appliesTo.productIds', 'title')
     .populate('appliesTo.taxonomyIds', 'name type');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon'
    });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    const coupon = await Coupon.findByIdAndDelete(id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon'
    });
  }
};

// Public: Validate coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, items = [] } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase() 
    }).populate('appliesTo.productIds appliesTo.taxonomyIds');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }
    
    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is no longer active'
      });
    }

    // Check if coupon has started
    const now = new Date();
    if (now < coupon.startsAt) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not yet active'
      });
    }

    // Check if coupon has expired
    if (now > coupon.endsAt) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired'
      });
    }

    // Check if usage limit reached
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its usage limit'
      });
    }
    
    if (subtotal < coupon.minSubtotal) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${coupon.minSubtotal} required`
      });
    }
    
    // Check if coupon applies to items (if restrictions exist)
    if (coupon.appliesTo.productIds.length > 0 || coupon.appliesTo.taxonomyIds.length > 0) {
      const applicableItems = items.filter(item => {
        // Check if product is directly included
        if (coupon.appliesTo.productIds.some(pid => pid._id.toString() === item.productId)) {
          return true;
        }
        
        // Check if product's taxonomies match
        if (item.taxonomies && coupon.appliesTo.taxonomyIds.length > 0) {
          return item.taxonomies.some(taxId => 
            coupon.appliesTo.taxonomyIds.some(ctid => ctid._id.toString() === taxId)
          );
        }
        
        return false;
      });
      
      if (applicableItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is not applicable to items in your cart'
        });
      }
    }
    
    const discount = coupon.calculateDiscount(subtotal);
    
    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        finalAmount: subtotal - discount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};