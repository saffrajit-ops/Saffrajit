const express = require('express');
const router = express.Router();
const blogController = require('../../controllers/blog.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const { upload } = require('../../config/multer');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Admin blog routes
router.get('/', blogController.getAllBlogPosts);
router.get('/:id', blogController.getBlogById);
router.post('/', upload.single('image'), blogController.createBlogPost);
router.put('/:id', upload.single('image'), blogController.updateBlogPost);
router.put('/:id/publish', blogController.togglePublishStatus);
router.delete('/:id', blogController.deleteBlogPost);

module.exports = router;
