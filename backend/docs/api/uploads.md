# File Upload API

## Overview
Secure file and media upload system with image optimization, validation, and cloud storage integration.

## Image Upload Endpoints

### Upload Product Images
Upload images for products with automatic optimization.

**Endpoint:** `POST /api/uploads/product-images`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Requirements
```javascript
{
  images: [File1, File2, File3],
  altText: ["Description 1", "Description 2", "Description 3"],
  productId: "product_id" // Optional for bulk upload
}
```

#### File Specifications
- **Formats**: JPG, PNG, WebP, GIF
- **Max Size**: 5MB per file
- **Dimensions**: Min 800x800px, Max 4000x4000px
- **Aspect Ratio**: Recommended 1:1 or 4:3

#### Processing Pipeline
- Image validation and format checking
- Automatic resizing and optimization
- WebP conversion for modern browsers
- Thumbnail generation (multiple sizes)
- CDN upload and URL generation
- Metadata extraction and storage

#### Response Structure
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://cdn.example.com/original.jpg",
        "thumbnails": {
          "small": "https://cdn.example.com/thumb-sm.jpg",
          "medium": "https://cdn.example.com/thumb-md.jpg",
          "large": "https://cdn.example.com/thumb-lg.jpg"
        },
        "altText": "Product description",
        "width": 1200,
        "height": 1200,
        "size": 245678
      }
    ]
  }
}
```

---

### Upload Profile Images
Upload and update user profile pictures.

**Endpoint:** `POST /api/uploads/profile-image`
**Authentication:** Required (User token)
**Content-Type:** `multipart/form-data`

#### Upload Specifications
- Single image upload only
- Automatic square cropping
- Face detection and centering
- Multiple size generation
- Old image cleanup

---

### Upload Blog Cover Images
Upload cover images for blog posts.

**Endpoint:** `POST /api/uploads/blog-images`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Blog Image Requirements
- High-quality cover images
- Recommended 1200x630px (Open Graph)
- Automatic social media optimization
- Alt text for accessibility

## File Management

### Delete Uploaded File
Remove file from storage and CDN.

**Endpoint:** `DELETE /api/uploads/{fileId}`
**Authentication:** Required (Admin role)

#### Deletion Process
- Validates file ownership
- Removes from CDN/storage
- Cleans up thumbnails
- Updates database references
- Maintains deletion audit log

---

### Get File Metadata
Retrieve information about uploaded file.

**Endpoint:** `GET /api/uploads/{fileId}`
**Authentication:** Required

#### Metadata Response
- File URL and CDN links
- Upload date and uploader
- File size and dimensions
- Usage references
- Access permissions

## Advanced Upload Features

### Image Optimization

**Automatic Compression**: Reduces file size without quality loss
**Format Conversion**: WebP for modern browsers, JPEG fallback
**Responsive Images**: Generate multiple sizes for different devices
**Lazy Loading Support**: Placeholder generation for better UX

### Security Measures

**File Type Validation**: Strict MIME type checking
**Size Limits**: Prevent oversized uploads
**Malware Scanning**: Virus detection integration
**Access Control**: Permission-based file access

### Cloud Storage Integration

**CDN Distribution**: Global content delivery
**Backup Strategy**: Redundant storage copies
**Bandwidth Optimization**: Smart caching policies
**Cost Management**: Storage lifecycle policies

## Upload Best Practices

### Client-Side Preparation
- Image preview before upload
- Client-side compression
- Format validation
- Progress indication

### Error Handling
- Retry logic for failed uploads
- Partial upload recovery
- User-friendly error messages
- Fallback mechanisms

### Performance Optimization
- Chunk uploads for large files
- Parallel upload processing
- Background queue handling
- Upload progress tracking
