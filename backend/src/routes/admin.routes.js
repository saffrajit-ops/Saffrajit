const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getDashboardStats
} = require('../controllers/admin.controller');
const productController = require('../controllers/product.controller');
const taxonomyController = require('../controllers/taxonomy.controller');
const couponController = require('../controllers/coupon.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const { validate, schemas } = require('../middlewares/validate');

const { uploadMultiple, uploadSingle, uploadExcel, uploadCoverImage, handleUploadError } = require('../middlewares/upload');
const blogController = require('../controllers/blog.controller');


// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/toggle-status', toggleUserStatus);



// ===== PRODUCT ADMIN ROUTES =====
router.get('/products', productController.getAllProducts);
router.get('/products/search', productController.searchProductsAdmin);
router.get('/products/:id', productController.getProductById);
router.post(
  '/products',
  uploadMultiple,
  handleUploadError,
  productController.createProduct
);

router.post(
  '/products/bulk-upload',
  uploadExcel,
  handleUploadError,
  productController.bulkUploadProducts
);

router.put(
  '/products/:id',
  uploadMultiple,
  handleUploadError,
  productController.updateProduct
);

router.delete('/products/:id', productController.deleteProduct);
router.delete('/products/:id/images/:imageId', productController.deleteProductImage);

// ===== TAXONOMY ADMIN ROUTES =====
router.post(
  '/taxonomies',
  uploadSingle,
  handleUploadError,
  taxonomyController.createTaxonomy
);

router.put(
  '/taxonomies/:id',
  uploadSingle,
  handleUploadError,
  taxonomyController.updateTaxonomy
);


router.delete('/taxonomies/:id', taxonomyController.deleteTaxonomy);

// ===== COUPON ADMIN ROUTES =====
router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);


// Admin blog management routes
router.get('/blog', blogController.getAllBlogPosts);

router.post(
  '/blog',
  uploadCoverImage,
  handleUploadError,
  blogController.createBlogPost
);

router.post(
  '/blog/bulk-upload',
  uploadExcel,
  handleUploadError,
  blogController.bulkUploadBlogPosts
);

router.get('/blog/:id', blogController.getBlogById);

router.put(
  '/blog/:id',
  uploadCoverImage,
  handleUploadError,
  blogController.updateBlogPost
);

router.patch(
  '/blog/:id/publish',
  blogController.togglePublishStatus
);

router.delete('/blog/:id', blogController.deleteBlogPost);

module.exports = router;
















