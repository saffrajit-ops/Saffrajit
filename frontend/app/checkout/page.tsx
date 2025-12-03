'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Lock, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AddressSelector from '@/components/checkout/AddressSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import { useCartStore } from '@/lib/cart-store';
import { useCheckoutStore, CheckoutAddress } from '@/lib/checkout-store';
import { userAPI, couponAPI, paymentAPI } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth-store';
import { Spinner } from '@/components/ui/spinner';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { items, getTotalPrice } = useCartStore();
  const {
    cartItems,
    selectedAddressId,
    couponCode,
    couponDiscount,
    isProcessingPayment,
    setIsProcessingPayment,
    paymentError,
    setPaymentError,
    setCouponDiscount,
    setIsApplyingCoupon,
    setCartItems
  } = useCheckoutStore();

  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [allProductsSupportCOD, setAllProductsSupportCOD] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Sync cart items on mount
  useEffect(() => {
    if (items.length > 0) {
      setCartItems(items);
    }
  }, [items, setCartItems]);

  // Check if all products support COD
  useEffect(() => {
    const checkoutItems = cartItems.length > 0 ? cartItems : items;
    
    const allSupportCOD = checkoutItems.every(item =>
      item.cashOnDelivery?.enabled === true
    );
    
    setAllProductsSupportCOD(allSupportCOD);

    // If COD is not available, reset to card payment
    if (!allSupportCOD && paymentMethod === 'cod') {
      setPaymentMethod('card');
    }
  }, [items, cartItems, paymentMethod]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && cartItems.length === 0) {
      router.push('/skincare');
    }
  }, [items.length, cartItems.length, router]);

  // Load user addresses from API
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated) {
        setIsLoadingAddresses(false);
        return;
      }

      try {
        setIsLoadingAddresses(true);
        const response = await userAPI.getProfile();

        if (response.success && response.data?.user?.addresses) {
          const userAddresses = response.data.user.addresses.map((addr: any) => ({
            _id: addr._id,
            label: addr.label || 'Home',
            line1: addr.line1,
            line2: addr.line2,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            country: addr.country || 'US',
            isDefault: addr.isDefault || false
          }));

          setAddresses(userAddresses);

          // Auto-select default address if available
          const defaultAddress = userAddresses.find((addr: CheckoutAddress) => addr.isDefault);
          if (defaultAddress?._id) {
            useCheckoutStore.getState().setSelectedAddressId(defaultAddress._id);
          }
        }
      } catch (error: any) {
        console.error('Error loading addresses:', error);
        // Don't show error for unauthenticated users
        if (isAuthenticated) {
          setPaymentError('Failed to load addresses. Please try again.');
        }
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [isAuthenticated]);

  const handleAddAddress = async (address: Partial<CheckoutAddress>) => {
    setIsSavingAddress(true);
    try {
      // For authenticated users, save address to profile
      if (isAuthenticated) {
        const response = await userAPI.addAddress({
          label: address.label,
          line1: address.line1 || '',
          line2: address.line2,
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          country: address.country || 'US',
          isDefault: address.isDefault || false
        });

        if (response.success && response.data?.user) {
          // The backend returns the full user object with updated addresses array
          // Get the last address (newly added one) or find by matching data
          const userAddresses = response.data.user.addresses || [];

          // Find the newly added address - it should be the last one or match our input
          let newAddressData = userAddresses[userAddresses.length - 1];

          // If we have existing addresses, try to find the new one by comparing
          if (addresses.length > 0 && userAddresses.length > addresses.length) {
            // Get addresses that weren't in our list before
            const existingIds = new Set(addresses.map(a => a._id));
            newAddressData = userAddresses.find((addr: any) => !existingIds.has(addr._id)) || newAddressData;
          }

          if (newAddressData) {
            const newAddress: CheckoutAddress = {
              _id: newAddressData._id,
              label: newAddressData.label || 'Home',
              line1: newAddressData.line1,
              line2: newAddressData.line2,
              city: newAddressData.city,
              state: newAddressData.state,
              zip: newAddressData.zip,
              country: newAddressData.country || 'US',
              isDefault: newAddressData.isDefault || false
            };

            setAddresses([...addresses, newAddress]);

            // Auto-select the newly added address
            if (newAddress._id) {
              useCheckoutStore.getState().setSelectedAddressId(newAddress._id);
            }
          } else {
            // If we can't find the address, reload addresses from API
            const profileResponse = await userAPI.getProfile();
            if (profileResponse.success && profileResponse.data?.user?.addresses) {
              const updatedAddresses = profileResponse.data.user.addresses.map((addr: any) => ({
                _id: addr._id,
                label: addr.label || 'Home',
                line1: addr.line1,
                line2: addr.line2,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
                country: addr.country || 'US',
                isDefault: addr.isDefault || false
              }));
              setAddresses(updatedAddresses);
              // Select the last address
              if (updatedAddresses.length > 0) {
                useCheckoutStore.getState().setSelectedAddressId(updatedAddresses[updatedAddresses.length - 1]._id);
              }
            } else {
              throw new Error('Address was added but could not be retrieved');
            }
          }
        } else {
          throw new Error(response.message || 'Failed to add address');
        }
      } else {
        // For guest checkout, just add to local state
        const newAddress: CheckoutAddress = {
          _id: `guest_${Date.now()}`,
          label: address.label || 'Home',
          line1: address.line1 || '',
          line2: address.line2,
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          country: address.country || 'US',
          isDefault: false
        };

        setAddresses([...addresses, newAddress]);

        // Auto-select the newly added address
        if (newAddress._id) {
          useCheckoutStore.getState().setSelectedAddressId(newAddress._id);
        }
      }
    } catch (error: any) {
      console.error('Error adding address:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add address';
      throw new Error(errorMessage);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    setIsApplyingCoupon(true);
    try {
      const subtotal = getTotalPrice();
      const checkoutItems = cartItems.length > 0 ? cartItems : items;

      const itemsForCoupon = checkoutItems.map(item => ({
        productId: item.id,
        qty: item.quantity
      }));

      const response = await couponAPI.validateCoupon(code, subtotal, itemsForCoupon);

      if (response.success && response.data) {
        const discount = response.data.discount || 0;
        setCouponDiscount(discount);
        useCheckoutStore.getState().setCouponCode(code);

        return {
          valid: true,
          discount,
          message: `Coupon applied! You saved $${discount.toFixed(2)}.`
        };
      } else {
        setCouponDiscount(0);
        return {
          valid: false,
          discount: 0,
          message: response.message || 'This coupon code is invalid or has expired.'
        };
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      setCouponDiscount(0);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to validate coupon. Please try again.';
      return {
        valid: false,
        discount: 0,
        message: errorMessage
      };
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      setPaymentError('Please select or add a delivery address');
      return;
    }

    const checkoutItems = cartItems.length > 0 ? cartItems : items;
    if (checkoutItems.length === 0) {
      setPaymentError('Your cart is empty');
      return;
    }

    // Check if any item quantity exceeds available stock
    const itemsExceedingStock = checkoutItems.filter(item =>
      item.stock !== undefined && item.quantity > item.stock
    );

    if (itemsExceedingStock.length > 0) {
      const itemNames = itemsExceedingStock.map(item => item.name).join(', ');
      setPaymentError(`Some items exceed available stock: ${itemNames}. Please adjust quantities in your cart.`);
      return;
    }

    // Validate COD availability if COD is selected
    if (paymentMethod === 'cod' && !allProductsSupportCOD) {
      setPaymentError('Cash on Delivery is not available for some items in your cart');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Get selected address
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('Selected address not found');
      }

      // Prepare items for checkout
      const itemsForCheckout = checkoutItems.map(item => ({
        productId: item.id,
        qty: item.quantity
      }));

      const shippingAddress = {
        label: selectedAddress.label,
        line1: selectedAddress.line1,
        line2: selectedAddress.line2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country,
      };

      if (paymentMethod === 'cod') {
        // Create COD order
        const response = await paymentAPI.createCODOrder(
          itemsForCheckout,
          couponCode || undefined,
          shippingAddress
        );

        if (response.success) {
          // Clear cart and redirect to success page
          await useCartStore.getState().clearCart();
          router.push(`/order/success?order_id=${response.orderId}&payment_method=cod`);
        } else {
          throw new Error(response.message || 'Failed to create COD order');
        }
      } else {
        // Create Stripe checkout session
        const response = await paymentAPI.createCheckoutSession(
          itemsForCheckout,
          couponCode || undefined,
          shippingAddress
        );

        if (response.success) {
          if (response.isFreeOrder) {
            // Free order (100% discount) - redirect to success page
            router.push(`/order/success?order_id=${response.orderId}`);
          } else if (response.url) {
            // Redirect to Stripe Checkout
            window.location.href = response.url;
          } else {
            throw new Error('No checkout URL received from server');
          }
        } else {
          throw new Error(response.message || 'Failed to create checkout session');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      setPaymentError(errorMessage);

      // Don't reset processing state immediately - let user see the error
      setTimeout(() => {
        setIsProcessingPayment(false);
      }, 3000);
    }
  };

  const checkoutItems = cartItems.length > 0 ? cartItems : items;

  // Show loading while checking authentication
  if (!hasHydrated || (hasHydrated && !isAuthenticated)) {
    return null;
  }

  if (checkoutItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-xs tracking-wider font-light">BACK</span>
            </button>

            <h1 className="text-lg tracking-wider font-medium">SECURE CHECKOUT</h1>

            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Address Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                <h2 className="text-base tracking-wider font-medium">DELIVERY ADDRESS</h2>
              </div>

              <AddressSelector
                addresses={addresses}
                isLoading={isLoadingAddresses}
                onAddAddress={handleAddAddress}
                isSavingAddress={isSavingAddress}
              />

              {selectedAddressId && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <p className="text-sm text-green-700 font-light">
                    Address selected. Proceed to payment when ready.
                  </p>
                </motion.div>
              )}
            </motion.section>

            {/* Shipping Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 pb-8 border-b border-gray-200 lg:border-0"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                <h2 className="text-base tracking-wider font-medium">SHIPPING METHOD</h2>
              </div>

              <div className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Standard Shipping</p>
                    <p className="text-xs text-gray-500 mt-0.5">Free • Delivery in 5-7 business days</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Payment Method */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                <h2 className="text-base tracking-wider font-medium">PAYMENT METHOD</h2>
              </div>

              {/* Card Payment */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    }`}>
                    {paymentMethod === 'card' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500 mt-0.5">Visa, Mastercard, American Express</p>
                  </div>
                </div>
              </div>

              {/* Cash on Delivery */}
              {allProductsSupportCOD && (
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                      {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pay when your order is delivered</p>
                    </div>
                  </div>
                </div>
              )}

              {!allProductsSupportCOD && checkoutItems.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 mb-2">
                    💡 Cash on Delivery is not available for some items in your cart
                  </p>
                  <p className="text-xs text-amber-600">
                    Note: If you just enabled COD for products, please clear your cart and re-add the items.
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                {paymentMethod === 'card'
                  ? 'Your payment information is encrypted and secure'
                  : 'Pay cash when your order is delivered to your doorstep'}
              </p>
            </motion.section>

            {/* Error Message */}
            {paymentError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-sm text-red-700 font-light">{paymentError}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-32 lg:h-fit"
          >
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <h3 className="text-sm tracking-wider font-medium mb-6">ORDER SUMMARY</h3>
              <OrderSummary
                isLoading={isLoadingAddresses}
                onPayment={handlePayment}
                isProcessing={isProcessingPayment}
                onApplyCoupon={handleApplyCoupon}
              />

              {/* Processing Payment Overlay */}
              {isProcessingPayment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
                    <Spinner className="w-8 h-8 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                    <p className="text-sm text-gray-600">Please wait while we redirect you to secure payment...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
