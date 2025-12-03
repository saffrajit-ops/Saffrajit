'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCartWithAuth } from '@/lib/hooks/useCartWithAuth';
import { productAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

const priceRanges = ['All Prices', 'Under $600', '$600 - $800', '$800 - $1000', 'Over $1000'];

interface GiftSetProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{ url: string; alt?: string; position?: number }>;
  description?: string;
  shortDescription?: string;
  stock?: number;
}

export default function GiftsPage() {
  const [giftSets, setGiftSets] = useState<GiftSetProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState('All Prices');
  const { addItem, isItemLoading } = useCartStore();

  // Set up cart authentication redirect
  useCartWithAuth();

  // Fetch gift sets from API
  useEffect(() => {
    const fetchGiftSets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productAPI.getAllProducts({
          category: 'Gift Sets',
          limit: 1000,
          sort: '-createdAt',
        });
        if (response.success && response.data?.products) {
          setGiftSets(response.data.products);
        } else {
          setError('Failed to load gift sets');
        }
      } catch (err: any) {
        console.error('Failed to fetch gift sets:', err);
        setError(err.response?.data?.message || 'Failed to load gift sets');
      } finally {
        setLoading(false);
      }
    };
    fetchGiftSets();
  }, []);

  const filteredProducts = useMemo(() => {
    return giftSets.filter((product) => {
      if (selectedPrice !== 'All Prices') {
        const price = product.price;
        if (selectedPrice === 'Under $600') return price < 600;
        else if (selectedPrice === '$600 - $800') return price >= 600 && price <= 800;
        else if (selectedPrice === '$800 - $1000') return price >= 800 && price <= 1000;
        else if (selectedPrice === 'Over $1000') return price > 1000;
      }
      return true;
    });
  }, [giftSets, selectedPrice]);

  // Convert backend product to frontend format
  const convertToFrontendProduct = (product: GiftSetProduct) => {
    return {
      id: product._id,
      slug: product.slug,
      name: product.title,
      category: 'Gift Sets',
      price: `$${product.price.toFixed(2)}`,
      image: product.images?.[0]?.url || '',
      type: 'gift-set',
      subtitle: product.shortDescription,
      images: product.images?.map(img => img.url) || [],
    };
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-4">
              LUXURY GIFT SETS
            </h1>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4 md:mb-6">
              Gift Collections
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Discover our curated selection of luxurious gift sets, perfect for any occasion
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 lg:py-20 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          {/* Price Filter */}
          <div className="flex justify-center mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {priceRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedPrice(range)}
                  className={`px-6 py-2 text-xs tracking-wider transition-all ${selectedPrice === range
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-900'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <Button
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                onClick={() => window.location.reload()}
              >
                RETRY
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white border border-gray-100">
                  <Skeleton className="h-[280px] md:h-[320px] w-full" />
                  <div className="p-4 md:p-5">
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg mb-4">No gift sets found in this price range</p>
              <Button
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                onClick={() => setSelectedPrice('All Prices')}
              >
                RESET FILTER
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product, index) => {
                const frontendProduct = convertToFrontendProduct(product);
                const productImage = product.images?.[0]?.url || '';

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/product/${product.slug}`}>
                      <div className="bg-white border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                        {/* Image */}
                        <div className="relative h-[280px] md:h-[320px] overflow-hidden bg-gray-50">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={product.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-5">
                          <p className="text-[10px] tracking-[0.2em] text-amber-600 uppercase mb-2">
                            GIFT SET
                          </p>
                          <h3 className="text-xs font-light tracking-wide text-gray-900 mb-4 line-clamp-2 min-h-[36px]">
                            {product.title}
                          </h3>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-baseline gap-2">
                              <p className="text-base font-normal text-gray-900">
                                ${product.price.toFixed(2)}
                              </p>
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <p className="text-sm text-gray-400 line-through">
                                  ${product.compareAtPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await addItem(frontendProduct, 1);
                              }}
                              disabled={product.stock === 0 || isItemLoading(product._id)}
                              className="bg-gray-900 hover:bg-gray-800 text-white px-4 h-8 rounded-none text-[10px] tracking-wider font-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isItemLoading(product._id) ? (
                                <>
                                  <Spinner className="w-3 h-3" />
                                  <span>ADDING...</span>
                                </>
                              ) : (
                                product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
