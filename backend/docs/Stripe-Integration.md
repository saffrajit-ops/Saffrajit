# Stripe Integration & Order Management Guide

## Overview
This integration provides secure payment processing using Stripe Checkout and comprehensive order management for the CanaGold e-commerce platform.

## Features
- Secure checkout sessions with Stripe Checkout
- Automatic stock management after successful payments
- Complete order lifecycle management (pending → confirmed → processing → shipped → delivered)
- Order tracking with comprehensive status system
- Webhook handling for payment confirmations
- Return/refund management system
- Admin order management dashboard
- Optional user authentication (works for both guests and logged-in users)

## Environment Variables
Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:3000
CURRENCY=usd
```

## API Endpoints

### Payment Endpoints (`/api/payments`)

#### Create Checkout Session
**POST** `/api/payments/checkout-session`

**Headers:**
- `Authorization: Bearer <token>` (optional - for user-specific features)
- `Content-Type: application/json`

**Body:**
```json
{
  "items": [
    {
      "productId": "product_id_here",
      "qty": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_test_...",
  "orderId": "order_id_here"
}
```

#### Webhook Endpoint
**POST** `/api/payments/webhook`

This endpoint handles Stripe webhooks automatically. Configure it in your Stripe dashboard:
- URL: `https://yourdomain.com/api/payments/webhook`
- Events: `checkout.session.completed`, `checkout.session.expired`

### Order Management Endpoints (`/api/orders`)

#### User Order Endpoints (Require Authentication)

##### Get User's Orders
**GET** `/api/orders?page=1&limit=10&status=confirmed`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of orders per page
- `status` (optional): Filter by order status

**Response:**
```json
{
  "success": true,
  "data": [...orders],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

##### Get Single Order
**GET** `/api/orders/:orderId`

**Headers:**
- `Authorization: Bearer <token>` (required)

##### Cancel Order
**PUT** `/api/orders/:orderId/cancel`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "reason": "Changed my mind"
}
```

##### Request Return/Refund
**POST** `/api/orders/:orderId/return`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "reason": "Product damaged",
  "items": [
    {
      "product": "product_id",
      "quantity": 1,
      "reason": "Damaged during shipping"
    }
  ]
}
```

#### Admin Order Endpoints (Require Admin Role)

##### Get All Orders
**GET** `/api/orders/admin/orders?page=1&limit=10&status=processing`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `search`: Search by order number or user email
- `startDate`, `endDate`: Date range filter
- `sort`: Sort order (default: `-createdAt`)

##### Get Order Statistics
**GET** `/api/orders/admin/stats?period=30d`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)

**Query Parameters:**
- `period`: `7d`, `30d`, or `90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "stats": {
      "totalOrders": 150,
      "totalRevenue": 12500.50,
      "averageOrderValue": 83.34,
      "pendingOrders": 5,
      "confirmedOrders": 120,
      "processingOrders": 15,
      "shippedOrders": 8,
      "deliveredOrders": 100,
      "cancelledOrders": 2,
      "failedOrders": 0
    }
  }
}
```

##### Update Order Status
**PUT** `/api/orders/admin/orders/:orderId/status`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "status": "processing",
  "notes": "Order is being prepared",
  "trackingNumber": "TRK123456789"
}
```

**Valid Statuses:**
- `pending` → `confirmed` → `processing` → `shipped` → `delivered`
- Alternative: `cancelled`, `returned`, `refunded`, `failed`

##### Handle Return Request
**PUT** `/api/orders/admin/orders/:orderId/return`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "action": "approve",
  "notes": "Return approved - product was damaged",
  "refundAmount": 89.99
}
```

##### Process Refund
**POST** `/api/orders/admin/orders/:orderId/refund`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "amount": 89.99,
  "reason": "Product return - damaged item",
  "method": "stripe"
}
```

##### Mark Order as Failed
**PUT** `/api/orders/admin/orders/:orderId/failed`

**Headers:**
- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "reason": "Payment processing failed"
}
```

## Testing with Stripe CLI

1. Install Stripe CLI
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:5000/api/payments/webhook`
4. Copy the webhook secret to your `.env` file
5. Test payments with Stripe test cards

