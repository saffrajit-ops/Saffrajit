'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCartWithAuth } from '@/lib/hooks/useCartWithAuth';

interface FeaturedProduct {
  _id: string;
  title?: string;
  slug?: string;
  price?: number;
  compareAtPrice?: number;
  images?: Array<{ url?: string; alt?: string; position?: number }>;
  description?: string;
  shortDescription?: string;
  category?: string;
  categories?: string[];
  stock?: number;
}

export default function FeaturedProducts() {
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [current, setCurrent] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // plugin ref (holds the plugin function object returned by Autoplay)
  const autoplayRef = useRef<any | null>(null);

  // Initialize plugin once client-side
  useEffect(() => {
    // Create plugin object — embla will call this plugin when it mounts
    autoplayRef.current = Autoplay({ delay: 4000, stopOnInteraction: true });

    return () => {
      // Attempt best-effort cleanup: plugin might have a destroy method
      try {
        // Some plugin variants expose destroy/play/stop — guard access
        autoplayRef.current?.destroy?.();
      } catch {
        // ignore errors during cleanup
      } finally {
        autoplayRef.current = null;
      }
    };
  }, []);

  const { addItem, isItemLoading } = useCartStore();
  const router = useRouter();

  // Set up cart authentication redirect
  useCartWithAuth();

  // Fetch featured products
  useEffect(() => {
    let cancelled = false;
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAllProducts({
          featured: true,
          limit: 10,
          sort: '-createdAt',
        });

        if (!cancelled && response?.success && response.data?.products) {
          setFeaturedProducts(response.data.products);
        }
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeaturedProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep track of selected index from carousel API
  useEffect(() => {
    if (!api) return;
    const update = () => {
      try {
        setCurrent(api.selectedScrollSnap());
      } catch {
        // ignore
      }
    };
    update();
    api.on('select', update);
    return () => {
      try {
        api.off('select', update);
      } catch {
        // ignore
      }
    };
  }, [api]);

  const formatPrice = (p?: number) => {
    const price = typeof p === 'number' ? p : 0;
    return `$${price.toFixed(2)}`;
  };

  // Safe play/stop helpers — only call when api is present (plugin attached)
  const safeAutoplayStop = () => {
    if (!api) return;
    try {
      // plugin should be attached when api exists
      autoplayRef.current?.stop?.();
    } catch {
      // ignore errors
    }
  };

  const safeAutoplayPlay = () => {
    if (!api) return;
    try {
      autoplayRef.current?.play?.();
    } catch {
      // ignore errors
    }
  };

  return (
    <section ref={ref} className="py-24 px-6 lg:px-12 bg-white">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-3 md:mb-4">
            BESTSELLERS
          </h2>
          <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900">
            Featured Products
          </h3>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="group">
                <Skeleton className="h-[350px] md:h-[400px] lg:h-[360px] w-full mb-4 md:mb-6" />
                <Skeleton className="h-3 w-24 mx-auto mb-2 md:mb-3" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-3 md:mb-4" />
                <div className="flex items-center justify-between gap-2 md:gap-3 px-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 md:h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured products available</p>
          </div>
        ) : (
          <div>
            <Carousel
              setApi={setApi}
              opts={{
                align: 'start',
                loop: featuredProducts.length > 1,
              }}
              // pass plugin only if initialized (we create it on mount)
              plugins={autoplayRef.current ? [autoplayRef.current] : []}
              className="w-full"
              // safe autoplay controls: only call when api exists (plugin attached)
              onMouseEnter={() => safeAutoplayStop()}
              onMouseLeave={() => safeAutoplayPlay()}
            >
              <CarouselContent className="-ml-4 md:-ml-8 lg:-ml-20">
                {featuredProducts.map((product, index) => {
                  const productImage =
                    product.images && product.images.length > 0
                      ? product.images[0]?.url || ''
                      : '';
                  const productCategory =
                    product.categories?.[0] || product.category || 'Uncategorized';
                  const price = typeof product.price === 'number' ? product.price : 0;
                  const compareAt =
                    typeof product.compareAtPrice === 'number'
                      ? product.compareAtPrice
                      : undefined;

                  const frontendProduct = {
                    id: product._id,
                    slug: product.slug,
                    name: product.title || 'Product',
                    category: productCategory,
                    price: `$${price.toFixed(2)}`,
                    image: productImage,
                    type: 'single',
                    subtitle: product.shortDescription || '',
                    images: (product.images || []).map((img) => img.url || ''),
                  };

                  return (
                    <CarouselItem
                      key={product._id || `product-${index}`}
                      className="pl-4 md:pl-8 lg:pl-20 basis-full md:basis-1/2 lg:basis-[28%]"
                    >
                      <div
                        onClick={() => {
                          if (product.slug) router.push(`/product/${product.slug}`);
                        }}
                        className="group cursor-pointer"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: index * 0.06,
                          }}
                        >
                          <div
                            className="relative h-[350px] md:h-[400px] lg:h-[360px] overflow-hidden bg-white flex items-center justify-center"
                            style={{
                              backgroundImage: 'url(/product_image_background.png)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.title || 'Product image'}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 p-4"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 md:mt-6">
                            <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-500 uppercase mb-2 md:mb-3 text-center">
                              {productCategory}
                            </p>

                            <h4 className="text-[10px] md:text-xs font-light tracking-[0.15em] text-gray-900 mb-3 md:mb-4 uppercase text-center px-2 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                              {product.title}
                            </h4>

                            <div className="flex items-center justify-between gap-2 md:gap-3 px-2">
                              <div className="flex items-baseline gap-2">
                                <p className="text-xs md:text-sm font-normal text-gray-900">
                                  {formatPrice(price)}
                                </p>
                                {compareAt !== undefined && compareAt > price && (
                                  <p className="text-xs text-gray-400 line-through">
                                    {formatPrice(compareAt)}
                                  </p>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await addItem(frontendProduct, 1);
                                  } catch (err) {
                                    console.error('Add to bag failed', err);
                                  }
                                }}
                                disabled={product.stock === 0 || isItemLoading(product._id)}
                                className="text-[9px] md:text-[10px] tracking-[0.15em] hover:bg-gray-900 hover:text-white transition-colors duration-300 rounded-none border-gray-900 h-7 md:h-8 px-3 md:px-4 font-light whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                aria-label={
                                  product.stock === 0
                                    ? 'Out of stock'
                                    : `Add ${product.title || 'product'} to bag`
                                }
                              >
                                {isItemLoading(product._id) ? (
                                  <>
                                    <Spinner className="w-3 h-3 md:w-4 md:h-4" />
                                    <span>ADDING...</span>
                                  </>
                                ) : product.stock === 0 ? (
                                  'OUT OF STOCK'
                                ) : (
                                  'ADD TO BAG'
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              {/* Navigation Controls */}
              {featuredProducts.length > 1 && (
                <div className="flex justify-center items-center gap-4 md:gap-6 mt-8 md:mt-12">
                  <button
                    onClick={() => api?.scrollPrev()}
                    className="text-gray-400 hover:text-gray-900 transition-colors duration-300"
                    aria-label="Previous products"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex gap-1.5 md:gap-2">
                    {featuredProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${index === current
                          ? 'w-6 md:w-8 bg-gray-900'
                          : 'w-1 md:w-1.5 bg-gray-300 hover:bg-gray-400'
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => api?.scrollNext()}
                    className="text-gray-400 hover:text-gray-900 transition-colors duration-300"
                    aria-label="Next products"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </Carousel>
          </div>
        )}

        {/* Always-visible 'View All Products' button */}
        <div className="text-center mt-12 md:mt-16">
          <Link href="/skincare">
            <Button
              size="lg"
              className="px-10 md:px-14 bg-gray-900 hover:bg-gray-800 text-white tracking-wider rounded-none font-light text-xs md:text-sm h-11 md:h-12"
            >
              VIEW ALL PRODUCTS
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
