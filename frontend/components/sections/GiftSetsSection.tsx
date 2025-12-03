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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCartWithAuth } from '@/lib/hooks/useCartWithAuth';

interface ProductItem {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: Array<{ url: string; alt?: string }>;
  stock?: number;
}

export default function ProductCollectionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const autoplayRef = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  const { addItem, isItemLoading } = useCartStore();
  const router = useRouter();
  
  // Set up cart authentication redirect
  useCartWithAuth();

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAllProducts({
          limit: 10,
          sort: '-createdAt',
        });
        if (response.success && response.data?.products) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section ref={ref} className="py-24 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-4">PURE WELLNESS</h2>
          <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900">Our Collections</h3>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group">
                <Skeleton className="h-[400px] md:h-[450px] lg:h-[400px] w-full mb-6 md:mb-8" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-4 md:mb-5" />
                <div className="flex items-center justify-between gap-3 px-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 md:h-9 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available</p>
          </div>
        ) : (
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: products.length > 1,
            }}
            plugins={[autoplayRef.current]}
            className="w-full"
            onMouseEnter={() => autoplayRef.current?.stop()}
            onMouseLeave={() => autoplayRef.current?.play()}
          >
            <CarouselContent className="-ml-4 md:-ml-8 lg:-ml-20">
              {products.map((product, index) => {
                const frontendProduct = {
                  id: product._id,
                  slug: product.slug,
                  name: product.title,
                  price: `$${product.price.toFixed(2)}`,
                  image: product.images?.[0]?.url || '',
                  type: 'product',
                  images: product.images?.map(img => img.url) || [],
                };

                return (
                  <CarouselItem
                    key={product._id}
                    className="pl-4 md:pl-8 lg:pl-20 basis-full md:basis-1/2 lg:basis-[28%]"
                  >
                    <motion.div
                      className="group cursor-pointer"
                      initial={{ opacity: 0, y: 30 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                      }}
                      onClick={() => router.push(`/product/${product.slug}`)}
                    >
                      <div className="relative h-[400px] md:h-[450px] lg:h-[400px] overflow-hidden bg-white flex items-center justify-center" style={{ backgroundImage: 'url(/product_image_background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 p-4"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-6 md:mt-8">
                        <h4 className="text-xs md:text-sm font-light tracking-[0.15em] text-gray-900 mb-4 md:mb-5 uppercase text-center px-2 min-h-[40px] md:min-h-[48px] flex items-center justify-center">
                          {product.title}
                        </h4>
                        <div className="flex items-center justify-between gap-3 px-2">
                          <p className="text-sm md:text-base font-normal text-gray-900">${product.price.toFixed(2)}</p>
                          <Button
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await addItem(frontendProduct, 1);
                            }}
                            disabled={product.stock === 0 || isItemLoading(product._id)}
                            className="text-[10px] md:text-xs tracking-[0.15em] hover:bg-gray-900 hover:text-white transition-colors duration-300 rounded-none border-gray-900 h-8 md:h-9 px-4 md:px-5 font-light whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isItemLoading(product._id) ? (
                              <>
                                <Spinner className="w-3 h-3" />
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
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {products.length > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12 md:mt-16">
                <button
                  onClick={() => api?.scrollPrev()}
                  className="text-gray-400 hover:text-gray-900 transition-colors duration-300"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div className="flex gap-2">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => api?.scrollTo(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${index === current
                        ? 'w-8 bg-gray-900'
                        : 'w-1.5 bg-gray-300 hover:bg-gray-400'
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
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            )}
          </Carousel>
        )}

        <motion.div
          className="text-center mt-16 md:mt-20"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Link href="/products">
            <Button
              size="lg"
              className="px-10 md:px-14 bg-gray-900 hover:bg-gray-800 text-white tracking-wider rounded-none font-light text-xs md:text-sm h-11 md:h-12"
            >
              VIEW ALL PRODUCTS
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
