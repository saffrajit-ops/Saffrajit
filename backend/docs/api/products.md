# Products API

## Overview
Complete product management system with search, filtering, and catalog functionality.

## Public Endpoints

### Get All Products
Retrieve paginated list of active products.

**Endpoint:** `GET /api/products`
**Authentication:** Optional (enhanced features with auth)

#### Query Parameters
```
page=1                    // Page number (default: 1)
limit=12                  // Items per page (default: 12, max: 50)
sort=-createdAt          // Sort field (createdAt, price, name, rating)
category=category_id     // Filter by category
type=single              // Filter by product type
minPrice=10              // Minimum price filter
maxPrice=100             // Maximum price filter
inStock=true             // Show only in-stock products
featured=true            // Show only featured products
search=skincare          // Search in title and description
brand=CanaGold           // Filter by brand
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "title": "Premium Face Cream",
        "slug": "premium-face-cream",
        "sku": "PFC001",
        "type": "single",
        "brand": "CanaGold",
        "shortDescription": "Luxurious anti-aging cream",
        "description": "Complete product description...",
        "price": 89.99,
        "compareAtPrice": 119.99,
        "stock": 50,
        "isActive": true,
        "isFeatured": true,
        "images": [
          {
            "_id": "image_id",
            "url": "https://...",
            "altText": "Product image",
            "isPrimary": true
          }
        ],
        "taxonomies": [
          {
            "_id": "taxonomy_id",
            "name": "Skincare",
            "type": "category"
          }
        ],
        "rating": {
          "average": 4.5,
          "count": 23
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 58,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "categories": [...],
      "brands": [...],
      "priceRange": { "min": 10, "max": 200 }
    }
  }
}
```

---

### Get Product by ID
Retrieve single product by ID.

**Endpoint:** `GET /api/products/id/{productId}`
**Authentication:** Optional

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "title": "Premium Face Cream",
    "slug": "premium-face-cream",
    "sku": "PFC001",
    "type": "single",
    "brand": "CanaGold",
    "shortDescription": "Luxurious anti-aging cream",
    "description": "Complete HTML description...",
    "price": 89.99,
    "compareAtPrice": 119.99,
    "stock": 50,
    "lowStockThreshold": 5,
    "isActive": true,
    "isFeatured": true,
    "images": [...],
    "taxonomies": [...],
    "variants": {
      "options": [
        {
          "name": "Size",
          "values": ["50ml", "100ml", "200ml"]
        },
        {
          "name": "Type",
          "values": ["Normal", "Sensitive"]
        }
      ]
    },
    "seo": {
      "title": "SEO title",
      "description": "SEO description",
      "keywords": ["skincare", "cream"]
    },
    "rating": {
      "average": 4.5,
      "count": 23,
      "distribution": {
        "5": 15,
        "4": 5,
        "3": 2,
        "2": 1,
        "1": 0
      }
    },
    "relatedProducts": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get Product by Slug
Retrieve single product by slug (URL-friendly identifier).

**Endpoint:** `GET /api/products/slug/{slug}`
**Authentication:** Optional

#### Success Response (200)
Same as Get Product by ID

---

### Search Products
Advanced product search with filters.

**Endpoint:** `GET /api/products/search`
**Authentication:** Optional

#### Query Parameters
```
q=face cream              // Search query (required)
page=1                   // Page number
limit=12                 // Items per page
sort=-relevance          // Sort by relevance, price, rating, date
category=category_id     // Filter by category
minPrice=10              // Price filters
maxPrice=100
inStock=true             // Availability filter
brand=CanaGold           // Brand filter
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "products": [...],
    "searchQuery": "face cream",
    "suggestions": ["face cleanser", "face serum"],
    "filters": {
      "appliedFilters": {
        "category": "skincare",
        "priceRange": [10, 100]
      },
      "availableFilters": {
        "categories": [...],
        "brands": [...],
        "priceRanges": [...]
      }
    },
    "pagination": {...}
  }
}
```

---

### Get Products by Category
Get products in specific category.

**Endpoint:** `GET /api/products/category/{categoryId}`
**Authentication:** Optional

#### Query Parameters
Same as Get All Products

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Skincare",
      "slug": "skincare",
      "description": "Premium skincare products"
    },
    "products": [...],
    "pagination": {...}
  }
}
```

---

### Get Similar Products
Get products similar to specified product.

**Endpoint:** `GET /api/products/{productId}/similar`
**Authentication:** Optional

#### Query Parameters
```
limit=4    // Number of similar products (default: 4, max: 20)
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "similarProducts": [...],
    "basedOn": ["category", "price_range", "brand"]
  }
}
```

---

### Validate Coupon for Products
Validate coupon code for specific products.

**Endpoint:** `POST /api/products/validate-coupon`
**Authentication:** None required

#### Request Body
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

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SAVE20",
    "discount": 20.00,
    "discountType": "percent",
    "finalAmount": 80.00,
    "appliesTo": {
      "products": ["product_id"],
      "categories": ["taxonomy_id"]
    }
  }
}
```

