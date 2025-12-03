# Taxonomies API

## Overview
Taxonomy system for organizing products with categories, tags, and hierarchical structures.

## Public Endpoints

### Get All Taxonomies
Retrieve all active taxonomies with optional filtering.

**Endpoint:** `GET /api/taxonomies`
**Authentication:** Optional (enhanced features with auth)

#### Query Parameters
```
type=category            // Filter by type: category, tag, brand
parentId=parent_id       // Filter by parent taxonomy
includeChildren=false    // Include child taxonomies in response
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "taxonomies": [
      {
        "_id": "taxonomy_id",
        "name": "Skincare",
        "slug": "skincare",
        "type": "category",
        "description": "Premium skincare products",
        "image": "https://...",
        "parentId": null,
        "children": [
          {
            "_id": "child_id",
            "name": "Face Care",
            "slug": "face-care",
            "type": "category"
          }
        ],
        "productCount": 25,
        "position": 1,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Get Taxonomy Tree
Retrieve taxonomies in hierarchical tree structure.

**Endpoint:** `GET /api/taxonomies/tree`
**Authentication:** Optional

#### Query Parameters
```
type=category    // Filter by taxonomy type
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "_id": "parent_id",
        "name": "Beauty",
        "slug": "beauty",
        "type": "category",
        "children": [
          {
            "_id": "child_id",
            "name": "Skincare",
            "slug": "skincare",
            "type": "category",
            "children": [
              {
                "_id": "grandchild_id",
                "name": "Face Care",
                "slug": "face-care",
                "type": "category",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### Get Taxonomies by Type
Retrieve taxonomies of specific type.

**Endpoint:** `GET /api/taxonomies/type/{type}`
**Authentication:** Optional

#### Path Parameters
- `type`: category, tag, brand, collection

#### Query Parameters
```
includeChildren=false    // Include child taxonomies
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "type": "category",
    "taxonomies": [
      // ... taxonomy objects
    ]
  }
}
```

---

### Get Taxonomy by ID
Retrieve single taxonomy by ID.

**Endpoint:** `GET /api/taxonomies/id/{taxonomyId}`
**Authentication:** Optional

#### Query Parameters
```
includeChildren=false    // Include child taxonomies
includeProducts=false    // Include associated products
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "taxonomy_id",
    "name": "Skincare",
    "slug": "skincare",
    "type": "category",
    "description": "Premium skincare products for all skin types",
    "image": "https://...",
    "parentId": null,
    "children": [
      // ... child taxonomies if includeChildren=true
    ],
    "products": [
      // ... associated products if includeProducts=true
    ],
    "productCount": 25,
    "position": 1,
    "isActive": true,
    "seo": {
      "title": "Premium Skincare Products | CanaGold",
      "description": "Discover our premium skincare collection...",
      "keywords": ["skincare", "beauty", "premium"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get Taxonomy by Slug
Retrieve single taxonomy by slug.

**Endpoint:** `GET /api/taxonomies/slug/{slug}`
**Authentication:** Optional

Same response structure as Get Taxonomy by ID.

## Admin Endpoints

### Create Taxonomy
Create a new taxonomy.

**Endpoint:** `POST /api/admin/taxonomies`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)
```javascript
{
  name: "Skincare",                    // Required: 2-100 characters
  slug: "skincare",                    // Optional: auto-generated if not provided
  type: "category",                    // Required: category, tag, brand, collection
  description: "Premium skincare...",  // Optional: max 1000 characters
  parentId: "parent_id",              // Optional: valid taxonomy ID
  position: 1,                        // Optional: sort position
  isActive: true,                     // Optional: default true
  image: File,                        // Optional: image file
  seo: JSON.stringify({              // Optional: SEO metadata
    title: "SEO Title",
    description: "SEO Description",
    keywords: ["skincare", "beauty"]
  })
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Taxonomy created successfully",
  "data": {
    "_id": "new_taxonomy_id",
    "name": "Skincare",
    "slug": "skincare",
    // ... complete taxonomy object
  }
}
```

---

### Update Taxonomy
Update existing taxonomy.

**Endpoint:** `PUT /api/admin/taxonomies/{taxonomyId}`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body
Same as Create Taxonomy (all fields optional)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Taxonomy updated successfully",
  "data": {
    // ... updated taxonomy object
  }
}
```

---

### Delete Taxonomy
Delete a taxonomy (soft delete if has products).

**Endpoint:** `DELETE /api/admin/taxonomies/{taxonomyId}`
**Authentication:** Required (Admin role)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Taxonomy deleted successfully"
}
```

#### Error Response
```json
// 400 - Has Associated Products
{
  "success": false,
  "message": "Cannot delete taxonomy with associated products",
  "error": {
    "productCount": 15,
    "suggestion": "Move products to another category first"
  }
}
```

## Frontend Integration Examples

### React Taxonomy Hook
```javascript
import { useState, useEffect } from 'react';

export const useTaxonomies = (type = null) => {
  const [taxonomies, setTaxonomies] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTaxonomies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = type ? 
        `/api/taxonomies/type/${type}` : 
        '/api/taxonomies';
        
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setTaxonomies(data.data.taxonomies || data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch taxonomies');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomyTree = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = type ? 
        `/api/taxonomies/tree?type=${type}` : 
        '/api/taxonomies/tree';
        
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setTree(data.data.tree);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch taxonomy tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, [type]);

  return {
    taxonomies,
    tree,
    loading,
    error,
    fetchTaxonomies,
    fetchTaxonomyTree
  };
};
```

### Category Navigation Component
```javascript
import React, { useEffect } from 'react';
import { useTaxonomies } from './useTaxonomies';

const CategoryNavigation = ({ onCategorySelect }) => {
  const { tree, loading, error, fetchTaxonomyTree } = useTaxonomies('category');

  useEffect(() => {
    fetchTaxonomyTree();
  }, []);

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category._id} style={{ paddingLeft: level * 20 }}>
        <div 
          className="category-item"
          onClick={() => onCategorySelect(category)}
        >
          {category.image && (
            <img 
              src={category.image} 
              alt={category.name}
              className="category-image" 
            />
          )}
          <span>{category.name}</span>
          {category.children.length > 0 && (
            <span className="children-count">({category.children.length})</span>
          )}
        </div>
        
        {category.children.length > 0 && (
          <div className="category-children">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <nav className="category-navigation">
      <h3>Categories</h3>
      {renderCategoryTree(tree)}
    </nav>
  );
};
```
