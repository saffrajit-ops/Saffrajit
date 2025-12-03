# Coupon API Documentation

## Overview

The coupon system allows admins to create discount coupons and users to apply them during checkout.

## Coupon Model

```javascript
{
  code: String,           // Unique coupon code (uppercase)
  type: 'flat' | 'percent', // Discount type
  value: Number,          // Discount value
  minSubtotal: Number,    // Minimum order amount
  startsAt: Date,         // When coupon becomes active
  endsAt: Date,           // When coupon expires
  usageLimit: Number,     // Max number of uses (null = unlimited)
  usedCount: Number,      // Current usage count
  appliesTo: {
    productIds: [ObjectId],    // Specific products
    taxonomyIds: [ObjectId]    // Product categories/collections
  },
  isActive: Boolean
}
```

## API Endpoints

### Public Routes

#### Validate Coupon

```
POST /api/coupons/validate
POST /api/products/validate-coupon
```

**Request Body:**

```json
{
  "code": "SAVE20",
  "subtotal": 100.0,
  "items": [
    {
      "productId": "product_id",
      "taxonomies": ["taxonomy_id"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "code": "SAVE20",
    "type": "percent",
    "value": 20,
    "discount": 20.0,
    "finalAmount": 80.0
  }
}
```

### Admin Routes (Require Authentication + Admin Role)

#### Create Coupon

```
POST /api/admin/coupons
```

**Request Body:**

```json
{
  "code": "SAVE20",
  "type": "percent",
  "value": 20,
  "minSubtotal": 50,
  "endsAt": "2024-12-31T23:59:59.000Z",
  "usageLimit": 100,
  "appliesTo": {
    "productIds": ["product_id"],
    "taxonomyIds": ["category_id"]
  }
}
```

#### Get All Coupons

```
GET /api/admin/coupons?page=1&limit=20&isActive=true&type=percent
```

#### Update Coupon

```
PUT /api/admin/coupons/:id
```

#### Delete Coupon

```
DELETE /api/admin/coupons/:id
```

## Checkout Integration

When creating a checkout session, include the coupon code:

```javascript
// Frontend
const checkoutData = {
  items: [{ productId: "product_id", qty: 2 }],
  couponCode: "SAVE20", // Optional
};

fetch("/api/payments/checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(checkoutData),
});
```

## Usage Flow

1. **User applies coupon in cart:**

   - Call `POST /api/products/validate-coupon` to validate
   - Show discount amount to user

2. **User proceeds to checkout:**

   - Include `couponCode` in checkout session request
   - System validates coupon again and applies discount

3. **Payment completion:**
   - Coupon usage count is automatically incremented
   - Order includes coupon details for reference

## Security Features

- Coupon codes are automatically converted to uppercase
- Validation checks expiry, usage limits, and minimum order amounts
- Product/category restrictions are enforced
- Usage count is atomically incremented only on successful payment
- All admin operations require authentication and admin role

## Error Handling

Common error responses:

- `404`: Coupon not found
- `400`: Coupon expired, usage limit reached, or minimum order not met
- `400`: Coupon not applicable to cart items
- `401`: Authentication required (admin routes)
- `403`: Admin role required

##

Frontend Integration Examples

### Cart Component with Coupon Application

```javascript
// React example
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [subtotal, setSubtotal] = useState(0);

  const applyCoupon = async () => {
    try {
      const response = await fetch("/api/products/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal: subtotal,
          items: cartItems.map((item) => ({
            productId: item.productId,
            taxonomies: item.taxonomies,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAppliedCoupon(result.data);
        // Show success message
      } else {
        // Show error message
        alert(result.message);
      }
    } catch (error) {
      console.error("Coupon validation failed:", error);
    }
  };

  const proceedToCheckout = async () => {
    const checkoutData = {
      items: cartItems,
      couponCode: appliedCoupon?.code,
    };

    const response = await fetch("/api/payments/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(checkoutData),
    });

    const result = await response.json();
    if (result.success) {
      window.location.href = result.url;
    }
  };

  return (
    <div>
      {/* Cart items */}

      {/* Coupon section */}
      <div className="coupon-section">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        />
        <button onClick={applyCoupon}>Apply Coupon</button>
      </div>

      {/* Order summary */}
      <div className="order-summary">
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        {appliedCoupon && (
          <div>
            Discount ({appliedCoupon.code}): -$
            {appliedCoupon.discount.toFixed(2)}
          </div>
        )}
        <div>
          <strong>
            Total: $
            {appliedCoupon
              ? appliedCoupon.finalAmount.toFixed(2)
              : subtotal.toFixed(2)}
          </strong>
        </div>
      </div>

      <button onClick={proceedToCheckout}>Checkout</button>
    </div>
  );
};
```

### Admin Coupon Management

```javascript
// Admin dashboard coupon creation
const CreateCoupon = () => {
  const [formData, setFormData] = useState({
    code: "",
    type: "percent",
    value: "",
    minSubtotal: 0,
    endsAt: "",
    usageLimit: "",
    isActive: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message and reset form
        alert("Coupon created successfully!");
        setFormData({
          /* reset to initial state */
        });
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Failed to create coupon:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Coupon Code"
        value={formData.code}
        onChange={(e) =>
          setFormData({ ...formData, code: e.target.value.toUpperCase() })
        }
        required
      />

      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
      >
        <option value="percent">Percentage</option>
        <option value="flat">Fixed Amount</option>
      </select>

      <input
        type="number"
        placeholder="Discount Value"
        value={formData.value}
        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
        required
      />

      <input
        type="number"
        placeholder="Minimum Order Amount"
        value={formData.minSubtotal}
        onChange={(e) =>
          setFormData({ ...formData, minSubtotal: e.target.value })
        }
      />

      <input
        type="datetime-local"
        value={formData.endsAt}
        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
        required
      />

      <input
        type="number"
        placeholder="Usage Limit (optional)"
        value={formData.usageLimit}
        onChange={(e) =>
          setFormData({ ...formData, usageLimit: e.target.value })
        }
      />

      <button type="submit">Create Coupon</button>
    </form>
  );
};
```
