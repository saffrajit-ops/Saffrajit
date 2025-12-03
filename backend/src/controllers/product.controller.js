const Product = require('../models/product.model');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const mongoose = require('mongoose');
const XLSX = require("xlsx");
const path = require("path");

const { buildProductSearchFilter, buildPagination } = require('../utils/search');

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

    const existingProduct = await Product.findOne(query);
    if (!existingProduct) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

class ProductController {
  // Get all products with filtering, sorting, and pagination
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        sort = '-createdAt',
        category,
        type,
        minPrice,
        maxPrice,
        inStock,
        featured,
        search,
        brand
      } = req.query;

      const skip = (page - 1) * limit;
      const filter = { isActive: true };

      // Apply filters
      if (category) {
        filter.categories = { $in: [category] };
      }
      if (type) {
        filter.type = type;
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (inStock === 'true') {
        filter.stock = { $gt: 0 };
      }
      if (featured === 'true') {
        filter.isFeatured = true;
      }
      if (brand) {
        filter.brand = new RegExp(brand, 'i');
      }
      if (search) {
        filter.$text = { $search: search };
      }

      const products = await Product.find(filter)
        .populate('components.productId', 'title price images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id)
        .populate('components.productId', 'title price images slug')
        .populate('relatedProductIds', 'title price images slug ratingAvg')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count (fire and forget)
      Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  }

  // Get product by slug
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;

      const product = await Product.findOne({ slug, isActive: true })
        .populate('components.productId', 'title price images slug')
        .populate('relatedProductIds', 'title price images slug ratingAvg')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count (fire and forget)
      Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Get product by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  }

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 12, sort = '-createdAt', type, minPrice, maxPrice } = req.query;

      const skip = (page - 1) * limit;

      const filter = {
        categories: category,
        isActive: true
      };

      // Apply additional filters
      if (type) {
        filter.type = type;
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      const products = await Product.find(filter)
        .populate('components.productId', 'title price images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Product.countDocuments(filter);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products by category',
        error: error.message
      });
    }
  }

  // Get all unique categories
  async getAllCategories(req, res) {
    try {
      const categories = await Product.distinct('categories', { isActive: true });

      // Get product count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await Product.countDocuments({
            categories: category,
            isActive: true
          });
          return {
            name: category,
            slug: category.toLowerCase().replace(/\s+/g, '-'),
            productCount: count
          };
        })
      );

      // Sort by name
      categoriesWithCount.sort((a, b) => a.name.localeCompare(b.name));

      res.status(200).json({
        success: true,
        data: categoriesWithCount
      });
    } catch (error) {
      console.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get similar products
  async getSimilarProducts(req, res) {
    try {
      const { id } = req.params;
      const { limit = 4 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id).select('categories');
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const similarProducts = await Product.find({
        _id: { $ne: id },
        categories: { $in: product.categories },
        isActive: true,
        stock: { $gt: 0 }
      })
        .sort({ ratingAvg: -1, salesCount: -1 })
        .limit(parseInt(limit))
        .lean();

      res.status(200).json({
        success: true,
        data: similarProducts
      });
    } catch (error) {
      console.error('Get similar products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch similar products',
        error: error.message
      });
    }
  }

  // Search products (User-side)
  async searchProducts(req, res) {
    try {
      const {
        q, // search query
        page = 1,
        limit = 12,
        sort = '-createdAt',
        category,
        minPrice,
        maxPrice,
        inStock
      } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const skip = (page - 1) * limit;

      // Build search filter using utility
      const filter = buildProductSearchFilter(q, {
        category,
        minPrice,
        maxPrice,
        inStock,
        isActive: true
      });

      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Product.countDocuments(filter);
      const pagination = buildPagination(page, limit, total);

      res.status(200).json({
        success: true,
        data: {
          products,
          searchQuery: q,
          pagination: {
            ...pagination,
            totalProducts: total
          }
        }
      });
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: error.message
      });
    }
  }

  // Search products (Admin-side)
  async searchProductsAdmin(req, res) {
    try {
      const {
        q, // search query
        page = 1,
        limit = 20,
        sort = '-createdAt',
        status, // active, inactive, all
        category,
        type
      } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const skip = (page - 1) * limit;

      // Determine isActive filter based on status
      let isActive = null;
      if (status === 'active') {
        isActive = true;
      } else if (status === 'inactive') {
        isActive = false;
      }
      // If status is 'all' or not provided, isActive remains null (no filter)

      // Build search filter using utility
      const filter = buildProductSearchFilter(q, {
        category,
        type,
        isActive
      });

      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Product.countDocuments(filter);
      const pagination = buildPagination(page, limit, total);

      res.status(200).json({
        success: true,
        data: {
          products,
          searchQuery: q,
          pagination: {
            ...pagination,
            totalProducts: total
          }
        }
      });
    } catch (error) {
      console.error('Admin search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: error.message
      });
    }
  }

  // Create product (Admin only)
  async createProduct(req, res) {
    try {
      const productData = req.body;

      // Convert string fields to arrays for concern and categories
      if (productData.concern && typeof productData.concern === 'string') {
        productData.concern = [productData.concern];
      }
      if (productData.categories && typeof productData.categories === 'string') {
        productData.categories = [productData.categories];
      }

      // Handle nested discount object
      if (productData['discount[value]'] !== undefined || productData['discount[type]'] !== undefined) {
        productData.discount = {
          value: parseFloat(productData['discount[value]'] || 0),
          type: productData['discount[type]'] || 'percentage'
        };
        delete productData['discount[value]'];
        delete productData['discount[type]'];
      }

      // Handle nested shipping object
      if (productData['shipping[charges]'] !== undefined ||
        productData['shipping[freeShippingThreshold]'] !== undefined ||
        productData['shipping[freeShippingMinQuantity]'] !== undefined) {
        productData.shipping = {
          charges: parseFloat(productData['shipping[charges]'] || 0),
          freeShippingThreshold: parseFloat(productData['shipping[freeShippingThreshold]'] || 0),
          freeShippingMinQuantity: parseInt(productData['shipping[freeShippingMinQuantity]'] || 0)
        };
        delete productData['shipping[charges]'];
        delete productData['shipping[freeShippingThreshold]'];
        delete productData['shipping[freeShippingMinQuantity]'];
      }

      // Auto-generate slug if not provided
      if (!productData.slug && productData.title) {
        const baseSlug = generateSlug(productData.title);
        productData.slug = await ensureUniqueSlug(baseSlug);
      } else if (productData.slug) {
        // If slug is provided, ensure it's properly formatted and unique
        const formattedSlug = generateSlug(productData.slug);
        productData.slug = await ensureUniqueSlug(formattedSlug);
      }

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        const imageUploads = req.files.map(async (file, index) => {
          const result = await uploadImage(file.buffer, {
            folder: 'products',
            transformation: [
              { width: 800, height: 800, crop: 'fill' },
              { quality: 'auto' }
            ]
          });

          return {
            url: result.secure_url,
            publicId: result.public_id,
            alt: productData.title || '',
            position: index
          };
        });

        productData.images = await Promise.all(imageUploads);
      }

      const product = new Product(productData);
      await product.save();

      const populatedProduct = await Product.findById(product._id)
        .populate('components.productId', 'title price images');

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: populatedProduct
      });
    } catch (error) {
      console.error('Create product error:', error);

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'slug') {
          return res.status(400).json({
            success: false,
            message: 'A product with this slug already exists. Please try a different title or provide a custom slug.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Product with this ${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }

  // Update product (Admin only)
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Convert string fields to arrays for concern and categories
      if (updateData.concern && typeof updateData.concern === "string") {
        updateData.concern = [updateData.concern];
      }
      if (updateData.categories && typeof updateData.categories === "string") {
        updateData.categories = [updateData.categories];
      }

      // Handle nested discount object
      if (updateData['discount[value]'] !== undefined || updateData['discount[type]'] !== undefined) {
        updateData.discount = {
          value: parseFloat(updateData['discount[value]'] || 0),
          type: updateData['discount[type]'] || 'percentage'
        };
        delete updateData['discount[value]'];
        delete updateData['discount[type]'];
      }

      // Handle nested shipping object
      if (updateData['shipping[charges]'] !== undefined ||
        updateData['shipping[freeShippingThreshold]'] !== undefined ||
        updateData['shipping[freeShippingMinQuantity]'] !== undefined) {
        updateData.shipping = {
          charges: parseFloat(updateData['shipping[charges]'] || 0),
          freeShippingThreshold: parseFloat(updateData['shipping[freeShippingThreshold]'] || 0),
          freeShippingMinQuantity: parseInt(updateData['shipping[freeShippingMinQuantity]'] || 0)
        };
        delete updateData['shipping[charges]'];
        delete updateData['shipping[freeShippingThreshold]'];
        delete updateData['shipping[freeShippingMinQuantity]'];
      }

      // Handle slug updates
      if (updateData.title && !updateData.slug) {
        const baseSlug = generateSlug(updateData.title);
        updateData.slug = await ensureUniqueSlug(baseSlug, id);
      } else if (updateData.slug) {
        const formattedSlug = generateSlug(updateData.slug);
        updateData.slug = await ensureUniqueSlug(formattedSlug, id);
      }

      // Handle new image uploads
      if (req.files && req.files.length > 0) {
        const imageUploads = req.files.map(async (file, index) => {
          const result = await uploadImage(file.buffer, {
            folder: "products",
            transformation: [
              { width: 800, height: 800, crop: "fill" },
              { quality: "auto" },
            ],
          });

          return {
            url: result.secure_url,
            publicId: result.public_id,
            alt: updateData.title || existingProduct.title,
            position: (existingProduct.images?.length || 0) + index,
          };
        });

        const newImages = await Promise.all(imageUploads);
        updateData.images = [...(existingProduct.images || []), ...newImages];
      }

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("components.productId", "title price images");

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("Update product error:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === "slug") {
          return res.status(400).json({
            success: false,
            message:
              "A product with this slug already exists. Please try a different title or provide a custom slug.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Product with this ${field} already exists`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
    }
  }


  // Delete product (Admin only)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Delete associated images from Cloudinary
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(image =>
          deleteImage(image.publicId).catch(err =>
            console.error('Failed to delete image:', err)
          )
        );
        await Promise.all(deletePromises);
      }

      await Product.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }

  // Bulk upload products from Excel file (Admin only)
  async bulkUploadProducts(req, res) {
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
          // Prepare product data (no validation - all fields optional)
          const productData = {
            type: row.type || 'single',
            title: row.title?.trim(),
            sku: row.sku?.trim(),
            barcode: row.barcode?.trim(),
            brand: row.brand?.trim() || 'Cana Gold',
            shortDescription: row.shortDescription?.trim(),
            description: row.description?.trim(),
            price: row.price ? parseFloat(row.price) : 0,
            compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : undefined,
            currency: row.currency?.trim() || 'USD',
            stock: row.stock ? parseInt(row.stock) : 0,
            isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
            isFeatured: row.isFeatured !== undefined ? Boolean(row.isFeatured) : false
          };

          // Handle benefits (pipe or comma-separated string)
          if (row.benefits) {
            const separator = row.benefits.includes('|') ? '|' : ',';
            productData.benefits = row.benefits.split(separator).map(b => b.trim()).filter(b => b.length > 0);
          }

          // Handle attributes
          if (row.shade || row.size || row.skinType) {
            productData.attributes = {};
            if (row.shade) productData.attributes.shade = row.shade.trim();
            if (row.size) productData.attributes.size = row.size.trim();
            if (row.skinType) productData.attributes.skinType = row.skinType.trim();
          }

          // Handle categories (comma-separated strings)
          if (row.categories) {
            const separator = row.categories.includes('|') ? '|' : ',';
            productData.categories = row.categories.split(separator).map(c => c.trim()).filter(c => c.length > 0);
          }

          // Handle collection
          if (row.collection) {
            productData.collection = row.collection.trim();
          }

          // Handle concerns (comma-separated strings)
          if (row.concern) {
            const separator = row.concern.includes('|') ? '|' : ',';
            productData.concern = row.concern.split(separator).map(c => c.trim()).filter(c => c.length > 0);
          }

          // Handle related products (comma-separated ObjectIds)
          if (row.relatedProductIds) {
            const relatedIds = row.relatedProductIds.split(',').map(id => id.trim()).filter(id => id.length === 24);
            if (relatedIds.length > 0) {
              productData.relatedProductIds = relatedIds;
            }
          }

          // Handle ingredients text processing
          if (row.ingredientsText) {
            const separator = row.ingredientsText.includes('|') ? '|' : ',';
            // Keep as string but clean up formatting
            productData.ingredientsText = row.ingredientsText.split(separator).map(i => i.trim()).join(', ');
          }

          // Handle howToApply field
          if (row.howToApply) {
            productData.howToApply = row.howToApply.trim();
          }

          // Handle product images from URLs
          if (row.imageUrls) {
            const imageUrls = row.imageUrls.split('|').map(url => url.trim()).filter(url => url.length > 0);
            if (imageUrls.length > 0) {
              productData.images = imageUrls.map((url, index) => ({
                url: url,
                publicId: `bulk-upload-${Date.now()}-${index}`, // Placeholder public ID
                alt: productData.title || '',
                position: index
              }));
            }
          }

          // Handle meta data
          if (row.metaTitle || row.metaDescription || row.metaKeywords) {
            productData.meta = {};
            if (row.metaTitle) productData.meta.title = row.metaTitle.trim();
            if (row.metaDescription) productData.meta.description = row.metaDescription.trim();
            if (row.metaKeywords) {
              const separator = row.metaKeywords.includes('|') ? '|' : ',';
              productData.meta.keywords = row.metaKeywords.split(separator).map(k => k.trim()).filter(k => k.length > 0);
            }
          }

          // Auto-generate slug if not provided
          if (!productData.slug && productData.title) {
            const baseSlug = generateSlug(productData.title);
            productData.slug = await ensureUniqueSlug(baseSlug);
          } else if (row.slug) {
            const formattedSlug = generateSlug(row.slug);
            productData.slug = await ensureUniqueSlug(formattedSlug);
          }

          // Create product
          const product = new Product(productData);
          await product.save();

          const populatedProduct = await Product.findById(product._id).lean();

          results.success.push({
            row: i + 2, // Excel row number (accounting for header)
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            stock: product.stock
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
      console.error('Bulk upload products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk upload',
        error: error.message
      });
    }
  }

  // Delete product image (Admin only)
  async deleteProductImage(req, res) {
    try {
      const { id, imageId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
      if (imageIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      const image = product.images[imageIndex];

      // Delete from Cloudinary
      await deleteImage(image.publicId);

      // Remove from product
      product.images.splice(imageIndex, 1);
      await product.save();

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Delete product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();