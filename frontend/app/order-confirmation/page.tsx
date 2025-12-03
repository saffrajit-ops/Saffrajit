'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OrderHeader from '@/components/order/OrderHeader';
import OrderItems from '@/components/order/OrderItems';
import OrderSummary from '@/components/order/OrderSummary';
import ShippingInfo from '@/components/order/ShippingInfo';
import { useOrderStore, Order } from '@/lib/order-store';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentOrder, setCurrentOrder } = useOrderStore();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderId = searchParams.get('orderId');
        const sessionId = searchParams.get('session_id');

        if (!orderId) {
          setError('Order ID not found');
          setIsLoading(false);
          return;
        }

        // TODO: Replace with actual API call when ready
        // const response = await fetch(`/api/orders/${orderId}`, {
        //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        // });

        // Mock order data based on backend structure
        const mockOrder: Order = {
          _id: orderId || '507f1f77bcf86cd799439011',
          orderNumber: `ORD-${Date.now()}-1`,
          items: [
            {
              _id: '1',
              productId: '507f1f77bcf86cd799439012',
              title: 'Luxury Gold Face Serum with 24K Gold',
              price: 89.99,
              qty: 1,
              variant: {
                shade: 'Pure Gold',
                size: '30ml',
                skinType: 'combination'
              }
            },
            {
              _id: '2',
              productId: '507f1f77bcf86cd799439013',
              title: 'Premium Hydrating Face Mask',
              price: 59.99,
              qty: 2,
              variant: {
                size: '50ml'
              }
            }
          ],
          shippingAddress: {
            label: 'Home',
            line1: '123 Main Street',
            line2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US'
          },
          subtotal: 209.97,
          couponCode: 'WELCOME10',
          couponDiscount: 21.0,
          shippingCost: 0,
          tax: 14.7,
          total: 203.67,
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
          transactionId: 'txn_1234567890',
          orderStatus: 'confirmed',
          trackingNumber: 'TRK1234567890',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setCurrentOrder(mockOrder);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [searchParams, setCurrentOrder]);

  const handlePrintOrder = () => {
    window.print();
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl tracking-wider font-medium text-gray-900">
            Order Not Found
          </h1>
          <p className="text-gray-600 font-light">{error}</p>
          <Button
            onClick={handleContinueShopping}
            className="bg-gray-900 hover:bg-gray-800 text-white h-10 text-xs tracking-[0.15em] font-light rounded-none"
          >
            BACK TO SHOPPING
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !currentOrder) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs tracking-wider font-light">BACK</span>
          </button>
        </div>
      </div>

      {/* Order Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <OrderHeader
          orderNumber={currentOrder.orderNumber}
          createdAt={currentOrder.createdAt}
          paymentStatus={currentOrder.paymentStatus}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Order Items */}
            <section>
              <OrderItems items={currentOrder.items} isLoading={isLoading} />
            </section>

            {/* Shipping Information */}
            <section>
              <ShippingInfo
                address={currentOrder.shippingAddress}
                orderStatus={currentOrder.orderStatus}
                trackingNumber={currentOrder.trackingNumber}
                isLoading={isLoading}
              />
            </section>

            {/* Next Steps */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4"
            >
              <h3 className="text-base tracking-wider font-medium text-gray-900">
                WHAT'S NEXT?
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 font-light">
                <li className="flex gap-3">
                  <span className="text-gray-900 font-medium">1.</span>
                  <span>Check your email for an order confirmation and shipping updates</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-900 font-medium">2.</span>
                  <span>Your order will be processed and shipped within 1-2 business days</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-900 font-medium">3.</span>
                  <span>Track your shipment using the tracking number provided above</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-900 font-medium">4.</span>
                  <span>Receive your order in 5-7 business days</span>
                </li>
              </ul>
            </motion.section>
          </div>

          {/* Right Column - Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-32 lg:h-fit"
          >
            <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-8">
              <OrderSummary
                subtotal={currentOrder.subtotal}
                couponCode={currentOrder.couponCode}
                couponDiscount={currentOrder.couponDiscount}
                shippingCost={currentOrder.shippingCost}
                tax={currentOrder.tax}
                total={currentOrder.total}
                isLoading={isLoading}
              />

              {/* Actions */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <Button
                  onClick={handlePrintOrder}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white h-10 text-xs tracking-[0.15em] font-light rounded-none"
                >
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  PRINT ORDER
                </Button>

                <Button
                  onClick={handleContinueShopping}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-10 text-xs tracking-[0.15em] font-light rounded-none"
                >
                  CONTINUE SHOPPING
                </Button>
              </div>

              {/* Support Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs font-medium text-gray-900">NEED HELP?</p>
                    <p className="text-xs text-gray-600 mt-1 font-light">
                      Check your email for order details or{' '}
                      <a href="#" className="text-gray-900 hover:underline">
                        contact support
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
