'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface BackendProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{ url: string; alt?: string; position?: number }>;
  description?: string;
  shortDescription?: string;
  categories?: string[];
  collection?: string;
  type?: string;
  ratingAvg?: number;
  ratingCount?: number;
  stock?: number;
}

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

interface RelatedProductsProps {
  products: BackendProduct[];
  onAddToCart: (product: FrontendProduct) => Promise<void>;
  isItemLoading: (productId: string) => boolean;
}

export default function RelatedProducts({ products, onAddToCart, isItemLoading }: RelatedProductsProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 md:py-20 px-6 lg:px-12 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-xs tracking-[0.3em] text-gray-600 mb-4">YOU MAY ALSO LIKE</h2>
            <h3 className="font-serif text-3xl md:text-4xl text-gray-900">Related Products</h3>
          </motion.div>
          <p className="text-center text-gray-600">No related products available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 px-6 lg:px-12 bg-white">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-xs tracking-[0.3em] text-gray-600 mb-4">YOU MAY ALSO LIKE</h2>
          <h3 className="font-serif text-3xl md:text-4xl text-gray-900">Related Products</h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((relatedProduct, index) => {
            const relatedImages = relatedProduct.images?.map(img => img.url) || [];
            const relatedImage = relatedImages[0] || '';
            const relatedCategory = relatedProduct.categories?.[0] || relatedProduct.collection || 'Uncategorized';

            const frontendRelatedProduct: FrontendProduct = {
              id: relatedProduct._id,
              slug: relatedProduct.slug,
              name: relatedProduct.title,
              category: relatedCategory,
              price: `${relatedProduct.price.toFixed(2)}`,
              image: relatedImage,
              type: relatedProduct.type || 'single',
              subtitle: relatedProduct.shortDescription,
              rating: relatedProduct.ratingAvg,
              reviewCount: relatedProduct.ratingCount,
              images: relatedImages,
            };

            return (
              <motion.div
                key={relatedProduct._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/product/${relatedProduct.slug}`} className="block">
                  <div
                    className="relative h-[400px] bg-white mb-4 overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage: 'url(/product_image_background.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <img
                      src={relatedImage}
                      alt={relatedProduct.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-4"
                    />
                  </div>
                  <p className="text-xs tracking-[0.2em] text-gray-500 uppercase mb-2">{relatedCategory}</p>
                  <h4 className="text-sm font-light tracking-wide text-gray-900 mb-3 line-clamp-2 min-h-[40px]">
                    {relatedProduct.title}
                  </h4>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg text-gray-900">${relatedProduct.price.toFixed(2)}</p>
                    <Button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await onAddToCart(frontendRelatedProduct);
                      }}
                      size="sm"
                      variant="outline"
                      disabled={relatedProduct.stock === 0 || isItemLoading(relatedProduct._id)}
                      className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-[10px] tracking-wider font-light disabled:opacity-50 flex items-center gap-2"
                    >
                      {isItemLoading(relatedProduct._id) ? (
                        <>
                          <Spinner className="w-3 h-3" />
                          <span>ADDING...</span>
                        </>
                      ) : relatedProduct.stock === 0 ? (
                        'OUT OF STOCK'
                      ) : (
                        'ADD TO BAG'
                      )}
                    </Button>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
