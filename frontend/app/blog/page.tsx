'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Search, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const POSTS_PER_PAGE = 30;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://canagold-backend.onrender.com/api';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImage?: { url: string; alt?: string };
  tags?: string[];
  category?: string;
  author: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTime?: number;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters synced with URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Posts');
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.get('author') || 'All Authors');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || '-publishedAt');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'All Posts');
    setSelectedAuthor(searchParams.get('author') || 'All Authors');
    setSelectedSort(searchParams.get('sort') || '-publishedAt');
  }, [searchParams]);

  const [categories, setCategories] = useState<string[]>(['All Posts']);
  const [authors, setAuthors] = useState<string[]>(['All Authors']);

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchBlogPosts();
  }, [currentPage, searchParams]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/blog?limit=1000&published=true`);
      const data = await response.json();

      if (data.success) {
        const posts = data.data.blogPosts || [];

        const categorySet = new Set<string>();
        const authorSet = new Set<string>();

        posts.forEach((post: BlogPost) => {
          if (post.category) categorySet.add(post.category);
          if (post.author) authorSet.add(post.author);
        });

        setCategories(['All Posts', ...Array.from(categorySet).sort()]);
        setAuthors(['All Authors', ...Array.from(authorSet).sort()]);
      }
    } catch (err) {
      console.error('Filter load failed:', err);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: POSTS_PER_PAGE.toString(),
        published: 'true',
      });

      const q = searchParams.get('q');
      if (q?.trim()) params.set('search', q.trim());

      const category = searchParams.get('category');
      if (category && category !== 'All Posts') params.set('category', category);

      const author = searchParams.get('author');
      if (author && author !== 'All Authors') params.set('author', author);

      const sort = searchParams.get('sort');
      if (sort) params.set('sort', sort);

      const response = await fetch(`${API_BASE_URL}/blog?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const posts = data.data.posts || data.data.blogPosts || [];
        setBlogPosts(posts);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to load posts');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (updates: { page?: number; q?: string; category?: string; author?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    // PAGE
    if (updates.page !== undefined) params.set('page', updates.page.toString());

    // SEARCH
    if (updates.q !== undefined) {
      updates.q.trim() ? params.set('q', updates.q.trim()) : params.delete('q');
    }

    // CATEGORY FIX (This fixes your issue)
    if (updates.category !== undefined) {
      if (updates.category === undefined || updates.category === 'All Posts') {
        params.delete('category'); // remove fully
      } else {
        params.set('category', updates.category);
      }
    }

    // AUTHOR FIX
    if (updates.author !== undefined) {
      if (updates.author === undefined || updates.author === 'All Authors') {
        params.delete('author');
      } else {
        params.set('author', updates.author);
      }
    }

    // SORT
    if (updates.sort !== undefined) params.set('sort', updates.sort);

    router.push(`/blog?${params.toString()}`);
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    updateURL({ page: 1, q: searchQuery });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateURL({ page: 1, category });
  };

  const handleAuthorChange = (author: string) => {
    setSelectedAuthor(author);
    updateURL({ page: 1, author });
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    updateURL({ page: 1, sort });
  };

  const handlePageChange = (p: number) => {
    updateURL({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    router.push('/blog');
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'All Posts' ||
    selectedAuthor !== 'All Authors' ||
    selectedSort !== '-publishedAt';



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
              BEAUTY & WELLNESS
            </h1>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4 md:mb-6">
              Our Journal
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Insights, tips, and stories from the world of luxury skincare
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="py-6 px-6 border-b border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search blog posts by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 rounded-none border-gray-200 focus:border-gray-900"
              />
            </div>
            <Button
              type="submit"
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-none px-8 h-11 text-xs tracking-wider"
            >
              SEARCH
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  updateURL({ q: '' });
                }}
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none px-6 h-11 text-xs tracking-wider"
              >
                <X className="w-4 h-4 mr-2" />
                RESET
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none px-6 h-11 text-xs tracking-wider"
            >
              <Filter className="w-4 h-4 mr-2" />
              FILTERS
            </Button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg ${selectedCategory !== 'All Posts' || selectedAuthor !== 'All Authors' || selectedSort !== '-publishedAt'
                ? 'md:grid-cols-4'
                : 'md:grid-cols-3'
                }`}
            >
              {/* Category Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block tracking-wider">CATEGORY</label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="rounded-none border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block tracking-wider">AUTHOR</label>
                <Select value={selectedAuthor} onValueChange={handleAuthorChange}>
                  <SelectTrigger className="rounded-none border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((author) => (
                      <SelectItem key={author} value={author}>
                        {author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block tracking-wider">SORT BY</label>
                <Select value={selectedSort} onValueChange={handleSortChange}>
                  <SelectTrigger className="rounded-none border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-publishedAt">Newest First</SelectItem>
                    <SelectItem value="publishedAt">Oldest First</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="-title">Title (Z-A)</SelectItem>
                    <SelectItem value="-viewCount">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters - Only show when filters are applied */}
              {(selectedCategory !== 'All Posts' || selectedAuthor !== 'All Authors' || selectedSort !== '-publishedAt') && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('All Posts');
                      setSelectedAuthor('All Authors');
                      setSelectedSort('-publishedAt');
                      // Clear all filter params from URL, keep search query if exists
                      const params = new URLSearchParams();
                      params.set('page', '1');
                      if (searchQuery.trim()) {
                        params.set('q', searchQuery.trim());
                      }
                      router.push(`/blog?${params.toString()}`);
                    }}
                    className="w-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                  >
                    <X className="w-4 h-4 mr-2" />
                    CLEAR FILTERS
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1 text-xs">
                  <span>Search: "{searchQuery}"</span>
                  <button onClick={() => { setSearchQuery(''); updateURL({ q: '' }); }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedCategory !== 'All Posts' && (
                <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1 text-xs">
                  <span>Category: {selectedCategory}</span>
                  <button onClick={() => handleCategoryChange('All Posts')}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedAuthor !== 'All Authors' && (
                <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1 text-xs">
                  <span>Author: {selectedAuthor}</span>
                  <button onClick={() => handleAuthorChange('All Authors')}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Count */}
          {!loading && (
            <div className="text-center mt-4 text-sm text-gray-600">
              {pagination.totalPosts > 0 ? (
                <>
                  Found {pagination.totalPosts} post{pagination.totalPosts !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                </>
              ) : (
                'No posts found'
              )}
            </div>
          )}
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 md:py-20 lg:py-24 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white">
                  <Skeleton className="h-[300px] w-full mb-4" />
                  <div className="p-6">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <Button
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                onClick={fetchBlogPosts}
              >
                TRY AGAIN
              </Button>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg mb-4">
                {hasActiveFilters ? 'No posts match your filters' : 'No posts found'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider"
                  onClick={clearAllFilters}
                >
                  CLEAR FILTERS
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
                {blogPosts.map((post, index) => (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.05,
                      ease: [0.25, 0.4, 0.25, 1]
                    }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="bg-white hover:shadow-xl transition-all duration-500">
                        {/* Image */}
                        <div className="relative h-[300px] overflow-hidden bg-gray-50">
                          <motion.img
                            src={post.coverImage?.url || '/placeholder-blog.jpg'}
                            alt={post.coverImage?.alt || post.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                          {post.category && (
                            <div className="absolute top-4 left-4">
                              <span className="bg-white px-3 py-1.5 text-[9px] tracking-[0.25em] text-gray-900 uppercase font-medium">
                                {post.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-[9px] tracking-[0.15em] text-gray-400 mb-4 uppercase">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              <span>{post.readingTime || 5} min read</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-serif text-gray-900 mb-3 group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[56px]">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-xs text-gray-500 mb-5 line-clamp-2 leading-relaxed">
                            {post.excerpt || post.body.substring(0, 150) + '...'}
                          </p>

                          {/* Author & CTA */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 tracking-wide">
                              <User className="w-3 h-3" />
                              <span>{post.author}</span>
                            </div>
                            <span className="text-[10px] tracking-[0.15em] text-gray-900 group-hover:translate-x-1 transition-transform duration-300 inline-block">
                              READ →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * POSTS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * POSTS_PER_PAGE, pagination.totalPosts)} of{' '}
                    {pagination.totalPosts} posts
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrevPage}
                      className="rounded-none border-gray-200 text-xs tracking-wider"
                    >
                      FIRST
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="rounded-none border-gray-200 text-xs tracking-wider"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      PREV
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={`rounded-none text-xs tracking-wider min-w-[40px] ${currentPage === pageNum
                              ? 'bg-gray-900 text-white hover:bg-gray-800'
                              : 'border-gray-200'
                              }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="rounded-none border-gray-200 text-xs tracking-wider"
                    >
                      NEXT
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={!pagination.hasNextPage}
                      className="rounded-none border-gray-200 text-xs tracking-wider"
                    >
                      LAST
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
