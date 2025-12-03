const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['approved', 'rejected'],
        default: 'approved'
    }
}, {
    timestamps: true
});

const commentSchema = new mongoose.Schema({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [replySchema],
    status: {
        type: String,
        enum: ['approved', 'rejected'],
        default: 'approved'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
commentSchema.index({ blog: 1, status: 1, createdAt: -1 });
commentSchema.index({ 'author.email': 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
