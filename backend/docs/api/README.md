# CanaGold API Documentation

## Overview
Complete API documentation for the CanaGold e-commerce platform. This documentation provides detailed specifications for all endpoints, request/response formats, and integration examples for frontend developers.

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.canagold.com/api
```

## Authentication
Most endpoints require authentication via Bearer token. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Response Format
All API responses follow this standard format:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "meta": {
    "timestamp": "ISO string",
    "requestId": "string"
  }
}
```

## Error Handling
Error responses include:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error message"
  },
  "statusCode": number
}
```

## API Sections

### Core Features
- [**Authentication**](./auth.md) - User registration, login, logout, token management
- [**User Management**](./users.md) - User profiles, addresses, preferences
- [**Products**](./products.md) - Product catalog, search, filtering
- [**Taxonomies**](./taxonomies.md) - Categories, tags, product organization
- [**Search**](./search.md) - Advanced search functionality
- [**Reviews**](./reviews.md) - Product reviews and ratings

### E-commerce Features
- [**Cart**](./cart.md) - Shopping cart management
- [**Wishlist**](./wishlist.md) - User wishlist functionality
- [**Orders**](./orders.md) - Order management and tracking
- [**Payments**](./payments.md) - Payment processing with Stripe
- [**Coupons**](./coupons.md) - Discount and coupon system

### Content & Admin
- [**Blog**](./blog.md) - Blog posts and content management
- [**Admin**](./admin.md) - Administrative functions
- [**File Upload**](./uploads.md) - Image and file management

## Getting Started

1. **Authentication Flow**
   ```javascript
   // 1. Register or login to get tokens
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'user@example.com', password: 'password' })
   });
   
   // 2. Store tokens securely
   const { accessToken, refreshToken } = response.data;
   localStorage.setItem('accessToken', accessToken);
   localStorage.setItem('refreshToken', refreshToken);
   
   // 3. Use token in subsequent requests
   const authenticatedRequest = await fetch('/api/users/profile', {
     headers: { 'Authorization': `Bearer ${accessToken}` }
   });
   ```

2. **Error Handling Best Practices**
   ```javascript
   try {
     const response = await apiCall();
     if (!response.success) {
       throw new Error(response.message);
     }
     return response.data;
   } catch (error) {
     // Handle specific error codes
     if (error.statusCode === 401) {
       // Refresh token or redirect to login
     }
     console.error('API Error:', error.message);
   }
   ```

## Rate Limiting
- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Admin endpoints**: 500 requests per 15 minutes per admin

## Pagination
Paginated endpoints support these query parameters:
```
?page=1&limit=20&sort=-createdAt
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Status Codes
- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `409` - Conflict (Resource already exists)
- `422` - Unprocessable Entity (Validation errors)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

## Support
For API support, contact: dev@canagold.com
