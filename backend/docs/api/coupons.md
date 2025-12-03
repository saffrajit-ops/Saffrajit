# Coupons API

## Overview
Comprehensive coupon and discount code management system with flexible discount types, usage tracking, and validation rules.

## Public Endpoints

### Validate Coupon Code
Validate coupon code and calculate discount for cart items.

**Endpoint:** `POST /api/coupons/validate`
**Authentication:** None required

#### Request Body Structure
```json
{
  "code": "SAVE20",
  "subtotal": 100.00,
  "items": [
    {
      "productId": "product_id",
      "taxonomies": ["category_id"]
    }
  ]
}
```

#### Validation Rules
- Code must be active and not expired
- Current date must be within validity period
- Usage limit not exceeded
- Minimum subtotal requirement met
- Applies to eligible products/categories

#### Success Response
Returns discount calculation and applicability details:
- Coupon code and type
- Discount amount and percentage
- Final amount after discount
- Applicable products and categories
- Usage statistics and limits

#### Error Responses
- **Invalid Code**: Coupon does not exist or inactive
- **Expired**: Coupon validity period ended
- **Usage Limit**: Maximum uses reached
- **Minimum Not Met**: Subtotal below minimum requirement
- **Not Applicable**: No eligible items in cart

## Admin Endpoints

### Get All Coupons
Retrieve all coupons with filtering and pagination.

**Endpoint:** `GET /api/admin/coupons`
**Authentication:** Required (Admin role)

#### Query Parameters
- `page`: Page number for pagination
- `limit`: Items per page (max: 100)
- `isActive`: Filter by active status
- `type`: Filter by discount type (flat/percent)
- `sort`: Sort order (-createdAt, -usageCount)

#### Response Structure
Returns paginated list of coupons with:
- Coupon identification and code
- Discount type and value
- Validity period and status
- Usage statistics and limits
- Application rules and restrictions
- Creation and modification dates

#### Statistics Summary
Includes aggregate data:
- Total active coupons
- Total discount amount distributed
- Average discount per coupon
- Most used coupons
- Expiring soon alerts

---

### Create Coupon
Create new discount coupon with custom rules.

**Endpoint:** `POST /api/admin/coupons`
**Authentication:** Required (Admin role)

#### Request Body
```json
{
  "code": "WELCOME10",
  "type": "percent",
  "value": 10,
  "minSubtotal": 50,
  "endsAt": "2024-12-31T23:59:59.000Z",
  "usageLimit": 100,
  "isActive": true,
  "appliesTo": {
    "productIds": ["product_id"],
    "taxonomyIds": ["category_id"]
  }
}
```

#### Field Requirements
- **code**: Unique alphanumeric code (4-20 characters)
- **type**: Discount type (flat amount or percentage)
- **value**: Discount value (positive number)
- **minSubtotal**: Minimum purchase amount (optional)
- **endsAt**: Expiration date/time (optional)
- **usageLimit**: Maximum number of uses (optional)
- **appliesTo**: Product/category restrictions (optional)

#### Discount Types
**Flat Discount**: Fixed amount off (e.g., $20 off)
**Percentage Discount**: Percentage off total (e.g., 10% off)

#### Application Rules
- **Global**: Applies to entire cart
- **Product-Specific**: Only specific products
- **Category-Specific**: Products in specific categories
- **Minimum Purchase**: Requires minimum subtotal

---

### Update Coupon
Modify existing coupon settings.

**Endpoint:** `PUT /api/admin/coupons/{couponId}`
**Authentication:** Required (Admin role)

#### Updateable Fields
- Discount value and type
- Validity period extension
- Usage limit adjustments
- Active status toggle
- Application rules modification
- Minimum purchase requirements

#### Business Rules
- Cannot change code of used coupon
- Cannot reduce discount for active campaigns
- Usage count preserved during updates
- Historical usage data maintained

---

### Delete Coupon
Remove coupon from system (soft delete if used).

**Endpoint:** `DELETE /api/admin/coupons/{couponId}`
**Authentication:** Required (Admin role)

#### Deletion Logic
- Active coupons: Soft delete (deactivate)
- Unused coupons: Hard delete allowed
- Used coupons: Preserve for historical data
- Related orders: Maintain discount information

---

### Get Coupon Analytics
Retrieve detailed coupon performance metrics.

**Endpoint:** `GET /api/admin/coupons/{couponId}/analytics`
**Authentication:** Required (Admin role)

#### Analytics Data
- Total usage count and trends
- Revenue impact and ROI
- Average order value with coupon
- Customer acquisition through coupon
- Geographic usage distribution
- Time-based usage patterns

#### Performance Metrics
- Conversion rate improvement
- Cart abandonment reduction
- Customer retention impact
- Profitability analysis

## Coupon Management Features

### Coupon Types and Strategies

**Welcome Coupons**: First-time customer incentives
**Loyalty Coupons**: Reward returning customers
**Seasonal Coupons**: Holiday and event promotions
**Cart Abandonment**: Recovery discount codes
**Referral Coupons**: Friend referral incentives

### Usage Tracking

**Per-User Limits**: Restrict uses per customer
**Global Limits**: Total usage across all customers
**Time Windows**: Valid only during specific periods
**Combination Rules**: Stack with other offers or exclusive

### Validation System

**Real-Time Checks**: Instant validation during checkout
**Inventory Integration**: Verify product availability
**Price Verification**: Ensure pricing accuracy
**Fraud Prevention**: Detect coupon abuse patterns

## Advanced Coupon Features

### Dynamic Pricing Rules
- Tiered discounts based on cart value
- Buy-one-get-one (BOGO) promotions
- Quantity-based discounts
- Bundle deal pricing

### Targeting and Segmentation
- Customer segment restrictions
- First-time buyer only
- VIP customer exclusives
- Geographic targeting

### Auto-Application
- Automatic best coupon selection
- Smart coupon recommendations
- Cart value optimization
- Customer benefit maximization

## Integration Considerations

### Checkout Integration
- Seamless coupon application
- Real-time discount calculation
- Tax and shipping adjustments
- Final price transparency

### Order Management
- Coupon information in order details
- Discount attribution tracking
- Refund handling with coupons
- Return policy interactions

### Marketing Automation
- Automated coupon distribution
- Email campaign integration
- SMS coupon delivery
- Social media promotions

## Error Handling

### Common Validation Errors
- Expired coupon codes
- Usage limit exceeded
- Minimum purchase not met
- Product exclusions
- Customer eligibility issues

### Error Recovery
- Alternative coupon suggestions
- Partial discount application
- Customer service escalation
- Manual override capabilities

## Performance Optimization

### Caching Strategy
- Active coupon code caching
- Validation rule optimization
- Usage count update batching
- Quick lookup mechanisms

### Scalability Features
- High-volume validation handling
- Concurrent usage tracking
- Database query optimization
- API response time targets

## Security Measures

### Fraud Prevention
- Rate limiting on validation attempts
- IP-based abuse detection
- Pattern recognition for misuse
- Administrative alerts for anomalies

### Code Generation
- Secure random code generation
- Uniqueness verification
- Brute-force protection
- Public code format standards
