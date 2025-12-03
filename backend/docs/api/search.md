# Search API

## Overview
Advanced search functionality across products, orders, and blog content with filters, suggestions, and analytics.

## Product Search

### User Product Search
Search products with advanced filtering and sorting.

**Endpoint:** `GET /api/products/search`
**Authentication:** Optional (enhanced features with auth)

#### Query Parameters
```
q=wireless headphones    // Required: search query (min 2 characters)
page=1                   // Page number (default: 1)
limit=12                 // Items per page (default: 12, max: 50)
sort=-createdAt          // Sort: relevance, price, -price, rating, -rating, createdAt, -createdAt
category=category_id     // Filter by category
minPrice=50              // Minimum price filter
maxPrice=200             // Maximum price filter
inStock=true             // Show only in-stock products
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
        "title": "Wireless Bluetooth Headphones",
        "slug": "wireless-bluetooth-headphones",
        "price": 89.99,
        "compareAtPrice": 119.99,
        "images": [...],
        "rating": {
          "average": 4.5,
          "count": 23
        },
        "stock": 15,
        "brand": "TechBrand",
        "relevanceScore": 0.95
      }
    ],
    "searchQuery": "wireless headphones",
    "suggestions": [
      "wireless earbuds",
      "bluetooth speakers",
      "noise cancelling headphones"
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalProducts": 34,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "appliedFilters": {
        "query": "wireless headphones",
        "inStock": true,
        "sort": "-createdAt"
      },
      "availableFilters": {
        "categories": [
          {
            "_id": "cat_id",
            "name": "Electronics",
            "productCount": 25
          }
        ],
        "brands": [
          {
            "name": "TechBrand",
            "productCount": 15
          }
        ],
        "priceRanges": [
          {
            "label": "$0 - $50",
            "min": 0,
            "max": 50,
            "productCount": 8
          },
          {
            "label": "$50 - $100",
            "min": 50,
            "max": 100,
            "productCount": 18
          }
        ]
      }
    },
    "searchMeta": {
      "totalTime": 45,
      "searchId": "search_session_id"
    }
  }
}
```

#### Error Responses
```json
// 400 - Invalid Query
{
  "success": false,
  "message": "Search query must be at least 2 characters"
}

// 400 - Invalid Filters
{
  "success": false,
  "message": "Invalid price range: minPrice cannot be greater than maxPrice"
}
```

---

### Admin Product Search
Enhanced search for admin users with additional filters.

**Endpoint:** `GET /api/admin/products/search`
**Authentication:** Required (Admin role)

#### Query Parameters
All public search parameters plus:
```
status=active            // Filter by status: active, inactive, all
type=single              // Filter by product type
includeDeleted=false     // Include soft-deleted products
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "products": [
      {
        // ... product object with admin fields
        "isActive": false,
        "createdBy": "admin_id",
        "lastModifiedBy": "admin_id",
        "internalNotes": "Admin notes..."
      }
    ],
    "searchQuery": "premium skincare",
    "pagination": {...},
    "filters": {
      "appliedFilters": {
        "status": "active"
      },
      "adminFilters": {
        "statuses": [
          { "value": "active", "count": 45 },
          { "value": "inactive", "count": 12 }
        ],
        "types": [
          { "value": "single", "count": 40 },
          { "value": "variable", "count": 17 }
        ]
      }
    }
  }
}
```

## Order Search (Admin)

### Search Orders
Search orders by customer, order details, or products.

**Endpoint:** `GET /api/orders/admin/orders/search`
**Authentication:** Required (Admin role)

