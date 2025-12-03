'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { useCheckoutStore } from '@/lib/checkout-store';
import { useAuthStore } from '@/lib/auth-store';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, toggleCart, increaseQuantity, decreaseQuantity, removeItem, getTotalPrice, getTotalItems, getTotalDiscount, getTotalShipping, getFinalTotal, isItemLoading, isLoading } = useCartStore();
  const { setCartItems } = useCheckoutStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal = getTotalPrice();
  const totalDiscount = getTotalDiscount();
  const totalShipping = getTotalShipping();
  const finalTotal = getFinalTotal();
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

  const handleCheckout = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toggleCart();
      router.push('/login?redirect=/checkout');
      return;
    }

    // Sync cart items to checkout store before navigating
    setCartItems(items);
    toggleCart();
    router.push('/checkout');
  };

  // Don't render drawer if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <h2 className="text-lg tracking-wider font-medium">
                  SHOPPING BAG ({totalItems})
                </h2>
              </div>
              <button
                onClick={toggleCart}
                className="hover:opacity-60 transition-opacity"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
                  <p className="text-gray-600 mb-2">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Add some luxury products to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const exceedsStock = item.stock !== undefined && item.quantity > item.stock;
                    return (
                      <div
                        key={item.cartItemId || `${item.id}`}
                        className={`flex gap-4 pb-4 border-b border-gray-100 last:border-0 ${exceedsStock ? 'bg-red-50 -mx-4 px-4 py-2' : ''}`}
                      >
                        {/* Product Image */}
                        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
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
                              <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-light text-gray-900 mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 tracking-wider mb-2">
                            {item.category}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            {item.price}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-gray-200">
                                <button
                                  onClick={() => decreaseQuantity(item.id, 1)}
                                  className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1 || isItemLoading(item.id)}
                                >
                                  {isItemLoading(item.id) ? (
                                    <Spinner className="w-3 h-3" />
                                  ) : (
                                    <Minus className="w-3 h-3" strokeWidth={1.5} />
                                  )}
                                </button>
                                <span className="px-3 text-sm min-w-[2ch] text-center">
                                  {isItemLoading(item.id) ? <Spinner className="w-3 h-3 inline" /> : item.quantity}
                                </span>
                                <button
                                  onClick={() => increaseQuantity(item.id, 1)}
                                  className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isItemLoading(item.id) || (item.stock !== undefined && item.quantity >= item.stock)}
                                >
                                  {isItemLoading(item.id) ? (
                                    <Spinner className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" strokeWidth={1.5} />
                                  )}
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                disabled={isItemLoading(item.id)}
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                            </div>
                            {item.stock !== undefined && item.quantity > item.stock && (
                              <p className="text-[10px] text-red-600 font-medium">
                                ⚠️ Quantity exceeds stock! Only {item.stock} available
                              </p>
                            )}
                            {item.stock !== undefined && item.stock <= 2 && item.stock > 0 && item.quantity <= item.stock && (
                              <p className="text-[10px] text-orange-600">
                                Only {item.stock} left in stock
                              </p>
                            )}
                            {item.stock !== undefined && item.quantity === item.stock && item.stock > 2 && (
                              <p className="text-[10px] text-red-600">
                                Maximum stock reached
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount */}
                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Product Discount</span>
                      <span className="font-medium text-green-600">
                        -${totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Shipping */}
                  {totalShipping > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-gray-900">
                        ${totalShipping.toFixed(2)}
                      </span>
                    </div>
                  ) : hasFreeShipping ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Shipping</span>
                      <span className="font-medium text-green-600">
                        FREE ✓
                      </span>
                    </div>
                  ) : null}

                  {/* Total */}
                  <div className="flex items-center justify-between text-base pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold tracking-wider">TOTAL</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Taxes calculated at checkout
                </p>

                {/* Stock Issue Warning */}
                {hasStockIssue && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs text-red-600 text-center">
                      Some items exceed available stock. Please adjust quantities before checkout.
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading || hasStockIssue}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-none text-xs tracking-[0.15em] font-light disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>LOADING...</span>
                    </>
                  ) : (
                    'PROCEED TO CHECKOUT'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleCart}
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-12 rounded-none text-xs tracking-[0.15em] font-light"
                >
                  CONTINUE SHOPPING
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
