# CanaGold API Postman Collection

This Postman collection provides comprehensive testing for the CanaGold ecommerce API, including the new coupon system.

## 🚀 Quick Start

1. **Import the collection**: Import `CanaGold.postman_collection.json` into Postman
2. **Import environment**: Import `CanaGold_Environment.postman_environment.json` 
3. **Set base URL**: Update the `baseUrl` variable to match your server (default: `http://localhost:5000/api`)
4. **Login first**: Run the "Login User" request to get authentication tokens

## 📋 Collection Structure

### Authentication & Users
- **Authentication**: Register, login, refresh tokens, logout
- **User Profile**: Get/update profile, upload image, change password
- **Address Management**: Add, update, delete addresses

### Products & Catalog
- **Products (Public)**: Browse products, search, get by ID/slug, similar products
- **Taxonomies (Public)**: Categories, collections, concerns, gift types
- **Search Functionality**: Advanced search with filters

### 🎟️ Coupons (NEW!)
- **Public Routes**:
  - `POST /coupons/validate` - Validate coupon code
  - `POST /products/validate-coupon` - Validate coupon in cart context

- **Admin Routes** (Require admin authentication):
  - `GET /admin/coupons` - List all coupons
  - `POST /admin/coupons` - Create new coupon
  - `PUT /admin/coupons/:id` - Update coupon
  - `DELETE /admin/coupons/:id` - Delete coupon

### Payments & Orders
- **Payments**: Create checkout sessions with/without coupons, webhook handling
- **Orders (User)**: View orders, cancel, request returns
- **Orders (Admin)**: Manage all orders, update status, handle returns

### Admin Panel
- **Dashboard**: Statistics and overview
- **User Management**: View users, update roles, toggle status
- **Product Management**: CRUD operations, image management
- **Taxonomy Management**: Category/collection management
- **Coupon Management**: Full coupon lifecycle management

## 🎟️ Coupon System Usage

### Creating Coupons (Admin)

**Basic Percentage Coupon:**
```json
{
  "code": "WELCOME10",
  "type": "percent",
  "value": 10,
  "minSubtotal": 50,
  "endsAt": "2024-12-31T23:59:59.000Z",
  "usageLimit": 100,
  "isActive": true
}
```

**Product-Specific Flat Discount:**
```json
{
  "code": "SKINCARE20",
  "type": "flat",
  "value": 20,
  "minSubtotal": 100,
  "endsAt": "2024-12-31T23:59:59.000Z",
  "appliesTo": {
    "productIds": ["product_id_here"],
    "taxonomyIds": ["category_id_here"]
  },
  "isActive": true
}
```

### Validating Coupons (Public)

```json
{
  "code": "SAVE20",
  "subtotal": 100.00,
  "items": [
    {
      "productId": "product_id",
      "taxonomies": ["taxonomy_id"]
    }
  ]
}
```

### Checkout with Coupon

```json
{
  "items": [
    {
      "productId": "product_id",
      "qty": 2
    }
  ],
  "couponCode": "WELCOME10"
}
```

## 🔧 Variables

The collection uses these variables (automatically managed):

- `baseUrl` - API base URL
- `accessToken` - JWT access token (auto-refreshed)
- `refreshToken` - JWT refresh token
- `userId` - Current user ID
- `productId` - Last created/retrieved product ID
- `taxonomyId` - Last created/retrieved taxonomy ID
- `couponId` - Last created coupon ID
- `orderId` - Last created order ID
- `stripeSessionId` - Last checkout session ID

## 🔐 Authentication Flow

1. **Register/Login**: Get initial tokens
2. **Auto-refresh**: Collection automatically refreshes expired access tokens
3. **Admin routes**: Require admin role (update user role via admin panel)

## 🧪 Testing Workflow

### Basic E-commerce Flow:
1. Register/Login user
2. Browse products
3. Validate coupon (optional)
4. Create checkout session (with/without coupon)
5. View orders

### Admin Workflow:
1. Login as admin
2. Create products/categories
3. Create coupons
4. Manage orders
5. View dashboard stats

## 📊 Response Examples

### Successful Coupon Validation:
```json
{
  "success": true,
  "data": {
    "code": "SAVE20",
    "type": "percent",
    "value": 20,
    "discount": 20.00,
    "finalAmount": 80.00
  }
}
```

### Order with Coupon:
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "items": [...],
    "subtotal": 100.00,
    "coupon": {
      "code": "SAVE20",
      "type": "percent",
      "value": 20,
      "discount": 20.00
    },
    "total": 80.00,
    "status": "confirmed"
  }
}
```

## 🚨 Error Handling

Common error responses:
- `400` - Validation errors, invalid coupon, minimum order not met
- `401` - Authentication required
- `403` - Insufficient permissions (admin required)
- `404` - Resource not found
- `500` - Server error

## 💡 Tips

- **Auto-refresh**: The collection automatically refreshes tokens when needed
- **Variable management**: IDs are automatically saved from responses
- **Admin testing**: Create an admin user via the admin panel or database
- **Coupon testing**: Create test coupons with short expiry dates for testing
- **Order flow**: Test the complete flow from cart to payment completion

## 🔗 Related Documentation

- [Coupon API Documentation](../docs/Coupon-API.md)
- [Models Documentation](../docs/Models.md)
- Main API documentation in the project root