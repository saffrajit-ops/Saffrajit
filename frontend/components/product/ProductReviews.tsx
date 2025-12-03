'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api/client';
import { toast } from 'sonner';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  ratingAvg?: number;
  ratingCount?: number;
}

export default function ProductReviews({
  productId,
  ratingAvg,
  ratingCount,
}: ProductReviewsProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await orderAPI.getProductReviews(productId, { limit: 20 });
      if (response.success) {
        setReviews(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitReview = async () => {
    // Note: This will be handled from orders page after delivery
    // This is just a placeholder for the UI
    toast.info('You can only review products after they are delivered. Check your orders page!');
    setShowReviewForm(false);
  };

  return (
    <section className="py-16 md:py-20 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-xs tracking-[0.3em] text-gray-600 mb-4">RATING & REVIEWS</h2>
          {(ratingAvg || ratingCount) && (
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-5xl font-light text-gray-900">{ratingAvg?.toFixed(1) || '0.0'}</span>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(ratingAvg || 0)
                          ? 'fill-gray-900 text-gray-900'
                          : i < (ratingAvg || 0)
                          ? 'fill-gray-900 text-gray-900 opacity-50'
                          : 'fill-none text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Based on {ratingCount || 0} reviews</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-8 border border-gray-200 mb-8"
            >
              {(
                <>
                  <h3 className="text-sm tracking-[0.15em] text-gray-900 mb-6">WRITE A REVIEW</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs tracking-wider text-gray-600 mb-2 block">RATING</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                rating <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-none text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs tracking-wider text-gray-600 mb-2 block">REVIEW</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        className="rounded-none border-gray-300 focus:border-gray-900 min-h-[120px]"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewComment.length}/1000 characters
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      <p className="text-sm text-blue-800">
                        💡 You can only review products after they are delivered. Please check your orders page to write reviews for delivered products.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => router.push('/profile/orders')}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-none text-xs tracking-wider"
                      >
                        GO TO MY ORDERS
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewRating(0);
                          setReviewComment('');
                        }}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wider"
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {reviewsLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">No reviews yet. Be the first to review this product!</p>
              <p className="text-sm text-gray-500 mb-4">Purchase this product and write a review after delivery</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Reviews List */}
              {reviews.map((review, index) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white p-6 md:p-8 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {getInitials(review.user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600 font-medium">✓ Verified Purchase</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
