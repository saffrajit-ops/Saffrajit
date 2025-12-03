const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

class CartController {
  // Get user cart
  async getUserCart(req, res) {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOrCreateForUser(userId);

      // Filter out inactive products and update prices
      const activeItems = [];
      let hasChanges = false;

      for (const item of cart.items) {
        if (item.productId && item.productId.isActive && item.productId.stock > 0) {
          // Update price snapshot if product price changed
          if (item.priceSnapshot !== item.productId.price) {
            item.priceSnapshot = item.productId.price;
            hasChanges = true;
          }
          activeItems.push(item);
        } else {
          hasChanges = true; // Item will be removed
        }
      }

      if (hasChanges) {
        cart.items = activeItems;
        await cart.save();
      }

      res.status(200).json({
        success: true,
        data: {
          cart,
          summary: {
            totalItems: cart.totalItems,
            subtotal: cart.subtotal,
            couponDiscount: cart.couponDiscount || 0,
            total: cart.total
          }
        }
      });
    } catch (error) {
      console.error('Get user cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart',
        error: error.message
      });
    }
  }

  // Add product to cart
  async addToCart(req, res) {
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

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`
        });
      }

      // Find or create cart
      const cart = await Cart.findOrCreateForUser(userId);

      // Add item to cart
      await cart.addItem(product, qty, variant);

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug discount shipping cashOnDelivery returnPolicy');

      res.status(200).json({
        success: true,
        message: 'Product added to cart successfully',
        data: {
          cart: updatedCart,
          summary: {
            totalItems: updatedCart.totalItems,
            subtotal: updatedCart.subtotal,
            couponDiscount: updatedCart.couponDiscount || 0,
            total: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add product to cart',
        error: error.message
      });
    }
  }

  // Update cart item quantity
  async updateCartItem(req, res) {
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

      const cart = await Cart.findOne({ userId }).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      // Check stock availability if increasing quantity
      if (qty > item.qty && item.productId.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.productId.stock} items available in stock`
        });
      }

      await cart.updateItemQuantity(itemId, qty);

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug discount shipping cashOnDelivery returnPolicy');

      res.status(200).json({
        success: true,
        message: qty === 0 ? 'Item removed from cart' : 'Cart item updated successfully',
        data: {
          cart: updatedCart,
          summary: {
            totalItems: updatedCart.totalItems,
            subtotal: updatedCart.subtotal,
            couponDiscount: updatedCart.couponDiscount || 0,
            total: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error.message
      });
    }
  }

  // Increase cart item quantity
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

      const cart = await Cart.findOne({ userId }).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      // Check stock availability for the increased quantity
      const newQuantity = item.qty + amount;
      if (item.productId.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.productId.stock} items available in stock`
        });
      }

      await cart.increaseQuantity(itemId, amount);

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug discount shipping cashOnDelivery returnPolicy');

      res.status(200).json({
        success: true,
        message: 'Quantity increased successfully',
        data: {
          cart: updatedCart,
          summary: {
            totalItems: updatedCart.totalItems,
            subtotal: updatedCart.subtotal,
            couponDiscount: updatedCart.couponDiscount || 0,
            total: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Increase cart quantity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to increase quantity',
        error: error.message
      });
    }
  }

  // Decrease cart item quantity
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

      const cart = await Cart.findOne({ userId }).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      await cart.decreaseQuantity(itemId, amount);

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug discount shipping cashOnDelivery returnPolicy');

      res.status(200).json({
        success: true,
        message: item.qty - amount <= 0 ? 'Item removed from cart' : 'Quantity decreased successfully',
        data: {
          cart: updatedCart,
          summary: {
            totalItems: updatedCart.totalItems,
            subtotal: updatedCart.subtotal,
            couponDiscount: updatedCart.couponDiscount || 0,
            total: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Decrease cart quantity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decrease quantity',
        error: error.message
      });
    }
  }

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID'
        });
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      await cart.removeItem(itemId);

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id).populate('items.productId', 'title price images stock isActive slug discount shipping cashOnDelivery returnPolicy');

      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
          cart: updatedCart,
          summary: {
            totalItems: updatedCart.totalItems,
            subtotal: updatedCart.subtotal,
            couponDiscount: updatedCart.couponDiscount || 0,
            total: updatedCart.total
          }
        }
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: error.message
      });
    }
  }

  // Clear entire cart
  async clearCart(req, res) {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      await cart.clearCart();

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          cart,
          summary: {
            totalItems: 0,
            subtotal: 0,
            couponDiscount: 0,
            total: 0
          }
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error.message
      });
    }
  }

  // Get cart total for checkout
  async getCartTotal(req, res) {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({ userId }).populate('items.productId', 'title price stock isActive discount shipping cashOnDelivery returnPolicy');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate all items are still available
      const unavailableItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        if (!item.productId || !item.productId.isActive) {
          unavailableItems.push({
            itemId: item._id,
            reason: 'Product is no longer available'
          });
        } else if (item.productId.stock < item.qty) {
          unavailableItems.push({
            itemId: item._id,
            productTitle: item.titleSnapshot,
            requestedQty: item.qty,
            availableStock: item.productId.stock,
            reason: 'Insufficient stock'
          });
        } else {
          subtotal += item.productId.price * item.qty;
        }
      }

      if (unavailableItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some items in your cart are no longer available',
          unavailableItems
        });
      }

      const total = Math.max(0, subtotal - (cart.couponDiscount || 0));

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalItems: cart.totalItems,
            subtotal,
            couponDiscount: cart.couponDiscount || 0,
            total,
            couponCode: cart.couponCode
          },
          items: cart.items.map(item => ({
            itemId: item._id,
            productId: item.productId._id,
            title: item.titleSnapshot,
            price: item.productId.price,
            qty: item.qty,
            lineTotal: item.productId.price * item.qty,
            variant: item.variant
          }))
        }
      });
    } catch (error) {
      console.error('Get cart total error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate cart total',
        error: error.message
      });
    }
  }
}

module.exports = new CartController();