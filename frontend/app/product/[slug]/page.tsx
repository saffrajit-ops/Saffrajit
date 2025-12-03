'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, ChevronsDown } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCartWithAuth } from '@/lib/hooks/useCartWithAuth';
import { productAPI, reviewAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';

// Backend product type
interface BackendProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  discount?: {
    value: number;
    type: "percentage" | "fixed";
  };
  shipping?: {
    charges: number;
    freeShippingThreshold: number;
    freeShippingMinQuantity: number;
  };
  images: Array<{ url: string; alt?: string; position?: number }>;
  description?: string;
  shortDescription?: string;
  benefits?: string[];
  howToApply?: string;
  ingredientsText?: string;
  ratingAvg?: number;
  ratingCount?: number;
  categories?: string[];
  collection?: string;
  type?: string;
  relatedProductIds?: Array<{
    _id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
    slug: string;
    ratingAvg?: number;
  }>;
  stock?: number;
  isActive?: boolean;
  cashOnDelivery?: {
    enabled: boolean;
  };
  returnPolicy?: {
    returnable: boolean;
    returnWindowDays: number;
  };
}

// Frontend product type for cart
interface FrontendProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  image: string;
  type: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  cashOnDelivery?: {
    enabled: boolean;
  };
  returnPolicy?: {
    returnable: boolean;
    returnWindowDays: number;
  };
}

