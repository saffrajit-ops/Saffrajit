'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonLoader } from '@/components/ui/loader';
import { useCheckoutStore } from '@/lib/checkout-store';

interface CouponInputProps {
  onApply: (code: string) => Promise<{ valid: boolean; discount: number; message: string }>;
  subtotal: number;
}

export default function CouponInput({ onApply, subtotal }: CouponInputProps) {
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const { couponCode, couponDiscount, setCouponCode, setCouponDiscount, isApplyingCoupon, setIsApplyingCoupon } = useCheckoutStore();

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputCode.trim()) {
      setMessage({ text: 'Please enter a coupon code', type: 'error' });
      return;
    }

    setIsApplyingCoupon(true);
    setMessage(null);

    try {
      const result = await onApply(inputCode.trim().toUpperCase());

      if (result.valid) {
        setCouponCode(inputCode.trim().toUpperCase());
        setCouponDiscount(result.discount);
        setMessage({ text: result.message, type: 'success' });
        setInputCode('');
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to apply coupon. Please try again.', type: 'error' });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemove = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setInputCode('');
    setMessage(null);
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {couponCode ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-900">Coupon Applied</p>
              <p className="text-xs text-green-700 font-mono">{couponCode}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-green-600 hover:text-green-700 flex-shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          {couponDiscount > 0 && (
            <p className="text-xs text-gray-600 text-center font-light">
              You save <span className="font-medium text-green-600">${couponDiscount.toFixed(2)}</span>
            </p>
          )}
        </motion.div>
      ) : (
        <form onSubmit={handleApply} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="text-xs h-10 pl-10"
                disabled={isApplyingCoupon}
              />
            </div>
            <Button
              type="submit"
              disabled={isApplyingCoupon || !inputCode.trim()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 h-10 px-4 text-xs font-light tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isApplyingCoupon ? (
                <>
                  <ButtonLoader className="text-gray-900" />
                  <span>APPLYING...</span>
                </>
              ) : (
                'APPLY'
              )}
            </Button>
          </div>

          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs font-light ${message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {message.text}
            </motion.p>
          )}
        </form>
      )}
    </div>
  );
}
