# Blog API Documentation

## Overview
The Blog API provides endpoints for managing blog posts with public access for reading and admin-only access for content management.

## Features
- ✅ Auto-generated slugs from titles
- ✅ Cover image upload to Cloudinary
- ✅ Admin authentication required for management
- ✅ Pagination and filtering
- ✅ SEO meta fields
- ✅ Tags and categories
- ✅ Publish/unpublish functionality

## Endpoints

### Public Endpoints (No Authentication Required)

#### Get All Blog Posts
```
GET /api/blog
```
**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sort` (string): Sort order (default: -publishedAt)
- `published` (boolean): Filter published posts (default: true)
- `category` (string): Filter by category
- `tags` (string): Comma-separated tags
- `author` (string): Filter by author
- `search` (string): Search in title, excerpt, body, tags

#### Get Blog Post by Slug
```
GET /api/blog/slug/:slug
```

#### Get Blog Posts by Category
```
GET /api/blog/category/:category
```

#### Get Blog Posts by Tags
```
GET /api/blog/tags?tags=tag1,tag2
```

### Admin Endpoints (Require Admin Authentication)

#### Create Blog Post
```
POST /api/admin/blog
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```
**Form Fields:**
- `title` (required): Blog post title
- `slug` (optional): URL slug (auto-generated if not provided)
- `excerpt` (optional): Short description
- `body` (required): HTML content
- `tags` (optional): Comma-separated tags
- `category` (optional): Category name
- `author` (required): Author name
- `isPublished` (optional): Publish status (default: false)
- `coverImage` (file, optional): Cover image file
- `meta[title]` (optional): SEO meta title
- `meta[description]` (optional): SEO meta description
- `meta[keywords]` (optional): SEO keywords

#### Get Blog Post by ID (Admin)
```
GET /api/admin/blog/:id
Authorization: Bearer {admin_token}
```

#### Update Blog Post
```
PUT /api/admin/blog/:id
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

#### Publish/Unpublish Blog Post
```
PATCH /api/admin/blog/:id/publish
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isPublished": true
}
```

#### Delete Blog Post
```
DELETE /api/admin/blog/:id
Authorization: Bearer {admin_token}
```

## Authentication

### Admin Login
Use the regular login endpoint with admin credentials:
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@canagold.com",
  "password": "admin123"
}
```

### Create Admin User
Run the following command to create an admin user:
```bash
npm run create-admin
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Blog Post Model

```json
{
  "_id": "ObjectId",
  "title": "Blog Post Title",
  "slug": "blog-post-title",
  "excerpt": "Short description...",
  "body": "<p>HTML content...</p>",
  "coverImage": {
    "url": "https://cloudinary.com/image.jpg",
    "publicId": "blog/covers/image_id",
    "alt": "Alt text"
  },
  "tags": ["skincare", "beauty"],
  "category": "Skincare Tips",
  "author": "Dr. Sarah Johnson",
  "isPublished": true,
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "viewCount": 150,
  "readingTime": 5,
  "meta": {
    "title": "SEO Title",
    "description": "SEO Description",
    "keywords": ["keyword1", "keyword2"],
    "canonicalUrl": "https://example.com/blog/post"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing with Postman

1. Import the `postman/CanaGold.postman_collection.json` collection
2. Create an admin user: `npm run create-admin`
3. Login with admin credentials using the "Login User" request
4. Use the "Blog Posts (Public & Admin)" folder to test all endpoints
5. The collection includes automatic token management and variable storage

## Environment Variables

Make sure these are set in your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Notes

- Slugs are automatically generated from titles if not provided
- Cover images are uploaded to Cloudinary in the `blog/covers` folder
- Only users with `admin` role can create, update, or delete blog posts
- Public endpoints show only published posts by default
- Admin endpoints can access all posts regardless of publish status
- View count is automatically incremented when accessing posts by slug