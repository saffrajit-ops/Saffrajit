# Wishlist API

## Overview
User wishlist management system for saving and organizing favorite products with sharing capabilities.

## Endpoints

### Get User Wishlist
Retrieve current user's wishlist with products.

**Endpoint:** `GET /api/wishlist`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "userId": "user_id",
      "items": [
        {
          "_id": "wishlist_item_id",
          "productId": {
            "_id": "product_id",
            "title": "Premium Face Cream",
            "slug": "premium-face-cream",
            "price": 89.99,
            "compareAtPrice": 119.99,
            "stock": 50,
            "images": [
              {
                "url": "https://...",
                "altText": "Product image"
              }
            ],
            "rating": {
              "average": 4.5,
              "count": 23
            },
            "isActive": true,
            "isFeatured": true
          },
          "qty": 1,
          "variant": {
            "size": "100ml",
            "type": "Normal"
          },
          "addedAt": "2024-01-01T10:00:00.000Z",
          "note": "For my morning routine"
        }
      ],
      "itemCount": 3,
      "totalValue": 269.97,
      "averagePrice": 89.99,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastModified": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### Empty Wishlist Response (200)
```json
{
  "success": true,
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "userId": "user_id",
      "items": [],
      "itemCount": 0,
      "totalValue": 0,
      "averagePrice": 0
    }
  }
}
```

---

### Add Product to Wishlist
Add a product to the user's wishlist.

**Endpoint:** `POST /api/wishlist/add`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "productId": "product_id",        // Required: valid product ID
  "qty": 1,                         // Optional: default 1, positive integer
  "variant": {                      // Optional: product variants
    "size": "100ml",
    "type": "Normal",
    "color": "Natural"
  },
  "note": "For my morning routine"   // Optional: personal note, max 200 characters
}
```

#### Validation Rules
- `productId`: Must be valid ObjectId of active product
- `qty`: Positive integer (default: 1)
- `variant`: Object with valid variant options
- `note`: Optional string, max 200 characters
- Product cannot already exist in wishlist (will update if exists)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product added to wishlist successfully",
  "data": {
    "wishlist": {
      // ... complete wishlist object with updated items
    },
    "addedItem": {
      "_id": "wishlist_item_id",
      "productId": "product_id",
      "qty": 1,
      "variant": {
        "size": "100ml",
        "type": "Normal"
      },
      "addedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### Error Responses
```json
// 404 - Product Not Found
{
  "success": false,
  "message": "Product not found or inactive"
}

// 400 - Invalid Variant
{
  "success": false,
  "message": "Invalid product variant",
  "error": {
    "invalidOptions": ["invalidSize"]
  }
}

// 409 - Product Already in Wishlist
{
  "success": false,
  "message": "Product already in wishlist",
  "error": {
    "existingItemId": "wishlist_item_id",
    "suggestion": "Use update endpoint to modify quantity"
  }
}
```

---

### Update Wishlist Item
Update wishlist item quantity, variant, or note.

**Endpoint:** `PUT /api/wishlist/items/{wishlistItemId}`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "qty": 2,                         // Optional: positive integer
  "variant": {                      // Optional: updated variants
    "size": "200ml",
    "type": "Sensitive"
  },
  "note": "Updated note"            // Optional: personal note
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Wishlist item updated successfully",
  "data": {
    "wishlist": {
      // ... updated wishlist object
    }
  }
}
```

#### Error Responses
```json
// 404 - Wishlist Item Not Found
{
  "success": false,
  "message": "Wishlist item not found"
}

// 403 - Not Owner
{
  "success": false,
  "message": "You can only update your own wishlist items"
}
```

---

### Increase Wishlist Item Quantity
Increment item quantity by specified amount.

**Endpoint:** `PUT /api/wishlist/items/{wishlistItemId}/increase`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "amount": 1    // Optional: default 1, positive integer
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Wishlist item quantity increased successfully",
  "data": {
    "wishlist": {
      // ... updated wishlist object
    }
  }
}
```

---

### Decrease Wishlist Item Quantity
Decrement item quantity by specified amount.

**Endpoint:** `PUT /api/wishlist/items/{wishlistItemId}/decrease`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "amount": 1    // Optional: default 1, positive integer
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Wishlist item quantity decreased successfully",
  // OR if quantity becomes 0:
  "message": "Wishlist item removed (quantity reached 0)",
  "data": {
    "wishlist": {
      // ... updated wishlist object
    }
  }
}
```

---

### Move Product from Wishlist to Cart
Move item from wishlist to shopping cart.

