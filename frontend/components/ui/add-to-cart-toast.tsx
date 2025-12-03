'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';

export function AddToCartToast() {
  const { toasts, removeToast } = useCartStore();

  useEffect(() => {
    if (toasts.length > 0) {
      const latestToast = toasts[toasts.length - 1];
      const timer = setTimeout(() => {
        removeToast(latestToast.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-6 right-6 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 text-white px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 max-w-sm pointer-events-auto"
          >
            <CheckCircle2
              className="w-5 h-5 text-green-400 flex-shrink-0"
              strokeWidth={1.5}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-0.5">Added to bag</p>
              <p className="text-xs text-gray-300 truncate">
                {toast.productName}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
