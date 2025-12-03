# Reviews API

## Overview
Product review and rating system with comments, replies, and moderation features.

## Public Endpoints

### Get Reviews by Product
Retrieve reviews for a specific product.

**Endpoint:** `GET /api/reviews/product/{productId}`
**Authentication:** None required

#### Query Parameters
```
page=1               // Page number (default: 1)
limit=10             // Items per page (default: 10, max: 50)
sort=-createdAt      // Sort: -createdAt, createdAt, -rating, rating, helpful
rating=5             // Filter by rating (1-5)
verifiedOnly=true    // Show only verified purchase reviews
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "profileImage": "https://...",
          "isVerifiedPurchase": true
        },
        "product": {
          "_id": "product_id",
          "title": "Premium Face Cream",
          "slug": "premium-face-cream"
        },
        "rating": 5,
        "title": "Amazing product!",
        "comment": "This product exceeded my expectations...",
        "images": [
          {
            "_id": "image_id",
            "url": "https://...",
            "caption": "After 2 weeks of use"
          }
        ],
        "helpful": {
          "likes": 15,
          "dislikes": 2,
          "userReaction": null
        },
        "verified": true,
        "isEdited": false,
        "comments": [
          {
            "_id": "comment_id",
            "user": {
              "_id": "user_id",
              "name": "Jane Smith"
            },
            "comment": "Thanks for the detailed review!",
            "parentCommentId": null,
            "replies": [
              {
                "_id": "reply_id",
                "user": {
                  "_id": "user_id",
                  "name": "John Doe"
                },
                "comment": "You're welcome!",
                "parentCommentId": "comment_id",
                "createdAt": "2024-01-02T12:00:00.000Z"
              }
            ],
            "createdAt": "2024-01-02T10:00:00.000Z"
          }
        ],
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReviews": 47,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "summary": {
      "averageRating": 4.6,
      "totalReviews": 47,
      "ratingDistribution": {
        "5": 28,
        "4": 12,
        "3": 5,
        "2": 1,
        "1": 1
      },
      "verifiedReviewsCount": 35
    }
  }
}
```

---

### Get Reviews by User
Retrieve reviews written by a specific user.

**Endpoint:** `GET /api/reviews/user/{userId}`
**Authentication:** None required

#### Query Parameters
```
page=1          // Page number
limit=10        // Items per page
sort=-createdAt // Sort options
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "product": {
          "_id": "product_id",
          "title": "Premium Face Cream",
          "slug": "premium-face-cream",
          "images": [...]
        },
        "rating": 5,
        "title": "Great product",
        "comment": "Really satisfied with this purchase...",
        "helpful": {
          "likes": 8,
          "dislikes": 0
        },
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {...},
    "userStats": {
      "totalReviews": 12,
      "averageRating": 4.3,
      "helpfulVotes": 45,
      "verifiedReviews": 10
    }
  }
}
```

---

### Get Review by ID
Retrieve single review with full details.

**Endpoint:** `GET /api/reviews/{reviewId}`
**Authentication:** None required

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "user": {...},
    "product": {...},
    "rating": 5,
    "title": "Amazing product!",
    "comment": "Full review text...",
    "images": [...],
    "helpful": {...},
    "comments": [...],
    "verified": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

## Authenticated Endpoints

### Create Review
Submit a new product review.

**Endpoint:** `POST /api/reviews`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "productId": "product_id",                    // Required
  "rating": 5,                                  // Required: 1-5
  "title": "Amazing product!",                  // Required: 5-100 characters
  "comment": "This product exceeded my expectations..." // Required: 10-2000 characters
}
```

#### Validation Rules
- User can only review each product once
- User must have purchased the product (for verified reviews)
- Rating must be between 1-5
- Title: 5-100 characters
- Comment: 10-2000 characters

#### Success Response (201)
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "_id": "new_review_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe"
    },
    "product": {
      "_id": "product_id",
      "title": "Premium Face Cream"
    },
    "rating": 5,
    "title": "Amazing product!",
    "comment": "This product exceeded my expectations...",
    "verified": true,
    "helpful": {
      "likes": 0,
      "dislikes": 0,
      "userReaction": null
    },
    "comments": [],
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### Error Responses
```json
// 409 - Already Reviewed
{
  "success": false,
  "message": "You have already reviewed this product",
  "error": {
    "existingReviewId": "existing_review_id"
  }
}

