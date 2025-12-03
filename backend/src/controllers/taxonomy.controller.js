const Taxonomy = require('../models/taxonomy.model');
const Product = require('../models/product.model');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const mongoose = require('mongoose');

// Utility function to generate slug
const generateSlug = (name) => {
  return name
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

    const existingTaxonomy = await Taxonomy.findOne(query);
    if (!existingTaxonomy) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

class TaxonomyController {
  // Get all taxonomies with optional filtering
  async getAllTaxonomies(req, res) {
    try {
      const { type, parentId, includeChildren = 'false' } = req.query;

      const filter = { isActive: true };

      if (type) {
        filter.type = type;
      }

      if (parentId) {
        if (parentId === 'null') {
          filter.parentId = null;
        } else if (mongoose.Types.ObjectId.isValid(parentId)) {
          filter.parentId = parentId;
        }
      }

      let query = Taxonomy.find(filter).sort({ position: 1, name: 1 });

      if (includeChildren === 'true') {
        query = query.populate('children');
      }

      const taxonomies = await query.lean();

      res.status(200).json({
        success: true,
        data: taxonomies
      });
    } catch (error) {
      console.error('Get all taxonomies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch taxonomies',
        error: error.message
      });
    }
  }

  // Get taxonomy by ID
  async getTaxonomyById(req, res) {
    try {
      const { id } = req.params;
      const { includeChildren = 'false', includeProducts = 'false' } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taxonomy ID'
        });
      }

      let query = Taxonomy.findById(id);

      if (includeChildren === 'true') {
        query = query.populate('children');
      }

      const taxonomy = await query.lean();

      if (!taxonomy) {
        return res.status(404).json({
          success: false,
          message: 'Taxonomy not found'
        });
      }

      // Include products if requested
      if (includeProducts === 'true') {
        const products = await Product.find({
          taxonomies: id,
          isActive: true
        })
          .select('title slug price images ratingAvg')
          .limit(12)
          .lean();

        taxonomy.products = products;
      }

      res.status(200).json({
        success: true,
        data: taxonomy
      });
    } catch (error) {
      console.error('Get taxonomy by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch taxonomy',
        error: error.message
      });
    }
  }

  // Get taxonomy by slug
  async getTaxonomyBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { includeChildren = 'false', includeProducts = 'false' } = req.query;

      let query = Taxonomy.findOne({ slug, isActive: true });

      if (includeChildren === 'true') {
        query = query.populate('children');
      }

      const taxonomy = await query.lean();

      if (!taxonomy) {
        return res.status(404).json({
          success: false,
          message: 'Taxonomy not found'
        });
      }

      // Include products if requested
      if (includeProducts === 'true') {
        const products = await Product.find({
          taxonomies: taxonomy._id,
          isActive: true
        })
          .select('title slug price images ratingAvg')
          .limit(12)
          .lean();

        taxonomy.products = products;
      }

      res.status(200).json({
        success: true,
        data: taxonomy
      });
    } catch (error) {
      console.error('Get taxonomy by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch taxonomy',
        error: error.message
      });
    }
  }

  // Get taxonomies by type
  async getTaxonomiesByType(req, res) {
    try {
      const { type } = req.params;
      const { includeChildren = 'false' } = req.query;

      const validTypes = ['collection', 'category', 'concern', 'gift-type'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taxonomy type'
        });
      }

      let query = Taxonomy.find({ type, isActive: true }).sort({ position: 1, name: 1 });

      if (includeChildren === 'true') {
        query = query.populate('children');
      }

      const taxonomies = await query.lean();

      res.status(200).json({
        success: true,
        data: taxonomies
      });
    } catch (error) {
      console.error('Get taxonomies by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch taxonomies by type',
        error: error.message
      });
    }
  }

  // Create taxonomy (Admin only)
  async createTaxonomy(req, res) {
    try {
      const taxonomyData = req.body;

      // Auto-generate slug if not provided
      if (!taxonomyData.slug && taxonomyData.name) {
        const baseSlug = generateSlug(taxonomyData.name);
        taxonomyData.slug = await ensureUniqueSlug(baseSlug);
      } else if (taxonomyData.slug) {
        // If slug is provided, ensure it's properly formatted and unique
        const formattedSlug = generateSlug(taxonomyData.slug);
        taxonomyData.slug = await ensureUniqueSlug(formattedSlug);
      }

      // Handle image upload
      if (req.file) {
        const result = await uploadImage(req.file.buffer, {
          folder: 'taxonomies',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        taxonomyData.image = {
          url: result.secure_url,
          publicId: result.public_id,
          alt: taxonomyData.name || ''
        };
      }

      // Validate parent exists if parentId is provided
      if (taxonomyData.parentId) {
        const parent = await Taxonomy.findById(taxonomyData.parentId);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Parent taxonomy not found'
          });
        }
      }

      const taxonomy = new Taxonomy(taxonomyData);
      await taxonomy.save();

      const populatedTaxonomy = await Taxonomy.findById(taxonomy._id)
        .populate('children')
        .lean();

      res.status(201).json({
        success: true,
        message: 'Taxonomy created successfully',
        data: populatedTaxonomy
      });
    } catch (error) {
      console.error('Create taxonomy error:', error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'slug') {
          return res.status(400).json({
            success: false,
            message: 'A taxonomy with this slug already exists. Please try a different name or provide a custom slug.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Taxonomy with this ${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create taxonomy',
        error: error.message
      });
    }
  }

  // Update taxonomy (Admin only)
  async updateTaxonomy(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taxonomy ID'
        });
      }

      const existingTaxonomy = await Taxonomy.findById(id);
      if (!existingTaxonomy) {
        return res.status(404).json({
          success: false,
          message: 'Taxonomy not found'
        });
      }

      // Handle slug updates
      if (updateData.name && !updateData.slug) {
        // If name is updated but no slug provided, regenerate slug
        const baseSlug = generateSlug(updateData.name);
        updateData.slug = await ensureUniqueSlug(baseSlug, id);
      } else if (updateData.slug) {
        // If slug is provided, ensure it's properly formatted and unique
        const formattedSlug = generateSlug(updateData.slug);
        updateData.slug = await ensureUniqueSlug(formattedSlug, id);
      }

      // Handle image upload
      if (req.file) {
        // Delete old image if exists
        if (existingTaxonomy.image?.publicId) {
          await deleteImage(existingTaxonomy.image.publicId).catch(err =>
            console.error('Failed to delete old image:', err)
          );
        }

        const result = await uploadImage(req.file.buffer, {
          folder: 'taxonomies',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        updateData.image = {
          url: result.secure_url,
          publicId: result.public_id,
          alt: updateData.name || existingTaxonomy.name
        };
      }

      // Validate parent exists if parentId is provided
      if (updateData.parentId && updateData.parentId !== existingTaxonomy.parentId?.toString()) {
        const parent = await Taxonomy.findById(updateData.parentId);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Parent taxonomy not found'
          });
        }

        // Prevent circular reference
        if (updateData.parentId === id) {
          return res.status(400).json({
            success: false,
            message: 'Taxonomy cannot be its own parent'
          });
        }
      }

      const taxonomy = await Taxonomy.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('children')
        .lean();

      res.status(200).json({
        success: true,
        message: 'Taxonomy updated successfully',
        data: taxonomy
      });
    } catch (error) {
      console.error('Update taxonomy error:', error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'slug') {
          return res.status(400).json({
            success: false,
            message: 'A taxonomy with this slug already exists. Please try a different name or provide a custom slug.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Taxonomy with this ${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update taxonomy',
        error: error.message
      });
    }
  }

  // Delete taxonomy (Admin only)
  async deleteTaxonomy(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taxonomy ID'
        });
      }

      const taxonomy = await Taxonomy.findById(id);
      if (!taxonomy) {
        return res.status(404).json({
          success: false,
          message: 'Taxonomy not found'
        });
      }

      // Check if taxonomy has children
      const childrenCount = await Taxonomy.countDocuments({ parentId: id });
      if (childrenCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete taxonomy with child taxonomies. Please delete children first.'
        });
      }

      // Check if taxonomy is used by products
      const productsCount = await Product.countDocuments({ taxonomies: id });
      if (productsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete taxonomy. It is used by ${productsCount} product(s).`
        });
      }

      // Delete associated image from Cloudinary
      if (taxonomy.image?.publicId) {
        await deleteImage(taxonomy.image.publicId).catch(err =>
          console.error('Failed to delete image:', err)
        );
      }

      await Taxonomy.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Taxonomy deleted successfully'
      });
    } catch (error) {
      console.error('Delete taxonomy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete taxonomy',
        error: error.message
      });
    }
  }

  // Get taxonomy tree (hierarchical structure)
  async getTaxonomyTree(req, res) {
    try {
      const { type } = req.query;

      const filter = { isActive: true, parentId: null };
      if (type) {
        filter.type = type;
      }

      const buildTree = async (parentId = null) => {
        const taxonomies = await Taxonomy.find({
          ...filter,
          parentId
        }).sort({ position: 1, name: 1 }).lean();

        for (let taxonomy of taxonomies) {
          taxonomy.children = await buildTree(taxonomy._id);
        }

        return taxonomies;
      };

      const tree = await buildTree();

      res.status(200).json({
        success: true,
        data: tree
      });
    } catch (error) {
      console.error('Get taxonomy tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch taxonomy tree',
        error: error.message
      });
    }
  }
}

module.exports = new TaxonomyController();