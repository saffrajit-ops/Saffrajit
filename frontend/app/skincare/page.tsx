'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, SlidersHorizontal, Search, ChevronDown, ChevronUp, Star } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCartWithAuth } from '@/lib/hooks/useCartWithAuth';
import { productAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

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
  type?: string;
  categories?: string[];
  concern?: string[];
  collection?: string;
  stock?: number;
  isActive?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
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
}

const priceRanges = ['All Prices', 'Under $400', '$400 - $600', '$600 - $800', 'Over $800'];

export default function SkincarePage() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Products']);
  const [concerns, setConcerns] = useState<string[]>(['All Concerns']);
  const [productTypes, setProductTypes] = useState<string[]>(['All Types']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedConcern, setSelectedConcern] = useState('All Concerns');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPrice, setSelectedPrice] = useState('All Prices');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<{
    category: boolean;
    concern: boolean;
    type: boolean;
    price: boolean;
  }>({
    category: false,
    concern: false,
    type: false,
    price: false,
  });
  const { addItem, isItemLoading } = useCartStore();

  const toggleFilter = (filterName: 'category' | 'concern' | 'type' | 'price') => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Set up cart authentication redirect
  useCartWithAuth();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories and concerns from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productAPI.getAllCategories();
        if (response.success && response.data) {
          const categoryNames = ['All Products', ...response.data.map((cat: { name: string }) => cat.name)];
          setCategories(categoryNames);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Extract unique concerns and types from products
  useEffect(() => {
    if (allProducts.length > 0) {
      const uniqueConcerns = new Set<string>();
      const uniqueTypes = new Set<string>();

      allProducts.forEach(product => {
        // Extract concerns
        if (product.concern && Array.isArray(product.concern)) {
          product.concern.forEach(c => uniqueConcerns.add(c));
        }
        // Extract types (only if type exists and category is not 'Gift Sets')
        if (product.type && product.categories?.[0] !== 'Gift Sets') {
          uniqueTypes.add(product.type);
        }
      });

      setConcerns(['All Concerns', ...Array.from(uniqueConcerns).sort()]);

      // Format types for display (capitalize first letter)
      const formattedTypes = Array.from(uniqueTypes).map(type => {
        return type === 'gift-set' ? 'Gift Set' : type.charAt(0).toUpperCase() + type.slice(1);
      });
      setProductTypes(['All Types', ...formattedTypes.sort()]);
    }
  }, [allProducts]);

  // Fetch all products once for client-side filtering
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all products (client-side filtering)
        const params: any = {
          page: 1,
          limit: 1000, // Fetch all products
          sort: '-createdAt',
        };

        const response = await productAPI.getAllProducts(params);
        if (response.success && response.data?.products) {
          setAllProducts(response.data.products);
        } else {
          setError('Failed to load products');
        }
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply category filter from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }

    const concernParam = searchParams.get('concern');
    if (concernParam && concerns.includes(concernParam)) {
      setSelectedConcern(concernParam);
    }

    // Focus search input if coming from search icon
    const focusParam = searchParams.get('focus');
    if (focusParam === 'search') {
      setTimeout(() => {
        const searchInput = document.querySelector('input[type="text"][placeholder="Search products..."]');
        if (searchInput) {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (searchInput as HTMLInputElement).focus();
        }
      }, 100);
    }
  }, [searchParams, categories, concerns]);

  // Convert backend product to frontend format
  const convertToFrontendProduct = (product: BackendProduct): FrontendProduct => {
    return {
      id: product._id,
      slug: product.slug,
      name: product.title,
      category: product.categories?.[0] || product.collection || 'Uncategorized',
      price: `$${product.price.toFixed(2)}`,
      image: product.images?.[0]?.url || '',
      type: product.type || 'single',
      subtitle: product.shortDescription,
      images: product.images?.map(img => img.url) || [],
    };
  };

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Filter by category
      if (selectedCategory !== 'All Products') {
        if (!product.categories?.includes(selectedCategory)) {
          return false;
        }
      }

      // Filter by concern
      if (selectedConcern !== 'All Concerns') {
        if (!product.concern?.includes(selectedConcern)) {
          return false;
        }
      }

      // Filter by type (skip if category is 'Gift Sets' since those products don't have type)
      if (selectedType !== 'All Types' && selectedCategory !== 'Gift Sets') {
        // Convert display format back to backend format
        const productType = selectedType.toLowerCase().replace(' ', '-');
        if (product.type !== productType) {
          return false;
        }
      }

      // Filter by price
      if (selectedPrice !== 'All Prices') {
        if (selectedPrice === 'Under $400' && product.price >= 400) {
          return false;
        } else if (selectedPrice === '$400 - $600' && (product.price < 400 || product.price > 600)) {
          return false;
        } else if (selectedPrice === '$600 - $800' && (product.price < 600 || product.price > 800)) {
          return false;
        } else if (selectedPrice === 'Over $800' && product.price <= 800) {
          return false;
        }
      }

      // Filter by search query
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesTitle = product.title?.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        const matchesShortDescription = product.shortDescription?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesShortDescription) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, selectedCategory, selectedConcern, selectedType, selectedPrice, debouncedSearchQuery]);

  const FilterSection = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleFilter('category')}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <h3 className="text-xs tracking-[0.2em] text-gray-900 font-medium">CATEGORY</h3>
          {expandedFilters.category ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {expandedFilters.category && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`block w-full text-left text-sm py-2 px-3 transition-colors ${selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Concern Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleFilter('concern')}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <h3 className="text-xs tracking-[0.2em] text-gray-900 font-medium">CONCERN</h3>
          {expandedFilters.concern ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {expandedFilters.concern && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-2"
          >
            {concerns.map((concern) => (
              <button
                key={concern}
                onClick={() => setSelectedConcern(concern)}
                className={`block w-full text-left text-sm py-2 px-3 transition-colors ${selectedConcern === concern
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {concern}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Type Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleFilter('type')}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <h3 className="text-xs tracking-[0.2em] text-gray-900 font-medium">TYPE</h3>
          {expandedFilters.type ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {expandedFilters.type && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-2"
          >
            {productTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`block w-full text-left text-sm py-2 px-3 transition-colors ${selectedType === type
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {type}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Price Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleFilter('price')}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <h3 className="text-xs tracking-[0.2em] text-gray-900 font-medium">PRICE RANGE</h3>
          {expandedFilters.price ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {expandedFilters.price && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-2"
          >
            {priceRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedPrice(range)}
                className={`block w-full text-left text-sm py-2 px-3 transition-colors ${selectedPrice === range
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {range}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Reset Filters */}
      <Button
        variant="outline"
        className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wider mt-6"
        onClick={() => {
          setSelectedCategory('All Products');
          setSelectedConcern('All Concerns');
          setSelectedType('All Types');
          setSelectedPrice('All Prices');
          setSearchQuery('');
        }}
      >
        RESET FILTERS
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-4">
              LUXURY SKINCARE
            </h1>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4 md:mb-6">
              All Products
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              {loading ? 'Loading...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'Product' : 'Products'}`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 lg:py-20 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <Button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none h-12 text-xs tracking-wider"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                FILTERS
              </Button>
            </div>

            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-40 z-40">
                <FilterSection />
              </div>
            </aside>

            {/* Mobile Filters Overlay */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-6 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg tracking-wider font-medium">FILTERS</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <FilterSection />
                </motion.div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-gray-900 focus:outline-none text-sm tracking-wide transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filters Badges */}
              {(selectedCategory !== 'All Products' || selectedConcern !== 'All Concerns' || selectedType !== 'All Types' || selectedPrice !== 'All Prices' || searchQuery) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs tracking-wider text-gray-600 font-medium">ACTIVE FILTERS:</span>

                  {selectedCategory !== 'All Products' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 text-xs tracking-wide"
                    >
                      <span>{selectedCategory}</span>
                      <button
                        onClick={() => setSelectedCategory('All Products')}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove category filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  {selectedConcern !== 'All Concerns' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 text-xs tracking-wide"
                    >
                      <span>{selectedConcern}</span>
                      <button
                        onClick={() => setSelectedConcern('All Concerns')}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove concern filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  {selectedType !== 'All Types' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 text-xs tracking-wide"
                    >
                      <span>{selectedType}</span>
                      <button
                        onClick={() => setSelectedType('All Types')}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove type filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  {selectedPrice !== 'All Prices' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 text-xs tracking-wide"
                    >
                      <span>{selectedPrice}</span>
                      <button
                        onClick={() => setSelectedPrice('All Prices')}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove price filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 text-xs tracking-wide"
                    >
                      <span>Search: {searchQuery}</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        aria-label="Remove search filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCategory('All Products');
                      setSelectedConcern('All Concerns');
                      setSelectedType('All Types');
                      setSelectedPrice('All Prices');
                      setSearchQuery('');
                    }}
                    className="text-xs tracking-wider text-gray-600 hover:text-gray-900 underline underline-offset-2 ml-2"
                  >
                    Clear All
                  </button>
                </div>
              )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  <p className="text-gray-600 text-lg mb-4">No products found</p>
                  <Button
                    variant="outline"
                    className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                    onClick={() => {
                      setSelectedCategory('All Products');
                      setSelectedConcern('All Concerns');
                      setSelectedType('All Types');
                      setSelectedPrice('All Prices');
                      setSearchQuery('');
                    }}
                  >
                    RESET FILTERS
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {filteredProducts.map((product, index) => {
                    const frontendProduct = convertToFrontendProduct(product);
                    const productImage = product.images?.[0]?.url || '';
                    const productCategory = product.categories?.[0] || product.collection || 'Uncategorized';

                    return (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="group cursor-pointer"
                      >
                        <Link href={`/product/${product.slug}`}>
                          <div className="bg-white hover:shadow-lg transition-all duration-300">
                            {/* Image */}
                            <div className="relative h-[280px] md:h-[320px] bg-white" style={{ backgroundImage: 'url(/product_image_background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                              <img
                                src={productImage}
                                alt={product.title}
                                style={{
                                  position: 'absolute',
                                  bottom: '16px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  maxWidth: 'calc(100% - 32px)',
                                  maxHeight: 'calc(100% - 32px)',
                                  width: 'auto',
                                  height: 'auto',
                                }}
                                className="object-contain transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>

                            {/* Content */}
                            <div className="p-4 md:p-5">
                              <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase mb-2">
                                {productCategory}
                              </p>
                              <h3 className="text-xs font-light tracking-wide text-gray-900 mb-2 line-clamp-2 min-h-[36px]">
                                {product.title}
                              </h3>

                              {/* Star Rating */}
                              {product.ratingAvg && product.ratingCount && product.ratingCount > 0 ? (
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < Math.floor(product.ratingAvg!)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                                  </span>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex flex-col gap-1">
                                  {(() => {
                                    const hasDiscount = product.discount && product.discount.value > 0;
                                    let finalPrice = product.price;
                                    
                                    if (hasDiscount) {
                                      if (product.discount.type === "percentage") {
                                        const discountAmount = (product.price * product.discount.value) / 100;
                                        finalPrice = Math.max(0, product.price - discountAmount);
                                      } else {
                                        finalPrice = Math.max(0, product.price - product.discount.value);
                                      }
                                    }

                                    return (
                                      <>
                                        <div className="flex items-baseline gap-2">
                                          {hasDiscount ? (
                                            <>
                                              <p className="text-base font-semibold text-gray-900">
                                                ${finalPrice.toFixed(2)}
                                              </p>
                                              <p className="text-sm text-gray-400 line-through">
                                                ${product.price.toFixed(2)}
                                              </p>
                                            </>
                                          ) : (
                                            <>
                                              <p className="text-base font-normal text-gray-900">
                                                ${product.price.toFixed(2)}
                                              </p>
                                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                                <p className="text-sm text-gray-400 line-through">
                                                  ${product.compareAtPrice.toFixed(2)}
                                                </p>
                                              )}
                                            </>
                                          )}
                                        </div>
                                        {hasDiscount && (
                                          <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-medium tracking-wider">
                                            {product.discount.type === "percentage" 
                                              ? `-${product.discount.value}%` 
                                              : `-$${product.discount.value.toFixed(2)}`
                                            }
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
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
          </div>
        </div>
      </section>
    </main>
  );
}
