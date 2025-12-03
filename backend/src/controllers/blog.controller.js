const BlogPost = require('../models/blog.model');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const mongoose = require('mongoose');

// Utility function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Utility function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingPost = await BlogPost.findOne(query);
    if (!existingPost) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

class BlogController {
  // Get all blog posts with filtering, sorting, and pagination
  async getAllBlogPosts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-publishedAt',
        category,
        tags,
        author,
        published,
        search
      } = req.query;

      const skip = (page - 1) * limit;
      const filter = {};

      // Apply filters
      if (category) {
        filter.category = new RegExp(category, 'i');
      }
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        filter.tags = { $in: tagArray };
      }
      if (author) {
        filter.author = new RegExp(author, 'i');
      }
      if (published !== undefined) {
        filter.isPublished = published === 'true';
      }
      if (search) {
        filter.$text = { $search: search };
      }

      const blogPosts = await BlogPost.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add comment count to each blog post
      const Comment = require('../models/comment.model');
      const blogPostsWithComments = await Promise.all(
        blogPosts.map(async (post) => {
          const commentCount = await Comment.countDocuments({ 
            blog: post._id,
            status: 'approved'
          });
          return { ...post, commentCount };
        })
      );

      const total = await BlogPost.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          blogPosts: blogPostsWithComments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPosts: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get all blog posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog posts',
        error: error.message
      });
    }
  }

  // Get blog post by slug
  async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;

      const blogPost = await BlogPost.findOne({ slug }).lean();

      if (!blogPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Increment view count (fire and forget)
      BlogPost.findByIdAndUpdate(blogPost._id, { $inc: { viewCount: 1 } }).exec();

      res.status(200).json({
        success: true,
        data: blogPost
      });
    } catch (error) {
      console.error('Get blog by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post',
        error: error.message
      });
    }
  }

  // Get blog post by ID
  async getBlogById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blog post ID'
        });
      }

      const blogPost = await BlogPost.findById(id).lean();

      if (!blogPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      res.status(200).json({
        success: true,
        data: blogPost
      });
    } catch (error) {
      console.error('Get blog by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post',
        error: error.message
      });
    }
  }

  // Create blog post (Admin only)
  async createBlogPost(req, res) {
    try {
      console.log('=== CREATE BLOG POST DEBUG ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file ? 'File present' : 'No file');
      
      const blogData = req.body;
      
      // Validate required fields
      if (!blogData.title || !blogData.title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      
      // Auto-generate slug if not provided
      if (!blogData.slug && blogData.title) {
        const baseSlug = generateSlug(blogData.title);
        blogData.slug = await ensureUniqueSlug(baseSlug);
        console.log('Generated slug:', blogData.slug);
      } else if (blogData.slug) {
        // If slug is provided, ensure it's properly formatted and unique
        const formattedSlug = generateSlug(blogData.slug);
        blogData.slug = await ensureUniqueSlug(formattedSlug);
        console.log('Formatted slug:', blogData.slug);
      }

      // Handle cover image upload
      if (req.file) {
        const result = await uploadImage(req.file.buffer, {
          folder: 'blog/covers',
          transformation: [
            { width: 1200, height: 630, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        blogData.coverImage = {
          url: result.secure_url,
          publicId: result.public_id,
          alt: blogData.title || ''
        };
      }

      // Convert isPublished string to boolean
      if (typeof blogData.isPublished === 'string') {
        blogData.isPublished = blogData.isPublished === 'true';
      }

      // Process tags (convert comma-separated string to array)
      if (blogData.tags && typeof blogData.tags === 'string') {
        blogData.tags = blogData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }

      // Process meta fields from form data
      if (blogData['meta[title]']) {
        if (!blogData.meta) blogData.meta = {};
        blogData.meta.title = blogData['meta[title]'];
        delete blogData['meta[title]'];
      }
      if (blogData['meta[description]']) {
        if (!blogData.meta) blogData.meta = {};
        blogData.meta.description = blogData['meta[description]'];
        delete blogData['meta[description]'];
      }
      if (blogData['meta[keywords]']) {
        if (!blogData.meta) blogData.meta = {};
        blogData.meta.keywords = blogData['meta[keywords]'].split(',').map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword.length > 0);
        delete blogData['meta[keywords]'];
      }
      if (blogData['meta[canonicalUrl]']) {
        if (!blogData.meta) blogData.meta = {};
        blogData.meta.canonicalUrl = blogData['meta[canonicalUrl]'];
        delete blogData['meta[canonicalUrl]'];
      }

      // Process meta keywords (convert comma-separated string to array)
      if (blogData.meta && blogData.meta.keywords && typeof blogData.meta.keywords === 'string') {
        blogData.meta.keywords = blogData.meta.keywords.split(',').map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword.length > 0);
      }

      console.log('Final blog data before save:', {
        title: blogData.title,
        slug: blogData.slug,
        author: blogData.author,
        category: blogData.category,
        tags: blogData.tags,
        isPublished: blogData.isPublished,
        hasCoverImage: !!blogData.coverImage
      });

      const blogPost = new BlogPost(blogData);
      await blogPost.save();

      console.log('Blog post created successfully:', blogPost._id);
      console.log('=== END CREATE BLOG POST DEBUG ===');

      res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        data: blogPost
      });
    } catch (error) {
      console.error('=== CREATE BLOG POST ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.errors) {
        console.error('Validation errors:', error.errors);
      }
      console.error('=== END ERROR ===');
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'slug') {
          return res.status(400).json({
            success: false,
            message: 'A blog post with this slug already exists. Please try a different title or provide a custom slug.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Blog post with this ${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create blog post',
        error: error.message
      });
    }
  }

  // Update blog post (Admin only)
  async updateBlogPost(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blog post ID'
        });
      }

      const existingPost = await BlogPost.findById(id);
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Handle slug updates
      if (updateData.title && !updateData.slug) {
        // If title is updated but no slug provided, regenerate slug
        const baseSlug = generateSlug(updateData.title);
        updateData.slug = await ensureUniqueSlug(baseSlug, id);
      } else if (updateData.slug) {
        // If slug is provided, ensure it's properly formatted and unique
        const formattedSlug = generateSlug(updateData.slug);
        updateData.slug = await ensureUniqueSlug(formattedSlug, id);
      }

      // Handle cover image upload
      if (req.file) {
        // Delete old image if exists
        if (existingPost.coverImage?.publicId) {
          await deleteImage(existingPost.coverImage.publicId).catch(err =>
            console.error('Failed to delete old cover image:', err)
          );
        }

        const result = await uploadImage(req.file.buffer, {
          folder: 'blog/covers',
          transformation: [
            { width: 1200, height: 630, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        updateData.coverImage = {
          url: result.secure_url,
          publicId: result.public_id,
          alt: updateData.title || existingPost.title
        };
      }

      // Convert isPublished string to boolean
      if (typeof updateData.isPublished === 'string') {
        updateData.isPublished = updateData.isPublished === 'true';
      }

      // Process tags (convert comma-separated string to array)
      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }

      // Process meta fields from form data
      if (updateData['meta[title]']) {
        if (!updateData.meta) updateData.meta = {};
        updateData.meta.title = updateData['meta[title]'];
        delete updateData['meta[title]'];
      }
      if (updateData['meta[description]']) {
        if (!updateData.meta) updateData.meta = {};
        updateData.meta.description = updateData['meta[description]'];
        delete updateData['meta[description]'];
      }
      if (updateData['meta[keywords]']) {
        if (!updateData.meta) updateData.meta = {};
        updateData.meta.keywords = updateData['meta[keywords]'].split(',').map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword.length > 0);
        delete updateData['meta[keywords]'];
      }
      if (updateData['meta[canonicalUrl]']) {
        if (!updateData.meta) updateData.meta = {};
        updateData.meta.canonicalUrl = updateData['meta[canonicalUrl]'];
        delete updateData['meta[canonicalUrl]'];
      }

      // Process meta keywords (convert comma-separated string to array)
      if (updateData.meta && updateData.meta.keywords && typeof updateData.meta.keywords === 'string') {
        updateData.meta.keywords = updateData.meta.keywords.split(',').map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword.length > 0);
      }

      const blogPost = await BlogPost.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Blog post updated successfully',
        data: blogPost
      });
    } catch (error) {
      console.error('Update blog post error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'slug') {
          return res.status(400).json({
            success: false,
            message: 'A blog post with this slug already exists. Please try a different title or provide a custom slug.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Blog post with this ${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update blog post',
        error: error.message
      });
    }
  }

  // Publish/Unpublish blog post (Admin only)
  async togglePublishStatus(req, res) {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blog post ID'
        });
      }

      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isPublished must be a boolean value'
        });
      }

      const blogPost = await BlogPost.findById(id);
      if (!blogPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      blogPost.isPublished = isPublished;
      if (isPublished && !blogPost.publishedAt) {
        blogPost.publishedAt = new Date();
      } else if (!isPublished) {
        blogPost.publishedAt = null;
      }

      await blogPost.save();

      res.status(200).json({
        success: true,
        message: `Blog post ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: blogPost
      });
    } catch (error) {
      console.error('Toggle publish status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update publish status',
        error: error.message
      });
    }
  }

  // Delete blog post (Admin only)
  async deleteBlogPost(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blog post ID'
        });
      }

      const blogPost = await BlogPost.findById(id);
      if (!blogPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Delete cover image from Cloudinary if exists
      if (blogPost.coverImage?.publicId) {
        await deleteImage(blogPost.coverImage.publicId).catch(err =>
          console.error('Failed to delete cover image:', err)
        );
      }

      await BlogPost.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Blog post deleted successfully'
      });
    } catch (error) {
      console.error('Delete blog post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog post',
        error: error.message
      });
    }
  }

  // Search blog posts
  async searchBlogPosts(req, res) {
    try {
      const {
        q,
        page = 1,
        limit = 10,
        sort = '-publishedAt',
        category,
        tags,
        author,
        published = 'true'
      } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query (q) is required'
        });
      }

      const skip = (page - 1) * limit;
      const filter = {};

      // Text search
      filter.$text = { $search: q.trim() };

      // Apply additional filters
      if (category) {
        filter.category = new RegExp(category, 'i');
      }
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        filter.tags = { $in: tagArray };
      }
      if (author) {
        filter.author = new RegExp(author, 'i');
      }
      if (published !== undefined) {
        filter.isPublished = published === 'true';
      }

      const blogPosts = await BlogPost.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await BlogPost.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          blogPosts,
          searchQuery: q.trim(),
          filters: {
            category: category || null,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
            author: author || null,
            published: published === 'true'
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPosts: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Search blog posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search blog posts',
        error: error.message
      });
    }
  }

  // Bulk upload blog posts from Excel file (Admin only)
  async bulkUploadBlogPosts(req, res) {
    try {
      // Check if xlsx is available
      let xlsx;
      try {
        xlsx = require('xlsx');
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Excel processing library not installed. Please install xlsx package.',
          error: 'Missing dependency: xlsx'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is required'
        });
      }

      // Check file size (5MB limit)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit'
        });
      }

      // Check file type
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'
        });
      }

      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or has no valid data'
        });
      }

      const results = {
        success: [],
        failed: [],
        total: data.length
      };

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Prepare blog post data
          const blogData = {
            title: row.title?.trim(),
            excerpt: row.excerpt?.trim(),
            body: row.content?.trim(), // Model uses 'body' not 'content'
            category: row.category?.trim(),
            isPublished: row.isPublished !== undefined ? Boolean(row.isPublished) : false,
          };

          // Handle author as string (model expects string, not object)
          if (row.authorName) {
            blogData.author = row.authorName.trim();
          } else if (req.user && req.user.name) {
            blogData.author = req.user.name;
          } else {
            blogData.author = 'Admin'; // Default author
          }

          // Handle tags (comma or pipe-separated string)
          if (row.tags) {
            const separator = row.tags.includes('|') ? '|' : ',';
            blogData.tags = row.tags.split(separator).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
          }

          // Handle cover image URL (model uses coverImage object)
          if (row.featuredImage) {
            blogData.coverImage = {
              url: row.featuredImage.trim(),
              alt: row.title?.trim() || ''
            };
          }

          // Handle published date
          if (row.publishedAt) {
            try {
              blogData.publishedAt = new Date(row.publishedAt);
            } catch (e) {
              // If date parsing fails, use current date if published
              if (blogData.isPublished) {
                blogData.publishedAt = new Date();
              }
            }
          } else if (blogData.isPublished) {
            blogData.publishedAt = new Date();
          }

          // Handle meta data
          if (row.metaTitle || row.metaDescription || row.metaKeywords) {
            blogData.meta = {};
            if (row.metaTitle) blogData.meta.title = row.metaTitle.trim();
            if (row.metaDescription) blogData.meta.description = row.metaDescription.trim();
            if (row.metaKeywords) {
              const separator = row.metaKeywords.includes('|') ? '|' : ',';
              blogData.meta.keywords = row.metaKeywords.split(separator).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
            }
          }

          // Auto-generate slug if not provided
          if (!blogData.slug && blogData.title) {
            const baseSlug = generateSlug(blogData.title);
            blogData.slug = await ensureUniqueSlug(baseSlug);
          } else if (row.slug) {
            const formattedSlug = generateSlug(row.slug);
            blogData.slug = await ensureUniqueSlug(formattedSlug);
          }

          // Create blog post
          const blogPost = new BlogPost(blogData);
          await blogPost.save();

          results.success.push({
            row: i + 2, // Excel row number (accounting for header)
            postId: blogPost._id,
            title: blogPost.title,
            slug: blogPost.slug,
            category: blogPost.category,
            isPublished: blogPost.isPublished
          });

        } catch (error) {
          results.failed.push({
            row: i + 2,
            title: row.title || 'Unknown',
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Bulk upload completed',
        data: results
      });

    } catch (error) {
      console.error('Bulk upload blog posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk upload',
        error: error.message
      });
    }
  }

}

module.exports = new BlogController();