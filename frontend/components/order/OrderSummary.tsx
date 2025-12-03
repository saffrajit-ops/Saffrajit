'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderSummaryProps {
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  shippingCost: number;
  tax: number;
  total: number;
  isLoading?: boolean;
}

export default function OrderSummary({
  subtotal,
  couponCode,
  couponDiscount,
  shippingCost,
  tax,
  total,
  isLoading = false
}: OrderSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h3 className="text-base tracking-wider font-medium text-gray-900 mb-6">
        ORDER SUMMARY
      </h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-between text-sm"
        >
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900 font-light">${subtotal.toFixed(2)}</span>
        </motion.div>

        {/* Coupon Discount */}
        {couponDiscount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between text-sm"
          >
            <span className="text-gray-600">
              Discount {couponCode && <span className="font-mono">({couponCode})</span>}
            </span>
            <span className="text-green-600 font-medium">-${couponDiscount.toFixed(2)}</span>
          </motion.div>
        )}

        {/* Shipping */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between text-sm"
        >
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-900 font-light">
            {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
          </span>
        </motion.div>

        {/* Tax */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between text-sm"
        >
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-900 font-light">${tax.toFixed(2)}</span>
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between text-base font-medium pt-4 border-t border-gray-200"
        >
          <span className="text-gray-900">TOTAL</span>
          <span className="text-gray-900">${total.toFixed(2)}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
