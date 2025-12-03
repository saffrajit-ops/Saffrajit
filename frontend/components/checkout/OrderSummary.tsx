'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { useCheckoutStore } from '@/lib/checkout-store';
import { Skeleton } from '@/components/ui/skeleton';
import CouponInput from './CouponInput';

interface OrderSummaryProps {
  isLoading?: boolean;
  onPayment: () => void;
  isProcessing?: boolean;
  onApplyCoupon?: (code: string) => Promise<{ valid: boolean; discount: number; message: string }>;
}

export default function OrderSummary({
  isLoading = false,
  onPayment,
  isProcessing = false,
  onApplyCoupon
}: OrderSummaryProps) {
  const { items, getTotalPrice, getTotalDiscount, getTotalShipping, getTotalItems } = useCartStore();
  const { couponDiscount } = useCheckoutStore();

  const subtotal = getTotalPrice();
  const productDiscount = getTotalDiscount();
  const shippingCharges = getTotalShipping();
  const totalItems = getTotalItems();

  // Check if free shipping is applied
  const hasFreeShipping = items.some(item => {
    if (!item.shipping || item.shipping.charges <= 0) return false;
    const isFreeByThreshold = item.shipping.freeShippingThreshold > 0 && subtotal >= item.shipping.freeShippingThreshold;
    const isFreeByQuantity = item.shipping.freeShippingMinQuantity > 0 && totalItems >= item.shipping.freeShippingMinQuantity;
    return isFreeByThreshold || isFreeByQuantity;
  });

  // Check if any item quantity exceeds available stock
  const hasStockIssue = items.some(item => {
    return item.stock !== undefined && item.quantity > item.stock;
  });

  const total = Math.max(0, subtotal - productDiscount - couponDiscount + shippingCharges);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Preview */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map((item) => {
          const exceedsStock = item.stock !== undefined && item.quantity > item.stock;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex gap-3 pb-3 border-b border-gray-100 last:border-0 ${exceedsStock ? 'bg-red-50 -mx-3 px-3 py-2 rounded' : ''}`}
            >
              <div className="relative w-14 h-14 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                {item.image && item.image.startsWith('http') ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized={item.image.startsWith('data:')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-xs text-gray-400">No Image</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-light text-gray-900 line-clamp-2">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Qty: <span className="font-medium">{item.quantity}</span>
                  {exceedsStock && (
                    <span className="text-red-600 ml-2">
                      (Only {item.stock} available)
                    </span>
                  )}
                </p>
                <p className="text-xs font-medium text-gray-900 mt-1">
                  {item.price}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Coupon Section */}
      {onApplyCoupon && (
        <CouponInput onApply={onApplyCoupon} subtotal={subtotal} />
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs font-light text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {productDiscount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-between text-xs font-medium text-green-600"
          >
            <span>Product Discount</span>
            <span>-${productDiscount.toFixed(2)}</span>
          </motion.div>
        )}

        {couponDiscount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-between text-xs font-medium text-green-600"
          >
            <span>Coupon Discount</span>
            <span>-${couponDiscount.toFixed(2)}</span>
          </motion.div>
        )}

        {shippingCharges > 0 ? (
          <div className="flex justify-between text-xs font-light text-gray-600">
            <span>Shipping</span>
            <span>${shippingCharges.toFixed(2)}</span>
          </div>
        ) : hasFreeShipping ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-between text-xs font-medium text-green-600"
          >
            <span>Shipping</span>
            <span>FREE ✓</span>
          </motion.div>
        ) : null}

        <div className="flex justify-between text-sm font-medium text-gray-900 pt-3 border-t border-gray-200">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Stock Issue Warning */}
      {hasStockIssue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded p-3"
        >
          <p className="text-xs text-red-600 text-center font-medium">
            ⚠️ Some items exceed available stock. Please adjust quantities in your cart.
          </p>
        </motion.div>
      )}

      {/* Payment Button */}
      <Button
        onClick={onPayment}
        disabled={isProcessing || items.length === 0 || hasStockIssue}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-xs tracking-[0.15em] font-light rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            PROCESSING PAYMENT...
          </motion.span>
        ) : (
          'PROCEED TO PAYMENT'
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center font-light">
        Your payment information is encrypted and secure
      </p>
    </div>
  );
}
