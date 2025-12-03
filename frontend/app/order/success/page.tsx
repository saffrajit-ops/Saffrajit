'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/lib/order-store';
import { useCartStore } from '@/lib/cart-store';
import { useCheckoutStore } from '@/lib/checkout-store';
import { orderAPI, paymentAPI } from '@/lib/api/client';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  const { currentOrder, setCurrentOrder, setIsLoading, setError } = useOrderStore();
  const { clearCart } = useCartStore();
  const { reset: resetCheckout } = useCheckoutStore();

  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls using ref (React strict mode calls useEffect twice)
    if (isVerifyingRef.current) {
      console.log('⚠️ Already verifying, skipping duplicate call');
      return;
    }

    // Fetch order details first, then clear cart
    if (orderId) {
      // Direct order ID (for COD or free orders)
      isVerifyingRef.current = true;
      fetchOrderDetails(orderId);
    } else if (sessionId) {
      // For Stripe payments, we need to fetch order by session ID
      isVerifyingRef.current = true;
      fetchOrderBySessionId(sessionId);
    } else {
      setIsLoadingOrder(false);
      setOrderError('Order information not found');
    }
  }, [orderId, sessionId]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoadingOrder(true);
      setOrderError(null);

      const response = await orderAPI.getOrderById(orderId);

      if (response.success && response.data) {
        setCurrentOrder(response.data);
        // Clear cart only after successfully fetching order
        try {
          await clearCart();
          resetCheckout();
        } catch (cartError) {
          console.error('Failed to clear cart:', cartError);
          // Don't fail the whole flow if cart clear fails
        }
      } else {
        setOrderError(response.message || 'Failed to load order details');
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setOrderError(error.response?.data?.message || error.message || 'Failed to load order details');
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const fetchOrderBySessionId = async (sessionId: string) => {
    try {
      setIsLoadingOrder(true);
      setOrderError(null);

      console.log(`🔍 Verifying session: ${sessionId}`);

      // First, try to verify session and create order
      try {
        const verifyResult = await paymentAPI.verifySession(sessionId);
        if (verifyResult.success && verifyResult.order) {
          console.log(`✅ Order created/found: ${verifyResult.order.orderNumber}`);
          setCurrentOrder(verifyResult.order);

          try {
            await clearCart();
            resetCheckout();
            console.log('✅ Cart cleared');
          } catch (cartError) {
            console.error('⚠️ Failed to clear cart:', cartError);
          }

          setIsLoadingOrder(false);
          return;
        }
      } catch (verifyError: any) {
        console.error('⚠️ Verify session failed, falling back to polling:', verifyError);
      }

      // Fallback: Poll for order creation (webhook might have created it)
      let attempts = 0;
      const maxAttempts = 5;
      const pollInterval = 2000; // 2 seconds

      const pollForOrder = async (): Promise<void> => {
        attempts++;
        console.log(`🔍 Polling for order (attempt ${attempts}/${maxAttempts})...`);

        try {
          // Get user's recent orders and find the one with this session ID
          const response = await orderAPI.getUserOrders({ limit: 10 });

          if (response.success && response.data) {
            const orders = Array.isArray(response.data) ? response.data : [];
            console.log(`📦 Found ${orders.length} recent orders`);

            const order = orders.find((o: any) => o.payment?.sessionId === sessionId);

            if (order) {
              console.log(`✅ Order found: ${order.orderNumber}`);
              console.log(`   - Status: ${order.status}`);
              console.log(`   - Payment Status: ${order.payment?.status}`);
              console.log(`   - Total: $${order.total}`);

              setCurrentOrder(order);

              // Cart should already be cleared by webhook, but try anyway
              try {
                console.log('🧹 Clearing cart...');
                await clearCart();
                resetCheckout();
                console.log('✅ Cart cleared successfully');
              } catch (cartError) {
                console.error('⚠️ Failed to clear cart (may already be empty):', cartError);
                // Don't fail the whole flow if cart clear fails
              }

              setIsLoadingOrder(false);
              return;
            } else {
              console.log(`⏳ Order not found yet, will retry...`);
            }
          }

          // If not found and haven't exceeded max attempts, try again
          if (attempts < maxAttempts) {
            console.log(`⏱️ Waiting ${pollInterval / 1000} seconds before next attempt...`);
            setTimeout(pollForOrder, pollInterval);
          } else {
            console.error('❌ Max polling attempts reached');
            setOrderError('Order is being processed. Please check your orders page in a moment.');
            setIsLoadingOrder(false);
          }
        } catch (error: any) {
          console.error('❌ Error polling for order:', error);
          if (attempts < maxAttempts) {
            console.log(`⏱️ Retrying after error...`);
            setTimeout(pollForOrder, pollInterval);
          } else {
            console.error('❌ Max polling attempts reached after errors');
            setOrderError('Failed to load order details. Please check your orders page.');
            setIsLoadingOrder(false);
          }
        }
      };

      pollForOrder();
    } catch (error: any) {
      console.error('Error fetching order by session:', error);
      setOrderError(error.response?.data?.message || error.message || 'Failed to load order details');
      setIsLoadingOrder(false);
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (orderError && !currentOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{orderError}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/skincare')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-10 rounded-none text-xs tracking-[0.15em] font-light"
            >
              CONTINUE SHOPPING
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/profile/orders')}
              className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-6 h-10 rounded-none text-xs tracking-[0.15em] font-light"
            >
              VIEW ORDERS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const order = currentOrder;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-3xl font-medium text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </motion.div>

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs tracking-wider font-medium text-gray-500 mb-2">ORDER NUMBER</h3>
                <p className="text-lg font-medium text-gray-900">{order.orderNumber}</p>
              </div>

              <div>
                <h3 className="text-xs tracking-wider font-medium text-gray-500 mb-2">ORDER DATE</h3>
                <p className="text-sm text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <h3 className="text-xs tracking-wider font-medium text-gray-500 mb-2">PAYMENT STATUS</h3>
                <p className="text-sm font-medium text-green-600 capitalize">
                  {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus}
                </p>
              </div>

              <div>
                <h3 className="text-xs tracking-wider font-medium text-gray-500 mb-2">TOTAL AMOUNT</h3>
                <p className="text-lg font-medium text-gray-900">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Items */}
        {order && order.items && order.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-sm tracking-wider font-medium mb-4">ORDER ITEMS</h2>
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => {
                const isProductDeleted = !item.product || !item.product._id;
                const itemTitle = item.title || item.product?.title || 'Product Not Available';

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                      {isProductDeleted && (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {itemTitle}
                        {isProductDeleted && (
                          <span className="ml-2 text-xs text-red-500">(Deleted)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quantity: {item.quantity || item.qty} × ${(item.price || item.unitPrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${((item.price || item.unitPrice || 0) * (item.quantity || item.qty)).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Shipping Address */}
        {order && order.shippingAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-sm tracking-wider font-medium mb-4">SHIPPING ADDRESS</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && (
                <p className="text-sm text-gray-900">{order.shippingAddress.line2}</p>
              )}
              <p className="text-sm text-gray-900">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="text-sm text-gray-900">{order.shippingAddress.country}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => router.push('/skincare')}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-none text-xs tracking-[0.15em] font-light"
          >
            <ShoppingBag className="w-4 h-4 mr-2" strokeWidth={1.5} />
            CONTINUE SHOPPING
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/profile/orders')}
            className="flex-1 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white h-12 rounded-none text-xs tracking-[0.15em] font-light"
          >
            VIEW MY ORDERS
            <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-xs text-blue-800 text-center">
            You will receive an email confirmation shortly with your order details and tracking information.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