**Endpoint:** `POST /api/wishlist/items/{wishlistItemId}/move-to-cart`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "qty": 2,                    // Optional: quantity to move (default: item quantity)
  "removeFromWishlist": true   // Optional: remove from wishlist after moving (default: true)
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product moved to cart successfully",
  "data": {
    "cart": {
      // ... updated cart object
    },
    "wishlist": {
      // ... updated wishlist object (if removeFromWishlist=true)
    },
    "movedItem": {
      "_id": "cart_item_id",
      "productId": "product_id",
      "qty": 2,
      "price": 89.99,
      "lineTotal": 179.98
    }
  }
}
```

#### Error Responses
```json
// 400 - Insufficient Stock
{
  "success": false,
  "message": "Insufficient stock to move to cart",
  "error": {
    "available": 5,
    "requested": 10
  }
}
```

---

### Remove Product from Wishlist
Remove specific item from wishlist.

**Endpoint:** `DELETE /api/wishlist/items/{wishlistItemId}`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product removed from wishlist successfully",
  "data": {
    "wishlist": {
      // ... updated wishlist object
    }
  }
}
```

#### Error Response
```json
// 404 - Wishlist Item Not Found
{
  "success": false,
  "message": "Wishlist item not found"
}
```

---

### Clear Entire Wishlist
Remove all items from wishlist.

**Endpoint:** `DELETE /api/wishlist/clear`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Wishlist cleared successfully",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "userId": "user_id",
      "items": [],
      "itemCount": 0,
      "totalValue": 0,
      "averagePrice": 0
    }
  }
}
```

---

### Share Wishlist (Future Feature)
Get shareable link for wishlist.

**Endpoint:** `POST /api/wishlist/share`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "isPublic": true,              // Optional: make wishlist publicly viewable
  "expiresAt": "2024-12-31"     // Optional: expiration date for share link
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Wishlist shared successfully",
  "data": {
    "shareId": "share_token",
    "shareUrl": "https://canagold.com/wishlist/share/share_token",
    "isPublic": true,
    "expiresAt": "2024-12-31T23:59:59.000Z"
  }
}
```

## Frontend Integration Examples

### React Wishlist Hook
```javascript
import { useState, useEffect, useContext, createContext } from 'react';
import { useAuth } from './useAuth';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, accessToken } = useAuth();

  const fetchWishlist = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ productId, ...options })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
        return data.data.addedItem;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWishlistItem = async (itemId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/wishlist/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/wishlist/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const moveToCart = async (itemId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/wishlist/items/${itemId}/move-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(options)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
        return data.data.movedItem;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearWishlist = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wishlist/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWishlist(data.data.wishlist);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to clear wishlist');
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some(item => item.productId._id === productId);
  };

  const getWishlistItem = (productId) => {
    if (!wishlist || !wishlist.items) return null;
    return wishlist.items.find(item => item.productId._id === productId);
  };

  // Fetch wishlist on component mount and user change
  useEffect(() => {
    if (user && accessToken) {
      fetchWishlist();
    } else {
      setWishlist(null);
    }
  }, [user, accessToken]);

  const value = {
    wishlist,
    loading,
    error,
    addToWishlist,
    updateWishlistItem,
    removeFromWishlist,
    moveToCart,
    clearWishlist,
    isInWishlist,
    getWishlistItem,
    refreshWishlist: fetchWishlist,
    itemCount: wishlist?.itemCount || 0,
    totalValue: wishlist?.totalValue || 0
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
```

