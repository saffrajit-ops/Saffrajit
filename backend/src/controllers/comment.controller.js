const Comment = require('../models/comment.model');
const Blog = require('../models/blog.model');

// Get all comments for a blog (public - only approved)
exports.getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    const comments = await Comment.find({
      blog: blogId,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Comment.countDocuments({ blog: blogId, status: 'approved' });

    res.json({
      comments,
      total,
      hasMore: total > parseInt(skip) + comments.length
    });
  } catch (error) {
    console.error('Get blog comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Create a comment (authenticated users only)
exports.createComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = new Comment({
      blog: blogId,
      content,
      author: {
        name: req.user.name || req.user.email,
        email: req.user.email,
        userId: req.user._id
      },
      status: 'approved' // Default to approved - comments appear immediately
    });

    await comment.save();

    res.status(201).json({
      message: 'Comment posted successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
};

// Create a reply (authenticated users only)
exports.createReply = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { content, parentReplyId } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = {
      content,
      author: {
        name: req.user.name || req.user.email,
        email: req.user.email,
        userId: req.user._id
      },
      likes: [],
      status: 'approved',
      replies: []
    };

    // If parentReplyId is provided, add as nested reply
    if (parentReplyId) {
      const addNestedReply = (replies) => {
        for (let r of replies) {
          if (r._id.toString() === parentReplyId) {
            if (!r.replies) r.replies = [];
            r.replies.push(reply);
            return true;
          }
          if (r.replies && r.replies.length > 0) {
            if (addNestedReply(r.replies)) return true;
          }
        }
        return false;
      };

      if (!addNestedReply(comment.replies)) {
        return res.status(404).json({ message: 'Parent reply not found' });
      }
    } else {
      comment.replies.push(reply);
    }

    await comment.save();

    res.status(201).json({
      message: 'Reply added successfully',
      comment
    });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ message: 'Failed to create reply', error: error.message });
  }
};

// Toggle comment like
exports.toggleCommentLike = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user._id;

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.findIndex(id => id.toString() === userId.toString());

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      message: 'Like toggled successfully',
      likes: comment.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

// Toggle reply like
exports.toggleReplyLike = async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user._id;

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const toggleLike = (replies) => {
      for (let reply of replies) {
        if (reply._id.toString() === replyId) {
          const likeIndex = reply.likes.findIndex(id => id.toString() === userId.toString());
          if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
            return { found: true, isLiked: false, likes: reply.likes.length };
          } else {
            reply.likes.push(userId);
            return { found: true, isLiked: true, likes: reply.likes.length };
          }
        }
        if (reply.replies && reply.replies.length > 0) {
          const result = toggleLike(reply.replies);
          if (result.found) return result;
        }
      }
      return { found: false };
    };

    const result = toggleLike(comment.replies);
    if (!result.found) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    await comment.save();

    res.json({
      message: 'Like toggled successfully',
      likes: result.likes,
      isLiked: result.isLiked
    });
  } catch (error) {
    console.error('Toggle reply like error:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

// Admin: Get all comments for a specific blog (including rejected)
exports.getBlogCommentsAdmin = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { limit = 1000, skip = 0 } = req.query;

    const comments = await Comment.find({
      blog: blogId
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Comment.countDocuments({ blog: blogId });

    res.json({
      comments,
      total,
      hasMore: total > parseInt(skip) + comments.length
    });
  } catch (error) {
    console.error('Get blog comments admin error:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Admin: Get all comments
exports.getAllComments = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const comments = await Comment.find(filter)
      .populate('blog', 'title slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Comment.countDocuments(filter);

    res.json({
      comments,
      total,
      hasMore: total > parseInt(skip) + comments.length
    });
  } catch (error) {
    console.error('Get all comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Admin: Update comment
exports.updateComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, blog: blogId },
      { content },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

// Admin: Update reply
exports.updateReply = async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const updateReplyContent = (replies) => {
      for (let reply of replies) {
        if (reply._id.toString() === replyId) {
          reply.content = content;
          return true;
        }
        if (reply.replies && reply.replies.length > 0) {
          if (updateReplyContent(reply.replies)) return true;
        }
      }
      return false;
    };

    if (!updateReplyContent(comment.replies)) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    await comment.save();

    res.json({
      message: 'Reply updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({ message: 'Failed to update reply', error: error.message });
  }
};

// Admin: Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    const comment = await Comment.findOneAndDelete({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

// Admin: Delete reply
exports.deleteReply = async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const deleteReplyById = (replies) => {
      for (let i = 0; i < replies.length; i++) {
        if (replies[i]._id.toString() === replyId) {
          replies.splice(i, 1);
          return true;
        }
        if (replies[i].replies && replies[i].replies.length > 0) {
          if (deleteReplyById(replies[i].replies)) return true;
        }
      }
      return false;
    };

    if (!deleteReplyById(comment.replies)) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    await comment.save();

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ message: 'Failed to delete reply', error: error.message });
  }
};

// Admin: Approve comment
exports.approveComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, blog: blogId },
      { status: 'approved' },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment approved successfully',
      comment
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ message: 'Failed to approve comment', error: error.message });
  }
};

// Admin: Reject comment
exports.rejectComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, blog: blogId },
      { status: 'rejected' },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment rejected successfully',
      comment
    });
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ message: 'Failed to reject comment', error: error.message });
  }
};

// Admin: Approve comment (restore if rejected)
exports.setPendingComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, blog: blogId },
      { status: 'approved' },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment approved successfully',
      comment
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ message: 'Failed to approve comment', error: error.message });
  }
};
