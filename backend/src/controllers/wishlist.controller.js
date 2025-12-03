const Wishlist = require('../models/wishlist.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

class WishlistController {
  // Get user wishlist
  async getUserWishlist(req, res) {
    try {
      const userId = req.user.id;

      const wishlist = await Wishlist.findOrCreateForUser(userId);

      // Filter out inactive products
      const activeItems = wishlist.items.filter(item => 
        item.productId && item.productId.isActive
      );

      if (activeItems.length !== wishlist.items.length) {
        wishlist.items = activeItems;
        await wishlist.save();
      }

      res.status(200).json({
        success: true,
        data: {
          wishlist,
          summary: {
            totalItems: wishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Get user wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlist',
        error: error.message
      });
    }
  }

  // Add product to wishlist
  async addToWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { productId, qty = 1, variant = {} } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      if (qty < 1 || qty > 99) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be between 1 and 99'
        });
      }

      // Check if product exists and is active
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is not available'
        });
      }

      // Find or create wishlist
      const wishlist = await Wishlist.findOrCreateForUser(userId);

      // Add item to wishlist
      await wishlist.addItem(productId, qty, variant);

      // Populate and return updated wishlist
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: 'Product added to wishlist successfully',
        data: {
          wishlist: updatedWishlist,
          summary: {
            totalItems: updatedWishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add product to wishlist',
        error: error.message
      });
    }
  }

  // Update wishlist item quantity
  async updateWishlistItem(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { qty } = req.body;

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      if (qty < 0 || qty > 99) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be between 0 and 99'
        });
      }

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      await wishlist.updateItemQuantity(itemId, qty);

      // Populate and return updated wishlist
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: qty === 0 ? 'Item removed from wishlist' : 'Wishlist item updated successfully',
        data: {
          wishlist: updatedWishlist,
          summary: {
            totalItems: updatedWishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Update wishlist item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update wishlist item',
        error: error.message
      });
    }
  }

  // Increase wishlist item quantity
  async increaseQuantity(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { amount = 1 } = req.body;

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      if (amount < 1 || amount > 10) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be between 1 and 10'
        });
      }

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      await wishlist.increaseQuantity(itemId, amount);

      // Populate and return updated wishlist
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: 'Quantity increased successfully',
        data: {
          wishlist: updatedWishlist,
          summary: {
            totalItems: updatedWishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Increase quantity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to increase quantity',
        error: error.message
      });
    }
  }

  // Decrease wishlist item quantity
  async decreaseQuantity(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { amount = 1 } = req.body;

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      if (amount < 1 || amount > 10) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be between 1 and 10'
        });
      }

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      await wishlist.decreaseQuantity(itemId, amount);

      // Populate and return updated wishlist
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: item.qty - amount <= 0 ? 'Item removed from wishlist' : 'Quantity decreased successfully',
        data: {
          wishlist: updatedWishlist,
          summary: {
            totalItems: updatedWishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Decrease quantity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decrease quantity',
        error: error.message
      });
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      await wishlist.removeItem(itemId);

      // Populate and return updated wishlist
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: 'Item removed from wishlist successfully',
        data: {
          wishlist: updatedWishlist,
          summary: {
            totalItems: updatedWishlist.totalItems
          }
        }
      });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from wishlist',
        error: error.message
      });
    }
  }

  // Clear entire wishlist
  async clearWishlist(req, res) {
    try {
      const userId = req.user.id;

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      await wishlist.clearWishlist();

      res.status(200).json({
        success: true,
        message: 'Wishlist cleared successfully',
        data: {
          wishlist,
          summary: {
            totalItems: 0
          }
        }
      });
    } catch (error) {
      console.error('Clear wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear wishlist',
        error: error.message
      });
    }
  }

  // Move product from wishlist to cart
  async moveToCart(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { qty } = req.body; // Optional: override quantity

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      const wishlist = await Wishlist.findOne({ userId }).populate('items.productId', 'title price stock isActive');
      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      // Check if product is still available
      if (!item.productId || !item.productId.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is no longer available'
        });
      }

      const quantityToMove = qty || item.qty;

      // Check stock availability
      if (item.productId.stock < quantityToMove) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.productId.stock} items available in stock`
        });
      }

      // Move item to cart
      const cart = await wishlist.moveToCart(itemId, Cart);

      // Get updated wishlist and cart
      const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug');
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug');

      res.status(200).json({
        success: true,
        message: 'Item moved to cart successfully',
        data: {
          wishlist: updatedWishlist,
          cart: updatedCart,
          summary: {
            wishlistItems: updatedWishlist.totalItems,
            cartItems: updatedCart.totalItems,
            cartTotal: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Move to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move item to cart',
        error: error.message
      });
    }
  }
}

module.exports = new WishlistController();