// 403 - Not Purchased
{
  "success": false,
  "message": "You must purchase this product before reviewing",
  "error": {
    "reason": "no_purchase_found"
  }
}
```

---

### Update Review
Update user's existing review.

**Endpoint:** `PUT /api/reviews/{reviewId}`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "rating": 4,                                  // Optional: 1-5
  "title": "Updated: Great product",            // Optional: 5-100 characters
  "comment": "After using for longer period..." // Optional: 10-2000 characters
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "_id": "review_id",
    // ... updated review object
    "isEdited": true,
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Error Responses
```json
// 403 - Not Review Owner
{
  "success": false,
  "message": "You can only update your own reviews"
}

// 400 - Edit Window Expired
{
  "success": false,
  "message": "Review edit window has expired",
  "error": {
    "editDeadline": "2024-01-08T10:00:00.000Z",
    "editWindowDays": 7
  }
}
```

---

### Delete Review
Delete user's review.

**Endpoint:** `DELETE /api/reviews/{reviewId}`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### Add Comment to Review
Add a comment to a review.

**Endpoint:** `POST /api/reviews/{reviewId}/comments`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "comment": "Thank you for the detailed review!",  // Required: 1-500 characters
  "parentCommentId": "comment_id"                   // Optional: for replies
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "review": {
      "_id": "review_id",
      "comments": [
        {
          "_id": "new_comment_id",
          "user": {
            "_id": "user_id",
            "name": "Jane Smith"
          },
          "comment": "Thank you for the detailed review!",
          "parentCommentId": null,
          "replies": [],
          "createdAt": "2024-01-02T10:00:00.000Z"
        }
      ]
    }
  }
}
```

---

### Delete Comment
Delete a comment (own comments only).

**Endpoint:** `DELETE /api/reviews/{reviewId}/comments/{commentId}`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "review": {
      "_id": "review_id",
      "comments": [
        // ... remaining comments
      ]
    }
  }
}
```

---

### React Review Helpful
Mark review as helpful or not helpful.

**Endpoint:** `POST /api/reviews/{reviewId}/helpful`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "reaction": "like"    // Required: "like" or "dislike"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Reaction recorded successfully",
  "data": {
    "helpful": {
      "likes": 16,
      "dislikes": 2,
      "userReaction": "like"
    }
  }
}
```

## Frontend Integration Examples

### React Reviews Hook
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});
  const { accessToken } = useAuth();

  const fetchReviews = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/reviews/product/${productId}?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data.reviews);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData) => {
    if (!accessToken) throw new Error('Authentication required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ ...reviewData, productId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => [data.data, ...prev]);
        setSummary(prev => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          averageRating: calculateNewAverage(prev, data.data.rating)
        }));
        return data.data;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId, updates) => {
    if (!accessToken) throw new Error('Authentication required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => 
          prev.map(review => 
            review._id === reviewId ? data.data : review
          )
        );
        return data.data;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!accessToken) throw new Error('Authentication required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => prev.filter(review => review._id !== reviewId));
        setSummary(prev => ({
          ...prev,
          totalReviews: prev.totalReviews - 1
        }));
        return true;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (reviewId, commentData) => {
    if (!accessToken) throw new Error('Authentication required');
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(commentData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => 
          prev.map(review => 
            review._id === reviewId ? data.data.review : review
          )
        );
        return data.data.review;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const reactToReview = async (reviewId, reaction) => {
    if (!accessToken) throw new Error('Authentication required');
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ reaction })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => 
          prev.map(review => 
            review._id === reviewId 
              ? { ...review, helpful: data.data.helpful }
              : review
          )
        );
        return data.data.helpful;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const calculateNewAverage = (summary, newRating) => {
    const totalRatings = summary.totalReviews * summary.averageRating;
    return (totalRatings + newRating) / (summary.totalReviews + 1);
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  return {
    reviews,
    loading,
    error,
    pagination,
    summary,
    createReview,
    updateReview,
    deleteReview,
    addComment,
    reactToReview,
    fetchReviews
  };
};
```

### Review Component Example
```javascript
import React, { useState } from 'react';
import { useReviews } from './useReviews';
import { useAuth } from './useAuth';