#### Query Parameters
```
q=john.doe@example.com   // Required: email, name, order number, tracking number
page=1                   // Page number
limit=20                 // Items per page (max: 100)
status=pending           // Filter by order status
startDate=2024-01-01     // Filter orders from date (YYYY-MM-DD)
endDate=2024-12-31       // Filter orders until date (YYYY-MM-DD)
sort=-createdAt          // Sort orders
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-2024-001",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "status": "pending",
        "total": 159.98,
        "items": [
          {
            "product": {
              "_id": "product_id",
              "title": "Premium Face Cream"
            },
            "quantity": 2,
            "price": 79.99
          }
        ],
        "shippingAddress": {...},
        "trackingNumber": "TRK123456789",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "relevanceScore": 0.88
      }
    ],
    "searchQuery": "john.doe@example.com",
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalOrders": 25
    },
    "filters": {
      "appliedFilters": {
        "query": "john.doe@example.com"
      },
      "availableFilters": {
        "statuses": [
          { "value": "pending", "count": 8 },
          { "value": "processing", "count": 12 },
          { "value": "shipped", "count": 5 }
        ],
        "dateRanges": [
          { "label": "Last 7 days", "count": 15 },
          { "label": "Last 30 days", "count": 48 },
          { "label": "Last 90 days", "count": 156 }
        ]
      }
    },
    "searchMeta": {
      "totalTime": 23,
      "searchType": "order"
    }
  }
}
```

## Blog Search

### Search Blog Posts
Search published blog posts.

**Endpoint:** `GET /api/blog/search`
**Authentication:** None required

#### Query Parameters
```
q=skincare routine       // Required: search in title, excerpt, body, tags
page=1                   // Page number
limit=10                 // Items per page (max: 50)
published=true           // Filter published posts only
category=skincare        // Filter by category
tags=routine,tips        // Filter by tags (comma-separated)
author=Dr. Sarah         // Filter by author
sort=-publishedAt        // Sort posts
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "blogPosts": [
      {
        "_id": "blog_id",
        "title": "Ultimate Skincare Routine Guide",
        "slug": "ultimate-skincare-routine-guide",
        "excerpt": "Discover the perfect skincare routine...",
        "coverImage": "https://...",
        "author": "Dr. Sarah Johnson",
        "category": "Skincare Tips",
        "tags": ["skincare", "routine", "tips"],
        "publishedAt": "2024-01-01T00:00:00.000Z",
        "readingTime": 5,
        "relevanceScore": 0.92
      }
    ],
    "searchQuery": "skincare routine",
    "suggestions": [
      "skincare tips",
      "daily routine",
      "beauty routine"
    ],
    "filters": {
      "appliedFilters": {
        "published": true
      },
      "availableFilters": {
        "categories": [
          { "name": "Skincare Tips", "count": 15 },
          { "name": "Beauty Trends", "count": 8 }
        ],
        "authors": [
          { "name": "Dr. Sarah Johnson", "count": 12 },
          { "name": "Beauty Expert", "count": 7 }
        ],
        "tags": [
          { "name": "skincare", "count": 20 },
          { "name": "routine", "count": 15 }
        ]
      }
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPosts": 28
    }
  }
}
```

## Frontend Integration Examples

