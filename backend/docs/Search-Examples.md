# Search API Usage Examples

## User Product Search Examples

### Basic Product Search

```bash
# Search for "wireless headphones"
curl "http://localhost:3000/api/products/search?q=wireless%20headphones"

# Search with pagination
curl "http://localhost:3000/api/products/search?q=laptop&page=2&limit=8"

# Search with price filter
curl "http://localhost:3000/api/products/search?q=phone&minPrice=100&maxPrice=500"

# Search for in-stock items only
curl "http://localhost:3000/api/products/search?q=camera&inStock=true"

# Search within a specific category
curl "http://localhost:3000/api/products/search?q=gaming&category=CATEGORY_ID"
```

### JavaScript Frontend Example

```javascript
// Search products function
async function searchProducts(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    ...filters,
  });

  try {
    const response = await fetch(`/api/products/search?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

// Usage
searchProducts("wireless mouse", {
  page: 1,
  limit: 12,
  inStock: true,
  maxPrice: 100,
})
  .then((result) => {
    console.log("Products:", result.products);
    console.log("Pagination:", result.pagination);
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

## Admin Product Search Examples

### Basic Admin Product Search

```bash
# Search all products (requires admin auth)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/products/search?q=laptop"

# Search only active products
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/products/search?q=phone&status=active"

# Search inactive products
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/products/search?q=tablet&status=inactive"

# Search all products (active and inactive)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/products/search?q=camera&status=all"
```

### Admin Dashboard JavaScript Example

```javascript
// Admin product search function
async function adminSearchProducts(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    ...filters,
  });

  try {
    const response = await fetch(`/api/admin/products/search?${params}`, {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Admin search error:", error);
    throw error;
  }
}

// Usage in admin dashboard
adminSearchProducts("wireless", {
  status: "active",
  page: 1,
  limit: 20,
})
  .then((result) => {
    displayProductsInTable(result.products);
    updatePagination(result.pagination);
  })
  .catch((error) => {
    showErrorMessage("Search failed: " + error.message);
  });
```

## Admin Order Search Examples

### Basic Admin Order Search

```bash
# Search orders by customer email
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/orders/admin/orders/search?q=john@example.com"

# Search orders by order number
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/orders/admin/orders/search?q=ORD-2024-001"

# Search orders with status filter
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/orders/admin/orders/search?q=smith&status=pending"

# Search orders within date range
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/orders/admin/orders/search?q=payment&startDate=2024-01-01&endDate=2024-12-31"
```

### Admin Order Search JavaScript Example

```javascript
// Admin order search function
async function adminSearchOrders(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    ...filters,
  });

  try {
    const response = await fetch(`/api/orders/admin/orders/search?${params}`, {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Admin order search error:", error);
    throw error;
  }
}

// Usage in admin dashboard
adminSearchOrders("john@example.com", {
  status: "pending",
  page: 1,
  limit: 20,
})
  .then((result) => {
    displayOrdersInTable(result.orders);
    updatePagination(result.pagination);
  })
  .catch((error) => {
    showErrorMessage("Search failed: " + error.message);
  });
```

## React Component Examples

### User Product Search Component

```jsx
import React, { useState, useEffect } from "react";

const ProductSearch = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const handleSearch = async (searchQuery, page = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQuery)}&page=${page}`
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
        placeholder="Search products..."
      />
      <button onClick={() => handleSearch(query)}>Search</button>

      {loading && <div>Searching...</div>}

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <h3>{product.title}</h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => handleSearch(query, pagination.currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => handleSearch(query, pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
```

### Admin Dashboard Search Component

```jsx
import React, { useState } from "react";

const AdminSearch = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/products/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const data = await response.json();
      setResults(data.success ? data.data.products : []);
    } catch (error) {
      console.error("Product search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders/admin/orders/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const data = await response.json();
      setResults(data.success ? data.data.orders : []);
    } catch (error) {
      console.error("Order search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === "products") {
      searchProducts();
    } else {
      searchOrders();
    }
  };

  return (
    <div>
      <div className="tabs">
        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="results">
        {results.map((item) => (
          <div key={item._id} className="result-item">
            {activeTab === "products" ? (
              <div>
                <h4>{item.title}</h4>
                <p>
                  SKU: {item.sku} | Price: ${item.price}
                </p>
              </div>
            ) : (
              <div>
                <h4>Order #{item.orderNumber}</h4>
                <p>
                  Customer: {item.user?.name} ({item.user?.email})
                </p>
                <p>
                  Status: {item.status} | Total: ${item.total}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSearch;
```

## Performance Tips

1. **Debounce search input** to avoid too many API calls
2. **Use pagination** for large result sets
3. **Cache results** when appropriate
4. **Add loading states** for better UX
5. **Implement search suggestions** for popular queries
6. **Use filters** to narrow down results
