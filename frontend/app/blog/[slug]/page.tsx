'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { blogAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import CommentSystem from '@/components/blog/CommentSystem';
import { useAuthStore } from '@/lib/auth-store';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImage?: {
    url: string;
    alt?: string;
  };
  tags?: string[];
  category?: string;
  author: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTime?: number;
  createdAt: string;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogPost();
  }, [params.slug]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogAPI.getBlogBySlug(params.slug);

      if (response.success && response.data) {
        setPost(response.data);

        // Fetch comments
        fetchComments(response.data._id);

        // Fetch related posts from same category
        if (response.data.category) {
          const relatedResponse = await blogAPI.getAllBlogPosts({
            category: response.data.category,
            limit: 3,
            published: true,
            sort: '-publishedAt'
          });

          if (relatedResponse.success && relatedResponse.data?.posts) {
            // Filter out current post
            const filtered = relatedResponse.data.posts
              .filter((p: BlogPost) => p._id !== response.data._id)
              .slice(0, 2);
            setRelatedPosts(filtered);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch blog post:', err);
      setError(err.response?.data?.message || 'Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (blogId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden bg-gray-900">
          <Skeleton className="w-full h-full" />
        </section>
        <article className="py-12 md:py-16 lg:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-3/4 mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </article>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/blog')} variant="outline">
            Back to Blog
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Image */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden bg-gray-900">
        <img
          src={post.coverImage?.url || '/placeholder-blog.jpg'}
          alt={post.coverImage?.alt || post.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <Link href="/blog">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 left-6 md:left-12 flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs tracking-wider">BACK TO JOURNAL</span>
          </motion.button>
        </Link>

        {/* Category Badge */}
        {post.category && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-8 left-6 md:left-12"
          >
            <span className="bg-white px-4 py-2 text-[10px] tracking-[0.2em] text-gray-900 uppercase">
              {post.category}
            </span>
          </motion.div>
        )}
      </section>

      {/* Article Content */}
      <article className="py-12 md:py-16 lg:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime || 5} min read</span>
              </div>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="tracking-wider">SHARE</span>
              </button>
            </div>
          </motion.div>

          {/* Excerpt */}
          {post.excerpt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-light">
                {post.excerpt}
              </p>
            </motion.div>
          )}

          {/* Body Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="prose prose-lg max-w-none blog-content"
          >
            <div
              className="text-base text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </motion.div>

          <style jsx global>{`
            .blog-content a {
              color: #2563eb;
              text-decoration: underline;
              transition: color 0.2s;
            }
            .blog-content a:hover {
              color: #1e40af;
            }
            .blog-content img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1.5rem 0;
            }
            .blog-content h1 {
              font-size: 2.25rem;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1rem;
              color: #111827;
            }
            .blog-content h2 {
              font-size: 1.875rem;
              font-weight: 700;
              margin-top: 1.75rem;
              margin-bottom: 0.875rem;
              color: #111827;
            }
            .blog-content h3 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              color: #111827;
            }
            .blog-content p {
              margin-top: 1rem;
              margin-bottom: 1rem;
              line-height: 1.75;
            }
            .blog-content ul,
            .blog-content ol {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            .blog-content li {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
            .blog-content blockquote {
              border-left: 4px solid #3b82f6;
              padding-left: 1rem;
              margin: 1.5rem 0;
              font-style: italic;
              color: #4b5563;
            }
            .blog-content code {
              background-color: #f3f4f6;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.875em;
            }
            .blog-content pre {
              background-color: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1.5rem 0;
            }
            .blog-content pre code {
              background-color: transparent;
              padding: 0;
            }
          `}</style>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-8 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs tracking-wider uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </article>

      {/* Comments Section */}
      {post && (
        <section className="bg-gray-50">
          <CommentSystem
            blogId={post._id}
            comments={comments}
            currentUserId={user?._id}
            onRefresh={() => fetchComments(post._id)}
          />
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 md:py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-xs tracking-[0.3em] text-gray-600 mb-3">
                CONTINUE READING
              </h2>
              <h3 className="font-serif text-3xl md:text-4xl text-gray-900">
                Related Articles
              </h3>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <motion.article
                  key={relatedPost._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <Link href={`/blog/${relatedPost.slug}`}>
                    <div className="bg-white border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                      <div className="relative h-[240px] overflow-hidden bg-gray-50">
                        <img
                          src={relatedPost.coverImage?.url || '/placeholder-blog.jpg'}
                          alt={relatedPost.coverImage?.alt || relatedPost.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        {relatedPost.category && (
                          <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase mb-3">
                            {relatedPost.category}
                          </p>
                        )}
                        <h4 className="text-lg font-serif text-gray-900 mb-3 group-hover:text-gray-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {relatedPost.excerpt || relatedPost.body.substring(0, 100) + '...'}
                        </p>
                        <span className="text-xs tracking-wider text-gray-900 group-hover:underline">
                          READ MORE →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/blog">
                <Button
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-xs tracking-wider px-8 h-12"
                >
                  VIEW ALL ARTICLES
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
