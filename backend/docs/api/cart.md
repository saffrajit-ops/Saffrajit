# Cart API

## Overview
Shopping cart management system for authenticated users with real-time inventory validation and pricing calculations.

## Endpoints

### Get User Cart
Retrieve current user's shopping cart with calculated totals.

**Endpoint:** `GET /api/cart`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "_id": "cart_item_id",
          "productId": {
            "_id": "product_id",
            "title": "Premium Face Cream",
            "slug": "premium-face-cream",
            "price": 89.99,
            "stock": 50,
            "images": [
              {
                "url": "https://...",
                "altText": "Product image"
              }
            ],
            "isActive": true
          },
          "qty": 2,
          "variant": {
            "size": "100ml",
            "type": "Normal"
          },
          "price": 89.99,
          "lineTotal": 179.98,
          "addedAt": "2024-01-01T10:00:00.000Z"
        }
      ],
      "totals": {
        "subtotal": 179.98,
        "tax": 14.40,
        "shipping": 9.99,
        "discount": 0,
        "total": 204.37
      },
      "itemCount": 2,
      "lastModified": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

#### Empty Cart Response (200)
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [],
      "totals": {
        "subtotal": 0,
        "tax": 0,
        "shipping": 0,
        "discount": 0,
        "total": 0
      },
      "itemCount": 0
    }
  }
}
```

---

### Add Product to Cart
Add a product to the shopping cart or update quantity if already exists.

**Endpoint:** `POST /api/cart/add`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "productId": "product_id",        // Required
  "qty": 2,                         // Required: positive integer
  "variant": {                      // Optional: product variants
    "size": "100ml",
    "type": "Normal",
    "color": "Natural"
  }
}
```

#### Validation Rules
- `productId`: Must be valid ObjectId of active product
- `qty`: Positive integer, will be validated against stock
- `variant`: Object with variant options (if product has variants)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "cart": {
      // ... complete cart object with updated items
    },
    "addedItem": {
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
// 404 - Product Not Found
{
  "success": false,
  "message": "Product not found or inactive"
}

// 400 - Insufficient Stock
{
  "success": false,
  "message": "Insufficient stock",
  "error": {
    "available": 5,
    "requested": 10
  }
}

// 400 - Invalid Variant
{
  "success": false,
  "message": "Invalid product variant",
  "error": {
    "invalidOptions": ["invalidSize"]
  }
}
```

---

### Update Cart Item Quantity
Update the quantity of a specific cart item.

**Endpoint:** `PUT /api/cart/items/{cartItemId}`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "qty": 3    // Required: positive integer
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cart": {
      // ... updated cart object
    }
  }
}
```

#### Error Responses
```json
// 404 - Cart Item Not Found
{
  "success": false,
  "message": "Cart item not found"
}

// 400 - Insufficient Stock
{
  "success": false,
  "message": "Cannot update quantity. Insufficient stock",
  "error": {
    "available": 5,
    "requested": 10
  }
}
```

---

### Increase Cart Item Quantity
Increment cart item quantity by specified amount.

**Endpoint:** `PUT /api/cart/items/{cartItemId}/increase`
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
  "message": "Cart item quantity increased successfully",
  "data": {
    "cart": {
      // ... updated cart object
    }
  }
}
```

---

### Decrease Cart Item Quantity
Decrement cart item quantity by specified amount.

**Endpoint:** `PUT /api/cart/items/{cartItemId}/decrease`
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
  "message": "Cart item quantity decreased successfully",
  // OR if quantity becomes 0:
  "message": "Cart item removed (quantity reached 0)",
  "data": {
    "cart": {
      // ... updated cart object
    }
  }
}
```

---

### Remove Item from Cart
Remove a specific item from the shopping cart.

**Endpoint:** `DELETE /api/cart/items/{cartItemId}`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart": {
      // ... updated cart object
    }
  }
}
```

#### Error Response
```json
// 404 - Cart Item Not Found
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### Get Cart Total for Checkout
Get detailed cart totals with shipping and tax calculations.

**Endpoint:** `GET /api/cart/total`
**Authentication:** Required (Bearer token)

