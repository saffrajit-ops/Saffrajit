const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  addAddress: Joi.object({
    label: Joi.string().optional(),
    line1: Joi.string().required(),
    line2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().default('US'),
    isDefault: Joi.boolean().default(false)
  }),

  // Product validation schemas
  createProduct: Joi.object({
    type: Joi.string().valid('single', 'gift-set').required(),
    title: Joi.string().min(2).max(200).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    sku: Joi.string().optional(),
    barcode: Joi.string().optional(),
    brand: Joi.string().default('Cana Gold'),
    shortDescription: Joi.string().max(300).optional(),
    description: Joi.string().max(5000).optional(),
    benefits: Joi.array().items(Joi.string().max(200)).optional(),
    howToApply: Joi.string().max(1000).optional(),
    ingredientsText: Joi.string().max(2000).optional(),
    ingredients: Joi.array().items(Joi.string().hex().length(24)).optional(),

    currency: Joi.string().default('USD'),
    stock: Joi.number().min(0).required(),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    concern: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(100)),
      Joi.string().max(100)
    ).optional(),
    categories: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(100)),
      Joi.string().max(100)
    ).optional(),
    collection: Joi.string().max(100).optional(),
    attributes: Joi.object({
      shade: Joi.string().optional(),
      size: Joi.string().optional(),
      skinType: Joi.string().valid('dry', 'oily', 'combination', 'sensitive', 'normal', 'all').optional()
    }).optional(),
    taxonomies: Joi.array().items(Joi.string().hex().length(24)).optional(),
    components: Joi.array().items(Joi.object({
      productId: Joi.string().hex().length(24).required(),
      qty: Joi.number().min(1).required()
    })).optional(),
    relatedProductIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
    meta: Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      keywords: Joi.array().items(Joi.string()).optional(),
      canonicalUrl: Joi.string().uri().optional()
    }).optional()
  }),

  updateProduct: Joi.object({
    type: Joi.string().valid('single', 'gift-set').optional(),
    title: Joi.string().min(2).max(200).optional(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    sku: Joi.string().optional(),
    barcode: Joi.string().optional(),
    brand: Joi.string().optional(),
    shortDescription: Joi.string().max(300).optional(),
    description: Joi.string().max(5000).optional(),
    benefits: Joi.array().items(Joi.string().max(200)).optional(),
    howToApply: Joi.string().max(1000).optional(),
    ingredientsText: Joi.string().max(2000).optional(),
    ingredients: Joi.array().items(Joi.string().hex().length(24)).optional(),
  
    currency: Joi.string().optional(),
    stock: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
    concern: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(100)),
      Joi.string().max(100)
    ).optional(),
    categories: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(100)),
      Joi.string().max(100)
    ).optional(),
    collection: Joi.string().max(100).optional(),
    attributes: Joi.object({
      shade: Joi.string().optional(),
      size: Joi.string().optional(),
      skinType: Joi.string().valid('dry', 'oily', 'combination', 'sensitive', 'normal', 'all').optional()
    }).optional(),
    taxonomies: Joi.array().items(Joi.string().hex().length(24)).optional(),
    components: Joi.array().items(Joi.object({
      productId: Joi.string().hex().length(24).required(),
      qty: Joi.number().min(1).required()
    })).optional(),
    relatedProductIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
    meta: Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      keywords: Joi.array().items(Joi.string()).optional(),
      canonicalUrl: Joi.string().uri().optional()
    }).optional()
  }),

  // Taxonomy validation schemas
  createTaxonomy: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    type: Joi.string().valid('collection', 'category', 'concern', 'gift-type').required(),
    parentId: Joi.string().hex().length(24).optional(),
    position: Joi.number().default(0),
    isActive: Joi.boolean().default(true),
    description: Joi.string().max(500).optional(),
    meta: Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      keywords: Joi.array().items(Joi.string()).optional()
    }).optional()
  }),

  updateTaxonomy: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    type: Joi.string().valid('collection', 'category', 'concern', 'gift-type').optional(),
    parentId: Joi.string().hex().length(24).optional(),
    position: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
    description: Joi.string().max(500).optional(),
    meta: Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      keywords: Joi.array().items(Joi.string()).optional()
    }).optional()
  }),

  // Coupon validation schemas
  createCoupon: Joi.object({
    code: Joi.string().min(3).max(20).uppercase().required(),
    type: Joi.string().valid('flat', 'percent').required(),
    value: Joi.number().min(0).required(),
    minSubtotal: Joi.number().min(0).default(0),
    startsAt: Joi.date().default(Date.now),
    endsAt: Joi.date().required(),
    usageLimit: Joi.number().min(1).optional(),
    appliesTo: Joi.object({
      productIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
      taxonomyIds: Joi.array().items(Joi.string().hex().length(24)).optional()
    }).optional(),
    isActive: Joi.boolean().default(true)
  }),

  updateCoupon: Joi.object({
    code: Joi.string().min(3).max(20).uppercase().optional(),
    type: Joi.string().valid('flat', 'percent').optional(),
    value: Joi.number().min(0).optional(),
    minSubtotal: Joi.number().min(0).optional(),
    startsAt: Joi.date().optional(),
    endsAt: Joi.date().optional(),
    usageLimit: Joi.number().min(1).optional(),
    appliesTo: Joi.object({
      productIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
      taxonomyIds: Joi.array().items(Joi.string().hex().length(24)).optional()
    }).optional(),
    isActive: Joi.boolean().optional()
  }), // <-- FIX: close updateCoupon before next block

  // Review validation schemas
  createReview: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(200).optional(),
    comment: Joi.string().min(10).max(2000).required()
  }),

  updateReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    title: Joi.string().max(200).optional(),
    comment: Joi.string().min(10).max(2000).optional()
  }),

  addComment: Joi.object({
    comment: Joi.string().min(1).max(1000).required(),
    parentCommentId: Joi.string().hex().length(24).optional()
  }),

  // Cart validation schemas
  addToCart: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    qty: Joi.number().integer().min(1).max(99).default(1),
    variant: Joi.object({
      shade: Joi.string().optional(),
      size: Joi.string().optional(),
      skinType: Joi.string().valid('dry', 'oily', 'combination', 'sensitive', 'normal', 'all').optional()
    }).optional()
  }),

  updateCartItem: Joi.object({
    qty: Joi.number().integer().min(0).max(99).required()
  }),

  // Wishlist validation schemas
  addToWishlist: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    qty: Joi.number().integer().min(1).max(99).default(1),
    variant: Joi.object({
      shade: Joi.string().optional(),
      size: Joi.string().optional(),
      skinType: Joi.string().valid('dry', 'oily', 'combination', 'sensitive', 'normal', 'all').optional()
    }).optional()
  }),

  updateWishlistItem: Joi.object({
    qty: Joi.number().integer().min(0).max(99).required()
  }),

  changeQuantity: Joi.object({
    amount: Joi.number().integer().min(1).max(10).default(1)
  }),

  moveToCart: Joi.object({
    qty: Joi.number().integer().min(1).max(99).optional()
  }),

  // Blog validation schemas
  createBlogPost: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    excerpt: Joi.string().max(500).optional(),
    body: Joi.string().min(10).max(50000).required(),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(50)),
      Joi.string()
    ).optional(),
    category: Joi.string().max(100).optional(),
    author: Joi.string().min(2).max(100).required(),
    isPublished: Joi.boolean().optional(),
    meta: Joi.object({
      title: Joi.string().max(200).optional(),
      description: Joi.string().max(300).optional(),
      keywords: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
      ).optional(),
      canonicalUrl: Joi.string().uri().optional()
    }).optional()
  }),

  updateBlogPost: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
    excerpt: Joi.string().max(500).optional(),
    body: Joi.string().min(10).max(50000).optional(),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(50)),
      Joi.string()
    ).optional(),
    category: Joi.string().max(100).optional(),
    author: Joi.string().min(2).max(100).optional(),
    isPublished: Joi.boolean().optional(),
    meta: Joi.object({
      title: Joi.string().max(200).optional(),
      description: Joi.string().max(300).optional(),
      keywords: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
      ).optional(),
      canonicalUrl: Joi.string().uri().optional()
    }).optional()
  }),

  togglePublishStatus: Joi.object({
    isPublished: Joi.boolean().required()
  })
};

module.exports = { validate, schemas };
