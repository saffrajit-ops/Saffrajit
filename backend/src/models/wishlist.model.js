const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    qty: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1'],
        max: [99, 'Quantity cannot exceed 99']
    },
    variant: {
        shade: String,
        size: String,
        skinType: String
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true
    },
    items: [wishlistItemSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
wishlistSchema.index({ userId: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 });
wishlistSchema.index({ updatedAt: 1 });

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function () {
    return this.items.length;
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = function (productId, quantity = 1, variant = {}) {
    const existingItemIndex = this.items.findIndex(item =>
        item.productId.toString() === productId.toString() &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItemIndex > -1) {
        // Update existing item quantity
        this.items[existingItemIndex].qty = quantity;
        this.items[existingItemIndex].addedAt = new Date();
    } else {
        // Add new item
        this.items.push({
            productId,
            qty: quantity,
            variant,
            addedAt: new Date()
        });
    }

    return this.save();
};

// Method to update item quantity
wishlistSchema.methods.updateItemQuantity = function (itemId, quantity) {
    const item = this.items.id(itemId);
    if (item) {
        if (quantity <= 0) {
            item.deleteOne();
        } else {
            item.qty = Math.min(quantity, 99); // Max quantity limit
        }
    }
    return this.save();
};

// Method to increase quantity
wishlistSchema.methods.increaseQuantity = function (itemId, amount = 1) {
    const item = this.items.id(itemId);
    if (item) {
        item.qty = Math.min(item.qty + amount, 99);
    }
    return this.save();
};

// Method to decrease quantity
wishlistSchema.methods.decreaseQuantity = function (itemId, amount = 1) {
    const item = this.items.id(itemId);
    if (item) {
        const newQty = item.qty - amount;
        if (newQty <= 0) {
            item.deleteOne();
        } else {
            item.qty = newQty;
        }
    }
    return this.save();
};

// Method to remove item
wishlistSchema.methods.removeItem = function (itemId) {
    const item = this.items.id(itemId);
    if (item) {
        item.deleteOne();
    }
    return this.save();
};

// Method to remove item by product ID
wishlistSchema.methods.removeItemByProductId = function (productId, variant = {}) {
    const itemIndex = this.items.findIndex(item =>
        item.productId.toString() === productId.toString() &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (itemIndex > -1) {
        this.items.splice(itemIndex, 1);
    }

    return this.save();
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function () {
    this.items = [];
    return this.save();
};

// Method to move item to cart
wishlistSchema.methods.moveToCart = async function (itemId, Cart) {
    const item = this.items.id(itemId);
    if (!item) {
        throw new Error('Item not found in wishlist');
    }

    // Get product details
    const Product = mongoose.model('Product');
    const product = await Product.findById(item.productId);
    if (!product) {
        throw new Error('Product not found');
    }

    // Find or create cart for user
    const cart = await Cart.findOrCreateForUser(this.userId);

    // Add item to cart
    await cart.addItem(product, item.qty, item.variant);

    // Remove item from wishlist
    item.deleteOne();
    await this.save();

    return cart;
};

// Static method to find or create wishlist for user
wishlistSchema.statics.findOrCreateForUser = async function (userId) {
    let wishlist = await this.findOne({ userId }).populate('items.productId', 'title price images stock isActive slug discount shipping');

    if (!wishlist) {
        wishlist = new this({ userId, items: [] });
        await wishlist.save();
        wishlist = await this.findById(wishlist._id).populate('items.productId', 'title price images stock isActive slug discount shipping');
    }

    return wishlist;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);