#### Query Parameters
```
couponCode=SAVE20         // Optional: apply coupon code
shippingAddressId=addr_id // Optional: calculate shipping for specific address
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "totals": {
      "subtotal": 179.98,
      "tax": 14.40,
      "taxRate": 0.08,
      "shipping": 9.99,
      "shippingMethod": "Standard",
      "discount": 18.00,
      "couponCode": "SAVE20",
      "couponDiscount": 18.00,
      "total": 186.37
    },
    "breakdown": {
      "itemsCount": 2,
      "itemsSubtotal": 179.98,
      "applicableTaxes": [
        {
          "name": "Sales Tax",
          "rate": 0.08,
          "amount": 14.40
        }
      ],
      "shippingOptions": [
        {
          "method": "Standard",
          "cost": 9.99,
          "estimatedDays": "5-7"
        },
        {
          "method": "Express",
          "cost": 19.99,
          "estimatedDays": "2-3"
        }
      ]
    }
  }
}
```

#### Error Responses
```json
// 400 - Empty Cart
{
  "success": false,
  "message": "Cannot calculate total for empty cart"
}

// 400 - Invalid Coupon
{
  "success": false,
  "message": "Invalid or expired coupon code"
}
```

---

### Clear Entire Cart
Remove all items from the shopping cart.

**Endpoint:** `DELETE /api/cart/clear`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [],
      "totals": {
        "subtotal": 0,
        "tax": 0,
        "shipping": 0,
        "discount": 0,
        "total": 0
      },
      "itemCount": 0
    }
  }
}
```

---

## Frontend Integration Examples

### React Cart Hook
```javascript
import { useState, useEffect, useContext, createContext } from 'react';
import { useAuth } from './useAuth';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, accessToken } = useAuth();

  // Fetch cart when user logs in
  const fetchCart = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data.cart);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = async (productId, qty = 1, variant = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ productId, qty, variant })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data.cart);
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

  // Update item quantity
  const updateQuantity = async (cartItemId, qty) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ qty })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data.cart);
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

  // Remove item from cart
  const removeItem = async (cartItemId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data.cart);
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

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data.cart);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  // Get cart totals with optional coupon
  const getCartTotals = async (couponCode = null) => {
    if (!accessToken) return null;
    
    try {
      const url = couponCode ? 
        `/api/cart/total?couponCode=${couponCode}` : 
        '/api/cart/total';
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.totals;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch cart on component mount and user change
  useEffect(() => {
    if (user && accessToken) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user, accessToken]);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getCartTotals,
    refreshCart: fetchCart,
    itemCount: cart?.itemCount || 0,
    total: cart?.totals?.total || 0
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
```

### Cart Component Example
```javascript
import React from 'react';
import { useCart } from './useCart';

const CartPage = () => {
  const { 
    cart, 
    loading, 
    error, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();

  if (loading) return <div>Loading cart...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!cart || cart.items.length === 0) {
    return <div>Your cart is empty</div>;
  }

  return (
    <div className="cart-page">
      <h2>Shopping Cart ({cart.itemCount} items)</h2>
      
      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item._id} className="cart-item">
            <img 
              src={item.productId.images[0]?.url} 
              alt={item.productId.title} 
            />
            
            <div className="item-details">
              <h4>{item.productId.title}</h4>
              {item.variant && (
                <div className="variant">
                  {Object.entries(item.variant).map(([key, value]) => (
                    <span key={key}>{key}: {value}</span>
                  ))}
                </div>
              )}
              <div className="price">${item.price}</div>
            </div>
            
            <div className="quantity-controls">
              <button 
                onClick={() => updateQuantity(item._id, item.qty - 1)}
                disabled={item.qty <= 1}
              >
                -
              </button>
              <span>{item.qty}</span>
              <button 
                onClick={() => updateQuantity(item._id, item.qty + 1)}
              >
                +
              </button>
            </div>
            
            <div className="line-total">${item.lineTotal}</div>
            
            <button 
              className="remove-btn"
              onClick={() => removeItem(item._id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-totals">
        <div>Subtotal: ${cart.totals.subtotal}</div>
        <div>Tax: ${cart.totals.tax}</div>
        <div>Shipping: ${cart.totals.shipping}</div>
        {cart.totals.discount > 0 && (
          <div>Discount: -${cart.totals.discount}</div>
        )}
        <div className="total">Total: ${cart.totals.total}</div>
      </div>
      
      <div className="cart-actions">
        <button onClick={clearCart} className="clear-btn">
          Clear Cart
        </button>
        <button className="checkout-btn">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};
```

## Business Logic
- **Stock Validation**: Automatically validates product availability
- **Price Synchronization**: Cart prices update with product price changes
- **Variant Handling**: Supports complex product variations
- **Auto-cleanup**: Removes inactive products from cart
- **Merge Strategy**: Handles cart merging for guest-to-authenticated user scenarios

## Performance Considerations
- Cart is cached in memory for authenticated users
- Real-time inventory checking prevents overselling
- Optimistic updates for better UX
- Debounced quantity updates to reduce API calls
