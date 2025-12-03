# Search API Documentation

This document describes the search functionality available in the application.

## User-Side Product Search

### Endpoint
```
GET /api/products/search
```

### Parameters
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `sort` (optional): Sort order (default: '-createdAt')
- `category` (optional): Filter by category ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `inStock` (optional): Filter for in-stock items ('true')

### Example Request
```bash
GET /api/products/search?q=wireless%20headphones&page=1&limit=10&inStock=true&minPrice=50&maxPrice=200
```

### Example Response
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "title": "Wireless Bluetooth Headphones",
        "price": 99.99,
        "images": [...],
        "taxonomies": [...]
      }
    ],
    "searchQuery": "wireless headphones",
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalProducts": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Admin Product Search

### Endpoint
```
GET /api/admin/products/search
```

### Authentication
Requires admin authentication.

### Parameters
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort` (optional): Sort order (default: '-createdAt')
- `status` (optional): Filter by status ('active', 'inactive', 'all')
- `category` (optional): Filter by category ID
- `type` (optional): Filter by product type

### Example Request
```bash
GET /api/admin/products/search?q=headphones&status=active&page=1&limit=20
```

### Search Fields
The search looks in the following product fields:
- Title
- Description
- Brand
- SKU
- Slug
- Tags

## Admin Order Search

### Endpoint
```
GET /api/orders/admin/orders/search
```

### Authentication
Requires admin authentication.

### Parameters
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by order status
- `startDate` (optional): Filter orders from this date
- `endDate` (optional): Filter orders until this date
- `sort` (optional): Sort order (default: '-createdAt')

### Example Request
```bash
GET /api/orders/admin/orders/search?q=john@example.com&status=pending&page=1
```

### Search Fields
The search looks in the following fields:
- Order number
- Payment intent ID
- Transaction ID
- Tracking number
- User email
- User name

### Example Response
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-2024-001",
        "status": "pending",
        "total": 199.99,
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "items": [...]
      }
    ],
    "searchQuery": "john@example.com",
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalOrders": 5,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

## Search Tips

### For Products:
- Search by product name, brand, or SKU
- Use multiple keywords for better results
- Combine search with filters for precise results
- Search is case-insensitive

### For Orders:
- Search by customer email or name
- Search by order number or tracking number
- Search by payment transaction ID
- Combine with date ranges for time-specific searches

## Error Responses

### Missing Search Query
```json
{
  "success": false,
  "message": "Search query is required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Failed to search products/orders",
  "error": "Error details"
}
```

## Implementation Notes

- All searches are case-insensitive
- Multiple search terms are treated as separate keywords (OR logic)
- Search results are paginated for performance
- Admin searches include inactive/deleted items
- User searches only show active products
- Search performance is optimized for small to medium datasets