### Universal Search Hook
```javascript
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

export const useSearch = (searchType = 'products') => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({});

  const searchEndpoints = {
    products: '/api/products/search',
    orders: '/api/orders/admin/orders/search',
    blog: '/api/blog/search'
  };

  const performSearch = useMemo(
    () => debounce(async (searchQuery, searchFilters = {}) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          ...searchFilters
        });

        const response = await fetch(`${searchEndpoints[searchType]}?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const data = await response.json();

        if (data.success) {
          const resultKey = searchType === 'products' ? 'products' : 
                          searchType === 'orders' ? 'orders' : 'blogPosts';
          
          setResults(data.data[resultKey] || []);
          setSuggestions(data.data.suggestions || []);
          setFilters(data.data.filters || {});
          setPagination(data.data.pagination || {});
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(`Search failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 300),
    [searchType]
  );

  const search = (newQuery, newFilters = {}) => {
    setQuery(newQuery);
    performSearch(newQuery, newFilters);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setFilters({});
    setPagination({});
    setError(null);
  };

  useEffect(() => {
    return () => {
      performSearch.cancel();
    };
  }, [performSearch]);

  return {
    query,
    results,
    loading,
    error,
    suggestions,
    filters,
    pagination,
    search,
    clearSearch,
    setQuery
  };
};
```

### Search Component
```javascript
import React, { useState } from 'react';
import { useSearch } from './useSearch';

const SearchComponent = ({ searchType = 'products', onResultSelect }) => {
  const [activeFilters, setActiveFilters] = useState({});
  const {
    query,
    results,
    loading,
    error,
    suggestions,
    filters,
    pagination,
    search,
    clearSearch
  } = useSearch(searchType);

  const handleSearch = (searchQuery) => {
    search(searchQuery, activeFilters);
  };

  const handleFilterChange = (filterKey, filterValue) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: filterValue
    };
    setActiveFilters(newFilters);
    if (query) {
      search(query, newFilters);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    search(suggestion, activeFilters);
  };

  return (
    <div className="search-component">
      <div className="search-input-container">
        <input
          type="text"
          placeholder={`Search ${searchType}...`}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        
        {query && (
          <button onClick={clearSearch} className="clear-search">
            ×
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && query && (
        <div className="search-suggestions">
          <h4>Suggestions:</h4>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters.availableFilters && (
        <div className="search-filters">
          {/* Category Filter */}
          {filters.availableFilters.categories && (
            <select
              onChange={(e) => handleFilterChange('category', e.target.value)}
              value={activeFilters.category || ''}
            >
              <option value="">All Categories</option>
              {filters.availableFilters.categories.map(cat => (
                <option key={cat._id || cat.name} value={cat._id || cat.name}>
                  {cat.name} ({cat.productCount || cat.count})
                </option>
              ))}
            </select>
          )}

          {/* Price Range Filter */}
          {filters.availableFilters.priceRanges && (
            <div className="price-filters">
              <input
                type="number"
                placeholder="Min Price"
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                value={activeFilters.minPrice || ''}
              />
              <input
                type="number"
                placeholder="Max Price"
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                value={activeFilters.maxPrice || ''}
              />
            </div>
          )}

          {/* Sort Options */}
          <select
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            value={activeFilters.sort || ''}
          >
            <option value="">Sort by...</option>
            <option value="relevance">Relevance</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-rating">Highest Rated</option>
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="search-loading">Searching...</div>}

      {/* Error State */}
      {error && <div className="search-error">Error: {error}</div>}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="search-results">
          <h3>Results for "{query}" ({pagination.totalProducts || pagination.totalOrders || pagination.totalPosts} found)</h3>
          
          <div className="results-list">
            {results.map(result => (
              <div 
                key={result._id} 
                className="result-item"
                onClick={() => onResultSelect && onResultSelect(result)}
              >
                {searchType === 'products' && (
                  <>
                    <img src={result.images?.[0]?.url} alt={result.title} />
                    <div>
                      <h4>{result.title}</h4>
                      <p>${result.price}</p>
                      <span>★ {result.rating?.average || 0}</span>
                    </div>
                  </>
                )}
                
                {searchType === 'orders' && (
                  <div>
                    <h4>Order #{result.orderNumber}</h4>
                    <p>Customer: {result.user?.name} ({result.user?.email})</p>
                    <p>Status: {result.status} | Total: ${result.total}</p>
                  </div>
                )}
                
                {searchType === 'blog' && (
                  <div>
                    <h4>{result.title}</h4>
                    <p>{result.excerpt}</p>
                    <span>By {result.author} | {result.readingTime} min read</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="search-pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handleFilterChange('page', i + 1)}
                  className={pagination.currentPage === i + 1 ? 'active' : ''}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {query && !loading && results.length === 0 && !error && (
        <div className="no-results">
          No {searchType} found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
```

## Search Features
- **Full-text search** with relevance scoring
- **Auto-suggestions** based on popular searches
- **Advanced filtering** with multiple criteria
- **Real-time search** with debouncing
- **Search analytics** and performance metrics
- **Typo tolerance** and fuzzy matching
- **Search highlighting** in results
