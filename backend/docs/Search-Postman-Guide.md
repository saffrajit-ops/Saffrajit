# Search API - Postman Testing Guide

This guide explains how to test the search functionality using the updated Postman collection.

## 🚀 Quick Start

1. **Import the Collection**: Import `postman/CanaGold.postman_collection.json` into Postman
2. **Set Base URL**: Update the `baseUrl` variable to your server URL (default: `http://localhost:5000/api`)
3. **Login First**: Run the "Login User" request to get authentication tokens
4. **Test Search**: Navigate to the "Search Functionality" folder

## 📁 Search Endpoints Organization

### **Search Functionality Folder**
Contains all search-related endpoints organized by use case:

- **User Product Search** - Public product search with optional authentication
- **Admin Product Search** - Admin-only product search with enhanced filters
- **Admin Order Search** - Search orders by customer info, order details
- **Search by Order Number** - Quick order lookup by order number
- **Search by Tracking Number** - Find orders by tracking number

### **Individual Endpoint Integration**
Search endpoints are also integrated into their respective folders:

- **Products (Public)** → "Search Products" endpoint
- **Admin - Products** → "Search Products (Admin)" endpoint  
- **Admin - Orders** → "Search Orders (Admin)" endpoint

## 🔍 Testing Different Search Scenarios

### **User Product Search Examples**

```bash
# Basic search
GET /products/search?q=face cream

# Search with filters
GET /products/search?q=wireless&inStock=true&minPrice=50&maxPrice=200

# Search with pagination
GET /products/search?q=skincare&page=2&limit=8
```

### **Admin Product Search Examples**

```bash
# Search all products (active + inactive)
GET /admin/products/search?q=premium&status=all

# Search only active products
GET /admin/products/search?q=cream&status=active

# Search with category filter
GET /admin/products/search?q=gold&category=CATEGORY_ID
```

### **Admin Order Search Examples**

```bash
# Search by customer email
GET /orders/admin/orders/search?q=john@example.com

# Search by order number
GET /orders/admin/orders/search?q=ORD-2024-001

# Search with status filter
GET /orders/admin/orders/search?q=smith&status=pending

# Search with date range
GET /orders/admin/orders/search?q=payment&startDate=2024-01-01&endDate=2024-12-31
```

## 🧪 Automated Testing

The collection includes automated tests for each search endpoint:

### **User Product Search Tests**
- ✅ Response status is 200
- ✅ Response structure validation
- ✅ Products array presence
- ✅ Pagination completeness

### **Admin Search Tests**
- ✅ Authentication validation
- ✅ Admin-specific response structure
- ✅ Enhanced data access verification

### **Order Search Tests**
- ✅ Order data structure validation
- ✅ User information presence
- ✅ Search result relevance

## 🔐 Authentication Notes

### **Public Endpoints**
- **User Product Search**: No authentication required, but enhanced features available with login

### **Admin Endpoints**
- **Admin Product Search**: Requires admin authentication
- **Admin Order Search**: Requires admin authentication
- **All Admin Search**: Auto-refresh token if expired

## 📊 Response Examples

### **Successful Product Search**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "searchQuery": "face cream",
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

### **Successful Order Search**
```json
{
  "success": true,
  "data": {
    "orders": [...],
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

### **Error Response**
```json
{
  "success": false,
  "message": "Search query is required"
}
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **"Search query is required"**
   - Ensure the `q` parameter is provided and not empty

2. **"Unauthorized" (401)**
   - Run "Login User" request first
   - Check if access token is valid
   - Try "Refresh Token" request

3. **"No results found"**
   - Verify search terms match existing data
   - Try broader search terms
   - Check if products/orders exist in database

### **Debug Tips**

1. **Check Console Logs**: Postman console shows authentication status
2. **Verify Variables**: Ensure `accessToken` and `baseUrl` are set
3. **Test Basic Endpoints**: Try "Get All Products" before searching
4. **Use Different Search Terms**: Test with various keywords

## 📝 Collection Variables

Make sure these variables are set in your collection:

- `baseUrl`: Your API base URL
- `accessToken`: JWT access token (auto-set after login)
- `refreshToken`: JWT refresh token (auto-set after login)
- `userId`: Current user ID (auto-set after login)
- `productId`: Sample product ID for testing
- `orderId`: Sample order ID for testing

## 🎯 Best Practices

1. **Start with Login**: Always authenticate before testing admin endpoints
2. **Use Realistic Data**: Test with actual product names and customer emails
3. **Test Edge Cases**: Empty queries, special characters, very long searches
4. **Verify Pagination**: Test with different page sizes and page numbers
5. **Check Filters**: Combine search with various filter options
6. **Monitor Performance**: Note response times for large result sets

## 📈 Performance Testing

Use the collection to test search performance:

1. **Small Queries**: 1-2 character searches
2. **Large Result Sets**: Broad terms returning many results
3. **Complex Filters**: Multiple filter combinations
4. **Pagination Stress**: High page numbers with large limits

The search implementation is optimized for small to medium datasets and should perform well for typical e-commerce use cases.