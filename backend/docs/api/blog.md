# Blog API

## Overview
Content management system for blog posts with publishing workflows, SEO optimization, and rich media support.

## Public Endpoints

### Get All Blog Posts
Retrieve published blog posts with pagination and filtering.

**Endpoint:** `GET /api/blog`
**Authentication:** None required

#### Query Parameters
- `page`: Page number for pagination
- `limit`: Posts per page (default: 10, max: 50)
- `sort`: Sort order (-publishedAt, -createdAt, title)
- `published`: Filter for published posts only
- `category`: Filter by blog category
- `tags`: Filter by tags (comma-separated)
- `author`: Filter by author name
- `search`: Search in title, excerpt, and body

#### Response Structure
Returns paginated blog posts with:
- Post identification and metadata
- Title, slug, and excerpt
- Cover image and media
- Author information
- Category and tags
- Published date and reading time
- Engagement metrics (views, shares)

#### Blog Post Preview
Includes excerpt and reading time estimation for list views.

---

### Get Blog Post by Slug
Retrieve single published blog post by URL slug.

**Endpoint:** `GET /api/blog/slug/{slug}`
**Authentication:** None required

#### Full Post Content
Returns complete blog post including:
- Full HTML body content
- Rich media embeds
- Author bio and profile
- Related posts recommendations
- Social sharing metadata
- SEO meta tags
- Comment count and previews

#### View Tracking
Automatically increments view count for analytics.

---

### Search Blog Posts
Advanced search with full-text and filter capabilities.

**Endpoint:** `GET /api/blog/search`
**Authentication:** None required

#### Search Features
- Full-text search in title and content
- Tag-based filtering
- Category filtering
- Author filtering
- Date range queries
- Relevance scoring

#### Search Response
Includes:
- Matching blog posts
- Search query echo
- Applied filters
- Search suggestions
- Result count and pagination
- Related search terms

## Admin Endpoints

### Get All Blog Posts (Admin)
Administrative view of all blog posts including drafts.

**Endpoint:** `GET /api/admin/blog`
**Authentication:** Required (Admin role)

#### Admin Query Parameters
All public parameters plus:
- `status`: Filter by status (draft, published, scheduled, archived)
- `includeUnpublished`: Include draft posts
- `authorId`: Filter by author user ID

#### Enhanced Admin Response
Includes additional data:
- Draft and scheduled status
- Last modified information
- Editorial notes
- SEO score and recommendations
- Performance analytics
- Revision history

---

### Create Blog Post
Create new blog post with draft or published status.

**Endpoint:** `POST /api/admin/blog`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)
```javascript
{
  title: "Ultimate Skincare Guide",
  slug: "ultimate-skincare-guide",
  excerpt: "Comprehensive guide to skincare routines",
  body: "<h2>Introduction</h2><p>Content...</p>",
  coverImage: File,
  category: "Skincare Tips",
  tags: "skincare,beauty,tips",
  author: "Dr. Sarah Johnson",
  isPublished: true,
  publishedAt: "2024-01-01T00:00:00.000Z",
  meta: JSON.stringify({
    title: "SEO Title",
    description: "SEO Description",
    keywords: ["skincare", "beauty"]
  })
}
```

#### Field Requirements
- **title**: Required (10-200 characters)
- **slug**: Optional (auto-generated from title)
- **excerpt**: Required (50-500 characters)
- **body**: Required HTML content
- **category**: Optional classification
- **tags**: Optional comma-separated list
- **author**: Author name or ID
- **isPublished**: Publication status
- **publishedAt**: Schedule publication date

#### SEO Optimization
- Meta title and description
- Keywords and tags
- Open Graph metadata
- Twitter card information
- Canonical URL configuration

---

### Update Blog Post
Modify existing blog post content and metadata.

**Endpoint:** `PUT /api/admin/blog/{postId}`
**Authentication:** Required (Admin role)
**Content-Type:** `multipart/form-data`

#### Updateable Fields
All creation fields plus:
- Revision notes
- Featured status
- Sticky post flag
- Comment settings
- Social sharing settings

#### Version Control
- Maintains revision history
- Author attribution tracking
- Timestamp all changes
- Rollback capabilities

---

### Publish/Unpublish Blog Post
Toggle blog post publication status.

**Endpoint:** `PATCH /api/admin/blog/{postId}/publish`
**Authentication:** Required (Admin role)

#### Publication Options
- **Publish Now**: Make immediately visible
- **Schedule**: Set future publication date
- **Unpublish**: Revert to draft status
- **Archive**: Remove from active posts

#### Publication Workflow
- Validates required fields
- Updates published date
- Triggers notifications
- Updates search index
- Clears related caches

---

### Delete Blog Post
Remove blog post from system.

**Endpoint:** `DELETE /api/admin/blog/{postId}`
**Authentication:** Required (Admin role)

#### Deletion Policy
- Soft delete preserves data
- Maintains URL redirects
- Updates related content
- Notifies linked references

---

### Get Blog Analytics
Retrieve blog performance metrics and statistics.

**Endpoint:** `GET /api/admin/blog/analytics`
**Authentication:** Required (Admin role)

#### Analytics Metrics
- Total posts and categories
- Published vs draft count
- View count trends
- Popular posts ranking
- Author contribution stats
- Category distribution
- Tag usage frequency

#### Performance Data
- Average reading time
- Engagement rates
- Social sharing metrics
- Traffic sources
- Reader demographics
- Conversion tracking

## Blog Management Features

### Content Organization

**Categories**: Hierarchical post classification
**Tags**: Flexible keyword association
**Series**: Multi-part article linking
**Featured Posts**: Homepage highlights

### Publishing Workflow

**Draft Stage**: Work-in-progress content
**Review Stage**: Editorial review queue
**Scheduled**: Future publication dates
**Published**: Live and accessible
**Archived**: Historical content

### Rich Content Support

**Text Editor**: WYSIWYG HTML editing
**Media Library**: Image and video management
**Code Blocks**: Syntax-highlighted snippets
**Embeds**: Third-party content integration
**Galleries**: Multi-image showcases

## SEO and Discoverability

### Search Engine Optimization
- Automatic sitemap generation
- XML feed creation
- Schema.org markup
- Social meta tags
- Canonical URL management

### Content Marketing
- Newsletter integration
- Social media scheduling
- RSS feed publication
- Related content suggestions
- Call-to-action placement

### Analytics Integration
- Google Analytics tracking
- Custom event tracking
- Conversion goal monitoring
- A/B testing support
- Heat mapping integration

## Reader Engagement

### Comment System
- Nested comment threads
- Comment moderation
- Spam filtering
- User notifications
- Social login integration

### Social Features
- Share buttons and counts
- Author profiles and bios
- Reader recommendations
- Email subscriptions
- Push notifications

### Personalization
- Related posts algorithm
- Reading history tracking
- Content recommendations
- Saved posts and bookmarks
- Reading progress indicators

## Content Security

### Access Control
- Role-based permissions
- Author-level restrictions
- Editor approval workflows
- Guest author management

### Content Protection
- Plagiarism detection
- Copyright management
- Content licensing
- DMCA compliance

## Performance Optimization

### Caching Strategy
- Post content caching
- Image optimization and CDN
- Database query optimization
- Static page generation

### Media Management
- Responsive image sizing
- Lazy loading implementation
- Video compression
- CDN integration
