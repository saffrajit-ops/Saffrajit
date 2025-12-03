'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart, MessageCircle, Send, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface CommentAuthor {
  name: string;
  email: string;
  userId?: string;
}

interface Reply {
  _id: string;
  content: string;
  author: CommentAuthor;
  likes: string[];
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: CommentAuthor;
  blog: {
    _id: string;
    title: string;
  };
  likes: string[];
  replies: Reply[];
  createdAt: string;
  status: 'approved' | 'rejected';
}

interface CommentSystemProps {
  blogId: string;
  comments: Comment[];
  currentUserId?: string;
  onRefresh: () => void;
}

const ReplyItem = ({
  reply,
  commentId,
  blogId,
  currentUserId,
  onLike,
  onReply
}: {
  reply: Reply;
  commentId: string;
  blogId: string;
  currentUserId?: string;
  onLike: (replyId: string) => Promise<void>;
  onReply: (replyId: string, content: string) => Promise<void>;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLoginRedirect = () => {
    const currentUrl = `${pathname}#comments`;
    router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      await onLike(reply._id);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleReply = async () => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    if (!replyContent.trim()) return;
    try {
      await onReply(reply._id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
      toast.success('Reply posted successfully!');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const isLiked = currentUserId && reply.likes.includes(currentUserId);

  return (
    <div className="ml-12 mt-4 border-l-2 border-amber-100 pl-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {reply.author.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1">
          <div className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {reply.author.name}
              </span>
              <span className="text-xs text-gray-500">
                {getTimeAgo(reply.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-800">{reply.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {reply.likes.length > 0 && <span>{reply.likes.length}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentItem = ({
  comment,
  blogId,
  currentUserId,
  onRefresh
}: {
  comment: Comment;
  blogId: string;
  currentUserId?: string;
  onRefresh: () => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, token } = useAuthStore();
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLoginRedirect = () => {
    const currentUrl = `${pathname}#comments`;
    router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments/${comment._id}/like`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onRefresh();
      } else {
        toast.error('Failed to like comment');
      }
    } catch (error) {
      toast.error('Failed to like comment');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleReply = async () => {
    if (!isAuthenticated || !user) {
      handleLoginRedirect();
      return;
    }
    if (!replyContent.trim()) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments/${comment._id}/replies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          author: {
            name: user.name || user.email,
            email: user.email
          }
        })
      });
      if (response.ok) {
        setReplyContent('');
        setIsReplying(false);
        setShowReplies(true);
        onRefresh();
        toast.success('Reply posted successfully!');
      } else {
        toast.error('Failed to post reply');
      }
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleReplyLike = async (replyId: string) => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments/${comment._id}/replies/${replyId}/like`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        onRefresh();
      } else {
        toast.error('Failed to like reply');
      }
    } catch (error) {
      toast.error('Failed to like reply');
    }
  };

  const handleNestedReply = async (parentReplyId: string, content: string) => {
    if (!isAuthenticated || !user) {
      handleLoginRedirect();
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments/${comment._id}/replies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          author: {
            name: user.name || user.email,
            email: user.email
          },
          parentReplyId
        })
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to add nested reply:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const isLiked = currentUserId && comment.likes.includes(currentUserId);

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {comment.author.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">{comment.author.name}</h4>
            <span className="text-sm text-gray-500">{getTimeAgo(comment.createdAt)}</span>
          </div>

          <p className="text-gray-800 mb-4 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes.length > 0 ? comment.likes.length : 'Like'}</span>
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </button>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mb-4 flex gap-3">
              <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-4 py-2 text-sm border border-amber-200 rounded-full focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="border-t border-amber-100 pt-4">
              {comment.replies.map((reply) => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  commentId={comment._id}
                  blogId={blogId}
                  currentUserId={currentUserId}
                  onLike={handleReplyLike}
                  onReply={handleNestedReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CommentSystem({
  blogId,
  comments,
  currentUserId,
  onRefresh
}: CommentSystemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, token } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const handleLoginRedirect = () => {
    const currentUrl = `${pathname}#comments`;
    router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      handleLoginRedirect();
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (response.ok) {
        setNewComment('');
        onRefresh();
        toast.success('Comment posted successfully!');
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show only 2 most recent comments initially
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);
  const hasMoreComments = comments.length > 2;

  return (
    <div id="comments" className="max-w-4xl mx-auto py-12 px-6">
      <h2 className="text-3xl font-serif mb-8 text-gray-900">
        Comments ({comments.length})
      </h2>

      {/* New Comment Form */}
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmitComment} className="mb-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Leave a Comment</h3>
              <p className="text-sm text-gray-600">Commenting as {user.name || user.email}</p>
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            required
            rows={4}
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 resize-none mb-4 bg-white"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Login to Comment</h3>
          <p className="text-gray-600 mb-6">
            You need to be logged in to leave a comment on this blog post.
          </p>
          <button
            onClick={handleLoginRedirect}
            className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors inline-flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Login to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <>
          <div className="space-y-6">
            {displayedComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                blogId={blogId}
                currentUserId={currentUserId}
                onRefresh={onRefresh}
              />
            ))}
          </div>

          {/* Show All Comments Button */}
          {hasMoreComments && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="px-6 py-3 bg-white border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white font-medium transition-colors inline-flex items-center gap-2"
              >
                {showAllComments ? (
                  <>
                    <ChevronUp className="w-5 h-5" />
                    Show Less Comments
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-5 h-5" />
                    View All {comments.length} Comments
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-amber-50 rounded-xl border-2 border-amber-100">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-amber-600 opacity-50" />
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