// Review type
interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  isVerifiedBuyer?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// Short Description Component with scroll and expand
function ShortDescriptionSection({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);

  // Convert plain text with \n to HTML if needed
  const formatContent = (text: string) => {
    if (!text) return '';

    // Check if content is already HTML (contains HTML tags)
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return text;
    }

    // Handle multiple types of newline representations
    // This handles both literal "\n" strings and actual newline characters
    let normalizedText = text
      // First, handle escaped backslashes (\\n becomes \n)
      .replace(/\\\\n/g, '|||NEWLINE|||')
      // Then handle literal \n (the two-character sequence)
      .replace(/\\n/g, '\n')
      // Restore double-escaped if any
      .replace(/\|\|\|NEWLINE\|\|\|/g, '\n')
      // Handle other newline types
      .replace(/\\r\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Split by newlines and create paragraphs
    const paragraphs = normalizedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');

    return paragraphs || '<p>No description available</p>';
  };

  const formattedContent = formatContent(content);

  useEffect(() => {
    // Check if content is long enough to need scrolling
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedContent;
    const textLength = tempDiv.textContent?.length || 0;
    setShowExpandButton(textLength > 150);
  }, [formattedContent]);

  return (
    <div className="mb-6">
      <div
        className={`relative ${!isExpanded && showExpandButton ? 'max-h-[100px]' : isExpanded ? 'max-h-[300px]' : ''
          } ${showExpandButton ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}
      >
        <div
          className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none pr-2"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        {!isExpanded && showExpandButton && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mt-2 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronsDown className="w-4 h-4" />
              <span>View more</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<BackendProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDescription, setShowDescription] = useState(true);
  const { addItem, isItemLoading } = useCartStore();

  // Set up cart authentication redirect
  useCartWithAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productAPI.getProductBySlug(params.slug);

        if (response.success && response.data) {
          const productData = response.data;
          setProduct(productData);
          
          // Track product view
          if (typeof window !== 'undefined') {
            try {
              const { trackProductView } = await import('@/lib/user-tracking');
              trackProductView(
                productData._id,
                productData.title,
                productData.categories?.[0] || productData.collection
              );
            } catch (err) {
              console.error('Failed to track product view:', err);
            }
          }

          // Fetch reviews for this product
          fetchReviews(productData._id);

          // Fetch related products from the same category (3 latest)
          if (productData.categories && productData.categories.length > 0) {
            try {
              const categoryResponse = await productAPI.getProductsByCategory(
                productData.categories[0],
                {
                  page: 1,
                  limit: 4, // Fetch 4 to exclude current product
                  sort: '-createdAt'
                }
              );
              if (categoryResponse.success && categoryResponse.data?.products) {
                // Filter out current product and limit to 3
                const filtered = categoryResponse.data.products
                  .filter((p: BackendProduct) => p._id !== productData._id)
                  .slice(0, 3);
                setRelatedProducts(filtered);
              }
            } catch (err) {
              console.error('Failed to fetch related products:', err);
            }
          }
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.slug]);

  // Fetch reviews for product
  const fetchReviews = async (productId: string) => {
    try {
      setReviewsLoading(true);
      const response = await reviewAPI.getReviewsByProduct(productId, {
        page: 1,
        limit: 50,
        sort: '-createdAt',
      });
      if (response.success && response.data?.reviews) {
        setReviews(response.data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (reviewData: { rating: number; title?: string; comment: string }) => {
    if (!product) return;

    const response = await reviewAPI.createReview({
      productId: product._id,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
    });

    if (response.success) {
      // Refresh reviews
      await fetchReviews(product._id);
      // Refresh product to update rating
      const productResponse = await productAPI.getProductBySlug(product.slug);
      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
      }
    }
  };

  const handleAddToRelatedCart = async (frontendProduct: FrontendProduct) => {
    await addItem(frontendProduct, 1);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Convert backend product to frontend format for cart
    const frontendProduct: FrontendProduct = {
      id: product._id,
      slug: product.slug,
      name: product.title,
      category: product.categories?.[0] || product.collection || 'Uncategorized',
      price: `${product.price.toFixed(2)}`,
      image: product.images?.[0]?.url || '/images/placeholder-product.png',
      type: product.type || 'single',
      subtitle: product.shortDescription,
      rating: product.ratingAvg,
      reviewCount: product.ratingCount,
      images: product.images?.map(img => img.url) || [],
      cashOnDelivery: product.cashOnDelivery,
      returnPolicy: product.returnPolicy,
    };

    // Add item with quantity (backend will increment if already exists)
    await addItem(frontendProduct, quantity);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="border-b border-gray-200">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-4">
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <section className="py-8 md:py-12 lg:py-16 px-6 lg:px-12">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <div className="space-y-4">
                <Skeleton className="h-[500px] md:h-[600px] lg:h-[700px]" />
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 md:h-32" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/skincare')} variant="outline">
            Back to Products
          </Button>
        </div>
      </main>
    );
  }

  const productImages = product.images?.map(img => img.url) || [];
  const mainImage = productImages[selectedImage] || productImages[0] || '';
  const category = product.categories?.[0] || product.collection || 'Uncategorized';

  // Calculate final price with discount
  const calculateFinalPrice = () => {
    if (!product.discount || product.discount.value <= 0) {
      return product.price;
    }

    if (product.discount.type === "percentage") {
      const discountAmount = (product.price * product.discount.value) / 100;
      return Math.max(0, product.price - discountAmount);
    } else {
      return Math.max(0, product.price - product.discount.value);
    }
  };

  const finalPrice = calculateFinalPrice();
  const hasDiscount = product.discount && product.discount.value > 0;

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center gap-2 text-xs tracking-wider text-gray-500">
            <Link href="/" className="hover:text-gray-900">HOME</Link>
            <span>/</span>
            <Link href="/skincare" className="hover:text-gray-900">COLLECTIONS</Link>
            <span>/</span>
            <span className="text-gray-900 uppercase">{category}</span>
          </div>
        </div>
      </div>

      <section className="py-8 md:py-12 lg:py-16 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="space-y-4">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-white flex items-center justify-center"
                style={{ backgroundImage: 'url(/product_image_background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-full object-contain p-4 md:p-6 lg:p-8"
                />
              </motion.div>

              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {productImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-24 md:h-32 bg-white border-2 transition-all flex items-center justify-center ${selectedImage === index ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                        }`}
                      style={{ backgroundImage: 'url(/product_image_background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                      <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-contain p-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-xs tracking-[0.3em] text-gray-600 mb-3">{category.toUpperCase()}</p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-3">
                  {product.title}
                </h1>
                {product.shortDescription && (
                  <ShortDescriptionSection content={product.shortDescription} />
                )}

                {(product.ratingAvg || product.ratingCount) && (
                  <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.ratingAvg || 0)
                            ? 'fill-gray-900 text-gray-900'
                            : i < (product.ratingAvg || 0)
                              ? 'fill-gray-900 text-gray-900 opacity-50'
                              : 'fill-none text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.ratingAvg?.toFixed(1) || '0.0'} ({product.ratingCount || 0})
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <div className="flex items-baseline gap-3">
                    {hasDiscount ? (
                      <>
                        <p className="text-3xl md:text-4xl font-light text-gray-900">
                          ${finalPrice.toFixed(2)}
                        </p>
                        <p className="text-xl text-gray-400 line-through">
                          ${product.price.toFixed(2)}
                        </p>
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                          {product.discount?.type === "percentage"
                            ? `-${product.discount?.value}%`
                            : `-$${product.discount?.value.toFixed(2)}`
                          }
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl md:text-4xl font-light text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <p className="text-xl text-gray-400 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {product.stock !== undefined && product.stock <= 0 && (
                    <p className="text-sm text-red-600 mt-2">Out of Stock</p>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-xs tracking-wider text-gray-600 mb-3">QUANTITY</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 text-sm">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={product.stock !== undefined && quantity >= product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {product.stock !== undefined && product.stock <= 2 && product.stock > 0 && (
                    <p className="text-xs text-orange-600 mt-2">
                      Only {product.stock} {product.stock === 1 ? 'item' : 'items'} left in stock
                    </p>
                  )}
                </div>

                <div className="mb-8">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || product.stock === undefined || isItemLoading(product._id)}
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white text-sm tracking-[0.15em] rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isItemLoading(product._id) ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        <span>ADDING...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {product.shipping && product.shipping.charges > 0 ? (
                    <>
                      <p className="flex items-center gap-2">
                        <span className="w-4 h-4">📦</span>
                        Shipping: ${product.shipping.charges.toFixed(2)}
                      </p>
                      {(product.shipping.freeShippingThreshold > 0 || product.shipping.freeShippingMinQuantity > 0) && (
                        <div className="ml-6 space-y-1 text-xs text-green-600">
                          {product.shipping.freeShippingThreshold > 0 && (
                            <p>✓ Free shipping on orders over ${product.shipping.freeShippingThreshold.toFixed(2)}</p>
                          )}
                          {product.shipping.freeShippingMinQuantity > 0 && (
                            <p>✓ Free shipping when you buy {product.shipping.freeShippingMinQuantity}+ items</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="flex items-center gap-2">
                      <span className="w-4 h-4">📦</span>
                      Complimentary shipping
                    </p>
                  )}
                  {product.cashOnDelivery?.enabled ? (
                    <p className="flex items-center gap-2 text-green-600">
                      <span className="w-4 h-4">💵</span>
                      Cash on Delivery available
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-red-600">
                      <span className="w-4 h-4">❌</span>
                      Cash on Delivery not available
                    </p>
                  )}

                  {product.returnPolicy?.returnable !== false && (
                    <p className="flex items-center gap-2 text-blue-600">
                      <span className="w-4 h-4">↩️</span>
                      {product.returnPolicy?.returnWindowDays
                        ? `${product.returnPolicy.returnWindowDays}-day return policy`
                        : "Non-returnable"}
                    </p>

                  )}
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4">🎁</span>
                    3-Day Trial Set with each order
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 px-6 lg:px-12 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="border-b border-gray-200">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full py-6 flex items-center justify-between text-left"
            >
              <span className="text-sm tracking-[0.15em] text-gray-900">DESCRIPTION</span>
              {showDescription ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showDescription && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pb-6"
              >
                {product.description && (
                  <div
                    className="text-sm text-gray-600 leading-relaxed mb-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: /<[a-z][\s\S]*>/i.test(product.description)
                        ? product.description
                        : product.description
                          .replace(/\\n/g, '\n')
                          .replace(/\\r\\n/g, '\n')
                          .replace(/\r\n/g, '\n')
                          .replace(/\r/g, '\n')
                          .split('\n')
                          .map(line => line.trim())
                          .filter(line => line.length > 0)
                          .map(line => `<p>${line}</p>`)
                          .join('')
                    }}
                  />
                )}
                {product.benefits && product.benefits.length > 0 && (
                  <ul className="space-y-2">
                    {product.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Only show reviews section if there are reviews or if loading */}
      {(reviewsLoading || (reviews && reviews.length > 0) || (product.ratingCount && product.ratingCount > 0)) && (
        <ProductReviews
          productId={product._id}
          ratingAvg={product.ratingAvg}
          ratingCount={product.ratingCount}
        />
      )}

      {/* Only show related products if there are any */}
      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProducts
          products={relatedProducts}
          onAddToCart={handleAddToRelatedCart}
          isItemLoading={isItemLoading}
        />
      )}
    </main>
  );
}
