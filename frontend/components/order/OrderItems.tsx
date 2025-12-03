'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { OrderItem } from '@/lib/order-store';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItemsProps {
  items: OrderItem[];
  isLoading?: boolean;
}

export default function OrderItems({ items, isLoading = false }: OrderItemsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h3 className="text-base tracking-wider font-medium text-gray-900">
        ORDER ITEMS
      </h3>

      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {/* Item Image Placeholder */}
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center px-2">
              <span>Product Image</span>
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-light text-gray-900 line-clamp-2 mb-2">
                {item.title}
              </h4>

              {/* Variants */}
              {item.variant && Object.values(item.variant).some(v => v) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.variant.shade && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Shade: {item.variant.shade}
                    </span>
                  )}
                  {item.variant.size && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Size: {item.variant.size}
                    </span>
                  )}
                  {item.variant.skinType && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Skin Type: {item.variant.skinType}
                    </span>
                  )}
                </div>
              )}

              {/* Quantity and Price */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Quantity: <span className="font-medium">{item.qty}</span>
                </p>
                <p className="text-sm font-medium text-gray-900">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