## Admin Endpoints

### Get All Products (Admin)
Get all products including inactive ones.

**Endpoint:** `GET /api/admin/products`
**Authentication:** Required (Admin role)

#### Query Parameters
Same as public endpoint plus:
```
status=all               // all, active, inactive
includeDeleted=false     // Include soft-deleted products
```

---

### Create Product
Create a new product.

**Endpoint:** `POST /api/admin/products`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)
```javascript
{
  type: "single",                    // Required: single, bundle, variable
  title: "Premium Face Cream",       // Required: 2-200 characters
  slug: "premium-face-cream",        // Optional: auto-generated if not provided
  sku: "PFC001",                     // Required: unique SKU
  brand: "CanaGold",                 // Required
  shortDescription: "Anti-aging cream", // Required: max 500 characters
  description: "<p>Full HTML description</p>", // Required
  price: 89.99,                      // Required: positive number
  compareAtPrice: 119.99,            // Optional: must be > price
  stock: 50,                         // Required: integer >= 0
  lowStockThreshold: 5,              // Optional: default 10
  isActive: true,                    // Optional: default true
  isFeatured: false,                 // Optional: default false
  images: [File1, File2],            // Optional: image files
  taxonomies: ["cat_id", "tag_id"],  // Optional: array of taxonomy IDs
  variants: JSON.stringify({         // Optional: for variable products
    options: [
      { name: "Size", values: ["50ml", "100ml"] },
      { name: "Type", values: ["Normal", "Sensitive"] }
    ]
  }),
  seo: JSON.stringify({             // Optional: SEO metadata
    title: "SEO Title",
    description: "SEO Description",
    keywords: ["skincare", "cream"]
  })
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "new_product_id",
    "title": "Premium Face Cream",
    "slug": "premium-face-cream",
    // ... full product object
  }
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "sku",
      "message": "SKU already exists"
    }
  ]
}
```

---

### Update Product
Update existing product.

**Endpoint:** `PUT /api/admin/products/{productId}`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body
Same as Create Product (all fields optional)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    // ... updated product object
  }
}
```

---

### Delete Product
Soft delete a product.

**Endpoint:** `DELETE /api/admin/products/{productId}`
**Authentication:** Required (Admin role)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### Bulk Upload Products
Upload multiple products via Excel file.

**Endpoint:** `POST /api/admin/products/bulk-upload`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body
```javascript
{
  file: ExcelFile  // Required: .xlsx or .xls file, max 5MB
}
```

#### Excel File Format
Required columns:
- `title` (string, required)
- `price` (number, required)
- `stock` (integer, required)

Optional columns:
- `sku`, `brand`, `description`, `shortDescription`
- `type`, `compareAtPrice`, `lowStockThreshold`
- `isActive`, `isFeatured`
- `imageUrls` (comma-separated URLs)

#### Success Response (201)
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "data": {
    "total": 10,
    "success": [
      {
        "row": 2,
        "title": "Product 1",
        "productId": "new_id_1"
      }
    ],
    "failed": [
      {
        "row": 3,
        "title": "Product 2",
        "error": "Invalid price"
      }
    ]
  }
}
```

---

### Delete Product Image
Remove specific image from product.

**Endpoint:** `DELETE /api/admin/products/{productId}/images/{imageId}`
**Authentication:** Required (Admin role)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## Frontend Integration Examples

### React Product Listing Component
```javascript
import React, { useState, useEffect } from 'react';
import { apiClient } from './apiClient';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sort: '-createdAt',
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const response = await apiClient.request(`/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="product-list">
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange({ sort: e.target.value })}
        >
          <option value="-createdAt">Newest First</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-rating.average">Highest Rated</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <img 
              src={product.images[0]?.url} 
              alt={product.images[0]?.altText || product.title}
            />
            <h3>{product.title}</h3>
            <p className="price">
              ${product.price}
              {product.compareAtPrice && (
                <span className="compare-price">${product.compareAtPrice}</span>
              )}
            </p>
            <div className="rating">
              Rating: {product.rating.average}/5 ({product.rating.count} reviews)
            </div>
            <button onClick={() => addToCart(product._id)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={pagination.currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Product Search Hook
```javascript
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.data.products);
          setSuggestions(data.data.suggestions || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    suggestions
  };
};
```

## Error Handling
- Always check `success` field in response
- Handle network errors gracefully
- Implement proper loading states
- Show user-friendly error messages
- Retry failed requests when appropriate

## Performance Tips
1. **Pagination**: Use appropriate page sizes (12-24 items)
2. **Image Optimization**: Use responsive images with proper alt text
3. **Caching**: Cache product lists client-side when appropriate
4. **Debouncing**: Debounce search queries to reduce API calls
5. **Virtual Scrolling**: For large product lists, implement virtual scrolling
