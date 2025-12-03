const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth');

// Public routes
router.get('/blogs/:blogId/comments', commentController.getBlogComments);

// Protected routes (require authentication)
router.post('/blogs/:blogId/comments', authenticate, commentController.createComment);
router.post('/blogs/:blogId/comments/:commentId/replies', authenticate, commentController.createReply);
router.post('/blogs/:blogId/comments/:commentId/like', authenticate, commentController.toggleCommentLike);
router.post('/blogs/:blogId/comments/:commentId/replies/:replyId/like', authenticate, commentController.toggleReplyLike);

// Admin routes
router.get('/admin/comments', authenticate, authorize('admin'), commentController.getAllComments);
router.get('/blogs/:blogId/admin/comments', authenticate, authorize('admin'), commentController.getBlogCommentsAdmin);
router.put('/blogs/:blogId/comments/:commentId', authenticate, authorize('admin'), commentController.updateComment);
router.put('/blogs/:blogId/comments/:commentId/replies/:replyId', authenticate, authorize('admin'), commentController.updateReply);
router.delete('/blogs/:blogId/comments/:commentId', authenticate, authorize('admin'), commentController.deleteComment);
router.delete('/blogs/:blogId/comments/:commentId/replies/:replyId', authenticate, authorize('admin'), commentController.deleteReply);
router.patch('/blogs/:blogId/comments/:commentId/approve', authenticate, authorize('admin'), commentController.approveComment);
router.patch('/blogs/:blogId/comments/:commentId/reject', authenticate, authorize('admin'), commentController.rejectComment);
router.patch('/blogs/:blogId/comments/:commentId/pending', authenticate, authorize('admin'), commentController.setPendingComment);

module.exports = router;
