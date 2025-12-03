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

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  body: {
    type: String,
    required: [true, 'Body content is required'],
    maxlength: [50000, 'Body cannot exceed 50000 characters']
  },
  coverImage: {
    url: {
      type: String,
      required: false
    },
    publicId: {
      type: String,
      required: false
    },
    alt: {
      type: String,
      default: ''
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Each tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  meta: {
    title: {
      type: String,
      maxlength: [200, 'Meta title cannot exceed 200 characters']
    },
    description: {
      type: String,
      maxlength: [300, 'Meta description cannot exceed 300 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    canonicalUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Canonical URL must be a valid URL'
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ title: 'text', excerpt: 'text', body: 'text', tags: 'text' });
blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index({ viewCount: -1 });

// Virtual for reading time (approximate)
blogPostSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.body ? this.body.split(/\s+/).length : 0;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Pre-save middleware to generate slug if not provided
blogPostSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    let baseSlug = generateSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (true) {
      const existingPost = await this.constructor.findOne({ 
        slug, 
        _id: { $ne: this._id } 
      });
      if (!existingPost) {
        this.slug = slug;
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  
  // Set publishedAt when publishing for the first time
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Clear publishedAt when unpublishing
  if (!this.isPublished && this.publishedAt) {
    this.publishedAt = null;
  }
  
  next();
});

// Static method to find published posts
blogPostSchema.statics.findPublished = function(filter = {}) {
  return this.find({ ...filter, isPublished: true })
    .sort({ publishedAt: -1 });
};

// Static method to find by category
blogPostSchema.statics.findByCategory = function(category, options = {}) {
  const { page = 1, limit = 10, published = true } = options;
  const skip = (page - 1) * limit;
  
  const filter = { category };
  if (published) {
    filter.isPublished = true;
  }
  
  return this.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find by tags
blogPostSchema.statics.findByTags = function(tags, options = {}) {
  const { page = 1, limit = 10, published = true } = options;
  const skip = (page - 1) * limit;
  
  const filter = { tags: { $in: tags } };
  if (published) {
    filter.isPublished = true;
  }
  
  return this.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Method to increment view count
blogPostSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('BlogPost', blogPostSchema);