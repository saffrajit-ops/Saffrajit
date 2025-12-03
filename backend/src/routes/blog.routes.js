const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');

// Public routes - Get blog posts
router.get('/', blogController.getAllBlogPosts);
router.get('/search', blogController.searchBlogPosts);
router.get('/slug/:slug', blogController.getBlogBySlug);

module.exports = router;