const ReviewsSection = ({ productId }) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const {
    reviews,
    loading,
    error,
    summary,
    createReview,
    reactToReview,
    addComment
  } = useReviews(productId);
  
  const { user } = useAuth();

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await createReview(newReview);
      setNewReview({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
    } catch (err) {
      console.error('Failed to submit review:', err.message);
    }
  };

  const handleReaction = async (reviewId, reaction) => {
    try {
      await reactToReview(reviewId, reaction);
    } catch (err) {
      console.error('Failed to react to review:', err.message);
    }
  };

  return (
    <div className="reviews-section">
      {/* Review Summary */}
      <div className="review-summary">
        <h3>Customer Reviews</h3>
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{summary.averageRating?.toFixed(1)}</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={star <= Math.round(summary.averageRating) ? 'star filled' : 'star'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="review-count">({summary.totalReviews} reviews)</span>
          </div>
          
          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="rating-bar">
                <span>{rating} ★</span>
                <div className="bar">
                  <div 
                    className="fill"
                    style={{ 
                      width: `${(summary.ratingDistribution?.[rating] || 0) / summary.totalReviews * 100}%` 
                    }}
                  />
                </div>
                <span>{summary.ratingDistribution?.[rating] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {user && (
        <div className="write-review">
          <button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="write-review-btn"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  className={star <= newReview.rating ? 'star filled' : 'star'}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your review"
              required
              minLength={5}
              maxLength={100}
            />
          </div>
          
          <div className="form-group">
            <label>Review</label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Write your review here..."
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowReviewForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading && <div>Loading reviews...</div>}
        {error && <div className="error">Error: {error}</div>}
        
        {reviews.map(review => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <img 
                  src={review.user.profileImage || '/default-avatar.png'} 
                  alt={review.user.name}
                  className="reviewer-avatar"
                />
                <div>
                  <span className="reviewer-name">{review.user.name}</span>
                  {review.verified && (
                    <span className="verified-badge">Verified Purchase</span>
                  )}
                </div>
              </div>
              
              <div className="review-meta">
                <div className="rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={star <= review.rating ? 'star filled' : 'star'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="review-content">
              <h4 className="review-title">{review.title}</h4>
              <p className="review-comment">{review.comment}</p>
              
              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map(image => (
                    <img
                      key={image._id}
                      src={image.url}
                      alt={image.caption || 'Review image'}
                      className="review-image"
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="review-actions">
              <button
                onClick={() => handleReaction(review._id, 'like')}
                className={`helpful-btn ${review.helpful.userReaction === 'like' ? 'active' : ''}`}
              >
                👍 Helpful ({review.helpful.likes})
              </button>
              
              <button
                onClick={() => handleReaction(review._id, 'dislike')}
                className={`helpful-btn ${review.helpful.userReaction === 'dislike' ? 'active' : ''}`}
              >
                👎 Not Helpful ({review.helpful.dislikes})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
```

## Review Features
- **Verified Purchase Reviews**: Mark reviews from confirmed buyers
- **Helpful Voting**: Users can vote on review helpfulness
- **Review Comments**: Discussion threads on reviews
- **Image Uploads**: Users can attach photos to reviews
- **Edit Window**: Time-limited editing capability
- **Moderation Tools**: Admin review management
- **Rating Statistics**: Comprehensive review analytics