### Wishlist Component Example
```javascript
import React, { useState } from 'react';
import { useWishlist } from './useWishlist';

const WishlistPage = () => {
  const { 
    wishlist, 
    loading, 
    error, 
    updateWishlistItem,
    removeFromWishlist, 
    moveToCart,
    clearWishlist 
  } = useWishlist();

  const [movingItems, setMovingItems] = useState(new Set());

  const handleMoveToCart = async (itemId, productTitle) => {
    setMovingItems(prev => new Set([...prev, itemId]));
    
    try {
      await moveToCart(itemId);
      alert(`${productTitle} moved to cart successfully!`);
    } catch (err) {
      alert(`Failed to move ${productTitle} to cart: ${err.message}`);
    } finally {
      setMovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleQuantityChange = async (itemId, newQty) => {
    try {
      await updateWishlistItem(itemId, { qty: newQty });
    } catch (err) {
      alert('Failed to update quantity: ' + err.message);
    }
  };

  if (loading) return <div>Loading wishlist...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="empty-wishlist">
        <h2>Your Wishlist is Empty</h2>
        <p>Start adding products you love to your wishlist!</p>
        <a href="/products" className="shop-now-btn">Shop Now</a>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h2>My Wishlist ({wishlist.itemCount} items)</h2>
        <div className="wishlist-summary">
          <span>Total Value: ${wishlist.totalValue?.toFixed(2)}</span>
          <span>Average Price: ${wishlist.averagePrice?.toFixed(2)}</span>
        </div>
        <button 
          onClick={clearWishlist}
          className="clear-wishlist-btn"
        >
          Clear Wishlist
        </button>
      </div>
      
      <div className="wishlist-items">
        {wishlist.items.map(item => (
          <div key={item._id} className="wishlist-item">
            <div className="product-image">
              <img 
                src={item.productId.images[0]?.url} 
                alt={item.productId.title} 
              />
              {item.productId.compareAtPrice && (
                <div className="sale-badge">Sale</div>
              )}
            </div>
            
            <div className="product-details">
              <h4>{item.productId.title}</h4>
              
              {item.variant && (
                <div className="variant-info">
                  {Object.entries(item.variant).map(([key, value]) => (
                    <span key={key} className="variant-tag">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="price-info">
                <span className="current-price">${item.productId.price}</span>
                {item.productId.compareAtPrice && (
                  <span className="original-price">
                    ${item.productId.compareAtPrice}
                  </span>
                )}
              </div>
              
              {item.productId.rating && (
                <div className="rating">
                  <span className="stars">
                    {'★'.repeat(Math.round(item.productId.rating.average))}
                    {'☆'.repeat(5 - Math.round(item.productId.rating.average))}
                  </span>
                  <span className="rating-count">
                    ({item.productId.rating.count} reviews)
                  </span>
                </div>
              )}
              
              <div className="stock-status">
                {item.productId.stock > 0 ? (
                  <span className="in-stock">
                    {item.productId.stock > 10 ? 'In Stock' : `Only ${item.productId.stock} left`}
                  </span>
                ) : (
                  <span className="out-of-stock">Out of Stock</span>
                )}
              </div>
              
              {item.note && (
                <div className="personal-note">
                  <strong>Note:</strong> {item.note}
                </div>
              )}
              
              <div className="added-date">
                Added {new Date(item.addedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="item-controls">
              <div className="quantity-controls">
                <label>Quantity:</label>
                <div className="quantity-input">
                  <button 
                    onClick={() => handleQuantityChange(item._id, item.qty - 1)}
                    disabled={item.qty <= 1}
                  >
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button 
                    onClick={() => handleQuantityChange(item._id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  onClick={() => handleMoveToCart(item._id, item.productId.title)}
                  disabled={item.productId.stock === 0 || movingItems.has(item._id)}
                  className="move-to-cart-btn"
                >
                  {movingItems.has(item._id) ? 'Moving...' : 'Move to Cart'}
                </button>
                
                <button 
                  onClick={() => removeFromWishlist(item._id)}
                  className="remove-btn"
                >
                  Remove
                </button>
                
                <a 
                  href={`/products/${item.productId.slug}`}
                  className="view-product-btn"
                >
                  View Product
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="wishlist-actions">
        <button 
          onClick={() => {
            wishlist.items.forEach(item => {
              if (item.productId.stock > 0) {
                moveToCart(item._id);
              }
            });
          }}
          className="move-all-to-cart-btn"
        >
          Move All to Cart
        </button>
      </div>
    </div>
  );
};

// Wishlist Button Component for Product Pages
export const WishlistButton = ({ productId, productData }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  
  const inWishlist = isInWishlist(productId);
  
  const handleToggleWishlist = async () => {
    setLoading(true);
    
    try {
      if (inWishlist) {
        const wishlistItem = getWishlistItem(productId);
        await removeFromWishlist(wishlistItem._id);
      } else {
        await addToWishlist(productId, {
          qty: 1,
          variant: productData.selectedVariant || {}
        });
      }
    } catch (err) {
      alert('Failed to update wishlist: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleToggleWishlist}
      disabled={loading}
      className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`}
    >
      {loading ? '...' : inWishlist ? '♥ In Wishlist' : '♡ Add to Wishlist'}
    </button>
  );
};

export default WishlistPage;
```

## Wishlist Features
- **Product Variants**: Support for product variations
- **Personal Notes**: Add notes to wishlist items
- **Quantity Management**: Adjust desired quantities
- **Move to Cart**: Easy conversion to purchase
- **Stock Monitoring**: Real-time availability updates
- **Share Wishlist**: Share with friends and family
- **Smart Recommendations**: Suggest similar products
