'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface OrderHeaderProps {
  orderNumber: string;
  createdAt: string;
  paymentStatus: string;
}

export default function OrderHeader({
  orderNumber,
  createdAt,
  paymentStatus
}: OrderHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6 border-b border-gray-200"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="flex justify-center mb-6"
      >
        <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={1.5} />
      </motion.div>

      <h1 className="text-3xl tracking-wider font-medium text-gray-900 mb-2">
        ORDER CONFIRMED
      </h1>
      
      <p className="text-gray-600 text-sm mb-8 font-light">
        Thank you for your purchase. Your order has been received and will be processed shortly.
      </p>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Order Number */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 tracking-wide mb-2">ORDER NUMBER</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-mono font-medium text-gray-900 break-all">
              {orderNumber}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyOrderNumber}
              className="flex-shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
              title="Copy order number"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" strokeWidth={2} />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
              )}
            </motion.button>
          </div>
        </div>

        {/* Date and Payment Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 tracking-wide mb-2">ORDER DATE</p>
            <p className="text-sm text-gray-900 font-light">{formattedDate}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 tracking-wide mb-2">PAYMENT STATUS</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  paymentStatus === 'completed'
                    ? 'bg-green-600'
                    : paymentStatus === 'pending'
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
              />
              <p className="text-sm text-gray-900 font-light capitalize">
                {paymentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
