# 🚀 E-Commerce API Setup Guide

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=5000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test API Components

```bash
npm run test-api
```

### 4. Create Admin User

```bash
npm run create-admin
```

This creates an admin user with:
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Test the API

1. Import the Postman collection: `postman/E-Commerce-API.postman_collection.json`
2. Run the "Admin Login" request to get the JWT token
3. Test all the API endpoints

---

## 📁 Project Structure

```
src/
├── config/
│   └── cloudinary.js          # Cloudinary configuration
├── controllers/
│   ├── product.controller.js   # Product CRUD operations
│   └── taxonomy.controller.js  # Taxonomy CRUD operations
├── middlewares/
│   ├── auth.js                 # Authentication & authorization
│   ├── upload.js               # File upload handling
│   ├── validate.js             # Joi validation schemas
│   └── errorHandler.js         # Global error handling
├── models/
│   ├── product.model.js        # Product schema & methods
│   ├── taxonomy.model.js       # Taxonomy schema & methods
│   └── user.model.js           # User schema (with admin role)
├── routes/
│   ├── product.routes.js       # Product API routes
│   └── taxonomy.routes.js      # Taxonomy API routes
├── utils/
│   ├── createAdmin.js          # Admin user creation script
│   └── testAPI.js              # API testing script
├── app.js                      # Express app configuration
└── server.js                   # Server startup
```

---

## 🛒 API Endpoints Overview

### Products API (`/api/products`)

**Public Routes:**
- `GET /` - Get all products (with filtering & pagination)
- `GET /id/:id` - Get product by ID
- `GET /slug/:slug` - Get product by slug
- `GET /category/:categoryId` - Get products by category
- `GET /:id/similar` - Get similar products

### Taxonomies API (`/api/taxonomies`)

**Public Routes:**
- `GET /` - Get all taxonomies
- `GET /tree` - Get taxonomy tree (hierarchical)
- `GET /type/:type` - Get taxonomies by type
- `GET /id/:id` - Get taxonomy by ID
- `GET /slug/:slug` - Get taxonomy by slug

### Admin API (`/api/admin`)

**Product Admin Routes:**
- `POST /products` - Create product (with image upload)
- `PUT /products/:id` - Update product (with image upload)
- `DELETE /products/:id` - Delete product
- `DELETE /products/:id/images/:imageId` - Delete product image

**Taxonomy Admin Routes:**
- `POST /taxonomies` - Create taxonomy (with image upload)
- `PUT /taxonomies/:id` - Update taxonomy (with image upload)
- `DELETE /taxonomies/:id` - Delete taxonomy

**Admin Routes:**
- `POST /` - Create taxonomy (with image upload)
- `PUT /:id` - Update taxonomy (with image upload)
- `DELETE /:id` - Delete taxonomy

---

## 🔧 Key Features

### ✅ Industrial Standards
- **Clean Architecture**: Separation of concerns with controllers, models, routes
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Joi schema validation for all inputs
- **Security**: JWT authentication, role-based access control, helmet security
- **File Upload**: Secure image upload with Cloudinary integration
- **Database**: Proper indexing and relationships

### ✅ Product Management
- Multiple product types (single, gift-set)
- Image gallery with Cloudinary optimization
- SEO-friendly slugs and meta data
- Stock management
- Rating and review system ready
- Related products and components
- Advanced filtering and search

### ✅ Taxonomy System
- Hierarchical categories (parent-child relationships)
- Multiple taxonomy types (collection, category, concern, gift-type)
- Tree structure support
- Image support for categories
- SEO optimization

### ✅ Performance Optimizations
- Database indexing for fast queries
- Lean queries for better performance
- Pagination for large datasets
- Image optimization via Cloudinary
- Proper error handling to prevent crashes

---

## 🧪 Testing

### Manual Testing with Postman

1. **Import Collection**: Import `postman/E-Commerce-API.postman_collection.json`

2. **Set Variables**:
   - `baseUrl`: `http://localhost:5000/api`
   - `adminToken`: (will be set automatically after login)

3. **Test Workflow**:
   ```
   1. Admin Login → Sets token automatically
   2. Create Taxonomies → Create categories first
   3. Create Products → Associate with taxonomies
   4. Test all CRUD operations
   5. Test public endpoints
   ```

### Automated Testing

```bash
# Test API components
npm run test-api

# This will:
# - Connect to MongoDB
# - Test model creation
# - Test relationships
# - Test methods
# - Clean up test data
```

---

## 🔒 Security Considerations

### Authentication
- JWT-based stateless authentication
- Role-based access control (user/admin)
- Token expiration handling
- Secure password hashing with bcrypt

### File Upload Security
- File type validation (images only)
- File size limits (5MB per file)
- Secure cloud storage with Cloudinary
- Automatic image optimization

### Input Validation
- Joi schema validation for all inputs
- XSS protection via helmet
- SQL injection prevention via Mongoose
- Proper error messages without sensitive data

---

## 📊 Database Schema

### Products Collection
```javascript
{
  type: 'single' | 'gift-set',
  title: String,
  slug: String (unique),
  sku: String (unique),
  price: Number,
  stock: Number,
  images: [{ url, publicId, alt, position }],
  taxonomies: [ObjectId], // References to Taxonomy
  // ... more fields
}
```

### Taxonomies Collection
```javascript
{
  name: String,
  slug: String (unique),
  type: 'collection' | 'category' | 'concern' | 'gift-type',
  parentId: ObjectId, // Self-reference for hierarchy
  position: Number,
  image: { url, publicId, alt },
  // ... more fields
}
```

---

## 🚀 Deployment Checklist

### Environment Variables
- [ ] Set production MongoDB URI
- [ ] Set strong JWT secret
- [ ] Configure Cloudinary credentials
- [ ] Set NODE_ENV=production

### Security
- [ ] Enable CORS for production domains
- [ ] Set up rate limiting
- [ ] Configure proper logging
- [ ] Set up monitoring

### Database
- [ ] Create database indexes
- [ ] Set up backup strategy
- [ ] Configure connection pooling

---

## 🆘 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongosh

# Or check connection string in .env
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

**2. Cloudinary Upload Fails**
```bash
# Verify credentials in .env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**3. JWT Token Issues**
```bash
# Set a strong JWT secret
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
```

**4. Admin Access Denied**
```bash
# Create admin user
npm run create-admin

# Or check user role in database
db.users.findOne({email: "admin@example.com"})
```

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

---

## 📚 Additional Resources

- [API Documentation](./API-Documentation.md)
- [Models Documentation](./Models.md)
- [Postman Collection](../postman/E-Commerce-API.postman_collection.json)

---

## 🎉 You're Ready!

Your e-commerce API is now set up with:
- ✅ Complete CRUD operations for products and taxonomies
- ✅ Image upload with Cloudinary
- ✅ Proper validation and error handling
- ✅ Admin authentication
- ✅ Comprehensive documentation
- ✅ Postman collection for testing

Start building your e-commerce frontend! 🛍️