## Test Cards
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Requires authentication: `4000002500003155`

## Order Flow

### Payment & Order Creation Flow
1. **Create Checkout Session**: Client calls `/api/payments/checkout-session` with product items
2. **Order Creation**: Server validates products, stock, and creates order with `status: 'pending'`
3. **Payment Processing**: User completes payment on Stripe Checkout
4. **Webhook Confirmation**: Stripe sends webhook to `/api/payments/webhook`
5. **Order Confirmation**: Server marks order as `confirmed`, decrements stock, records payment
6. **Success Redirect**: Client redirects to success page with order ID

### Complete Order Lifecycle
```
pending → confirmed → processing → shipped → delivered
   ↓         ↓           ↓          ↓         ↓
failed   cancelled   cancelled   cancelled  returned/refunded
```

### Order Status Definitions
- **pending**: Order created, payment not yet processed
- **confirmed**: Payment successful, order confirmed
- **processing**: Order being prepared/packed
- **shipped**: Order dispatched with tracking number
- **delivered**: Order successfully delivered
- **cancelled**: Order cancelled (before shipping)
- **failed**: Payment failed or order processing failed
- **returned**: Customer returned the order
- **refunded**: Refund processed for the order

### Return & Refund Flow
1. **Customer Request**: Customer requests return via `/api/orders/:id/return`
2. **Admin Review**: Admin approves/rejects via `/api/orders/admin/orders/:id/return`
3. **Refund Processing**: Admin processes refund via `/api/orders/admin/orders/:id/refund`
4. **Status Update**: Order status updated to `returned` or `refunded`

## Route Structure

### Payment Routes (`src/routes/payments.routes.js`)
```javascript
POST /checkout-session  // Create Stripe checkout session (optional auth)
POST /webhook          // Handle Stripe webhooks (no auth)
```

### Order Routes (`src/routes/order.routes.js`)
```javascript
// User routes (require authentication)
GET    /                    // Get user's orders
GET    /:orderId           // Get single order
PUT    /:orderId/cancel    // Cancel order
POST   /:orderId/return    // Request return

// Admin routes (require admin role)
GET    /admin/orders              // Get all orders
GET    /admin/stats               // Get order statistics
GET    /admin/orders/:orderId     // Get order details (admin view)
PUT    /admin/orders/:orderId/status    // Update order status
PUT    /admin/orders/:orderId/return    // Handle return request
POST   /admin/orders/:orderId/refund    // Process refund
PUT    /admin/orders/:orderId/failed    // Mark order as failed
```

## Authentication & Authorization

### User Authentication
- **Required**: All order management endpoints require valid JWT token
- **Optional**: Payment checkout works with or without authentication
- **Header**: `Authorization: Bearer <jwt_token>`

### Admin Authorization
- **Required**: Admin endpoints require `admin` role
- **Middleware**: `authorize(['admin'])` applied to admin routes
- **Access**: Only users with `role: 'admin'` can access admin endpoints

## Security Notes
- All pricing is server-side controlled
- Stock validation prevents overselling
- Webhook signatures are verified for authenticity
- Orders are created before payment to prevent race conditions
- Role-based access control for admin functions
- User can only access their own orders
- Admin can access all orders and management functions
- Automatic stock restoration on order cancellation
- 30-day return window validation
- Comprehensive audit trail with status history

## Error Handling
All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (new order/resource)
- `400`: Bad request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found (order/resource not found)
- `500`: Internal server error

## Integration Examples

### Frontend Integration
```javascript
// Create checkout session
const response = await fetch('/api/payments/checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}` // optional
  },
  body: JSON.stringify({
    items: [
      { productId: 'prod_123', qty: 2 },
      { productId: 'prod_456', qty: 1 }
    ]
  })
});

const { url, orderId } = await response.json();
// Redirect to Stripe Checkout
window.location.href = url;
```

### Admin Dashboard Integration
```javascript
// Get order statistics
const stats = await fetch('/api/orders/admin/stats?period=30d', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Update order status
await fetch(`/api/orders/admin/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'shipped',
    trackingNumber: 'TRK123456789',
    notes: 'Shipped via FedEx'
  })
});
```