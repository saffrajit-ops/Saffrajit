import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './products-data';
import { cartAPI } from './api/client';
import { useAuthStore } from './auth-store';

interface CartItem extends Product {
  quantity: number;
  cartItemId?: string; // Backend cart item ID
  stock?: number;
  discount?: {
    value: number;
    type: "percentage" | "fixed";
  };
  shipping?: {
    charges: number;
    freeShippingThreshold: number;
    freeShippingMinQuantity: number;
  };
  cashOnDelivery?: {
    enabled: boolean;
  };
  returnPolicy?: {
    returnable: boolean;
    returnWindowDays: number;
  };
}

export type { CartItem };

interface Toast {
  id: string;
  productName: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  toasts: Toast[];
  isLoading: boolean;
  loadingItems: Set<string>; // Track which items are currently being added/updated
  redirectToLogin: (() => void) | null;
  setRedirectToLogin: (callback: (() => void) | null) => void;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  increaseQuantity: (productId: string, amount?: number) => Promise<void>;
  decreaseQuantity: (productId: string, amount?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalDiscount: () => number;
  getTotalShipping: () => number;
  getFinalTotal: () => number;
  removeToast: (id: string) => void;
  syncCart: () => Promise<void>;
  isItemLoading: (productId: string) => boolean;
}

// Helper function to convert backend cart item to frontend format
const convertBackendCartItem = (item: any): CartItem => {
  const product = item.productId || {};
  return {
    id: product._id || product.id,
    slug: product.slug || '',
    name: item.titleSnapshot || product.title || '',
    category: product.categories?.[0] || product.collection || 'Uncategorized',
    price: `$${(item.priceSnapshot || product.price || 0).toFixed(2)}`,
    image: product.images?.[0]?.url || product.images?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    type: product.type || 'single',
    quantity: item.qty || item.quantity || 1,
    cartItemId: item._id,
    stock: product.stock,
    images: product.images?.map((img: any) => (typeof img === 'string' ? img : (img?.url || ''))) || [],
    discount: product.discount ? {
      value: product.discount.value || 0,
      type: product.discount.type || 'percentage'
    } : undefined,
    shipping: product.shipping ? {
      charges: product.shipping.charges || 0,
      freeShippingThreshold: product.shipping.freeShippingThreshold || 0,
      freeShippingMinQuantity: product.shipping.freeShippingMinQuantity || 0
    } : undefined,
    cashOnDelivery: product.cashOnDelivery ? {
      enabled: product.cashOnDelivery.enabled || false
    } : undefined,
    returnPolicy: product.returnPolicy ? {
      returnable: product.returnPolicy.returnable !== false,
      returnWindowDays: product.returnPolicy.returnWindowDays || 7
    } : undefined,
  };
};

// Helper to merge duplicate items by product id (summing quantities)
const mergeItemsById = (items: CartItem[]): CartItem[] => {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const key = item.id;
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      merged.set(key, { ...item });
    }
  }
  return Array.from(merged.values());
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      toasts: [],
      isLoading: false,
      loadingItems: new Set<string>(),
      redirectToLogin: null,

      setRedirectToLogin: (callback: (() => void) | null) => {
        set({ redirectToLogin: callback });
      },

      addItem: async (product: Product, quantity: number = 1) => {
        const productId = product.id;
        const loadingItems = get().loadingItems;

        // Prevent duplicate calls for the same product
        if (loadingItems.has(productId)) {
          return;
        }

        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        // Redirect to login if not authenticated
        if (!isAuthenticated) {
          const redirectCallback = get().redirectToLogin;
          if (redirectCallback) {
            redirectCallback();
          }
          return;
        }

        const newToast: Toast = {
          id: Date.now().toString() + Math.random(),
          productName: product.name,
        };

        // Mark item as loading
        set({
          loadingItems: new Set(Array.from(loadingItems).concat(productId)),
          isLoading: true
        });

        try {
          if (isAuthenticated) {
            // Use backend API
            const response = await cartAPI.addToCart(productId, quantity);

            if (response.success && response.data?.cart) {
              const backendItems = response.data.cart.items || [];
              const convertedItems = backendItems.map(convertBackendCartItem);
              const newLoadingItems = new Set(loadingItems);
              newLoadingItems.delete(productId);

              set({
                items: mergeItemsById(convertedItems),
                toasts: [...get().toasts, newToast],
                isLoading: false,
                loadingItems: newLoadingItems,
              });
              
              // Track add to cart action
              if (typeof window !== 'undefined') {
                try {
                  const { trackAddToCart } = await import('@/lib/user-tracking');
                  trackAddToCart(productId, product.name);
                } catch (err) {
                  console.error('Failed to track add to cart:', err);
                }
              }
            } else {
              throw new Error(response.message || 'Failed to add item to cart');
            }
          } else {
            // Use local storage (fallback for non-authenticated users)
            const newLoadingItems = new Set(loadingItems);
            newLoadingItems.delete(productId);

            set((state) => {
              const existingIndex = state.items.findIndex((i) => i.id === productId);
              let nextItems: CartItem[];
              if (existingIndex > -1) {
                nextItems = state.items.map((i, idx) =>
                  idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
                );
              } else {
                nextItems = [...state.items, { ...product, quantity } as CartItem];
              }
              return {
                items: mergeItemsById(nextItems),
                toasts: [...state.toasts, newToast],
                isLoading: false,
                loadingItems: newLoadingItems,
              };
            });
          }
        } catch (error: any) {
          console.error('Failed to add item to cart:', error);
          const newLoadingItems = new Set(loadingItems);
          newLoadingItems.delete(productId);

          // Fallback to local storage on error (functional update to avoid races)
          set((state) => {
            const existingIndex = state.items.findIndex((i) => i.id === productId);
            let nextItems: CartItem[];
            if (existingIndex > -1) {
              nextItems = state.items.map((i, idx) =>
                idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
              );
            } else {
              nextItems = [...state.items, { ...product, quantity } as CartItem];
            }
            return {
              items: mergeItemsById(nextItems),
              toasts: [...state.toasts, newToast],
              isLoading: false,
              loadingItems: newLoadingItems,
            };
          });
        }
      },

      removeItem: async (productId: string) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const items = get().items;
        const item = items.find((item) => item.id === productId);

        try {
          if (isAuthenticated && item?.cartItemId) {
            // Use backend API
            set({ isLoading: true });
            const response = await cartAPI.removeFromCart(item.cartItemId);

            if (response.success && response.data?.cart) {
              const backendItems = response.data.cart.items || [];
              const convertedItems = backendItems.map(convertBackendCartItem);
              set({
                items: mergeItemsById(convertedItems),
                isLoading: false,
              });
            } else {
              throw new Error(response.message || 'Failed to remove item');
            }
          } else {
            // Use local storage
            set({ items: items.filter((item) => item.id !== productId) });
          }
        } catch (error: any) {
          console.error('Failed to remove item from cart:', error);
          set({ isLoading: false });
          // Fallback to local storage
          set({ items: items.filter((item) => item.id !== productId) });
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const items = get().items;
        const item = items.find((item) => item.id === productId);
        const loadingItems = get().loadingItems;

        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        // Prevent duplicate calls
        if (loadingItems.has(productId)) {
          return;
        }

        // Mark item as loading (don't set global isLoading for individual items)
        set({
          loadingItems: new Set(Array.from(loadingItems).concat(productId))
        });

        try {
          if (isAuthenticated && item?.cartItemId) {
            // Use backend API
            const response = await cartAPI.updateCartItem(item.cartItemId, quantity);

            if (response.success && response.data?.cart) {
              const backendItems = response.data.cart.items || [];
              const convertedItems = backendItems.map(convertBackendCartItem);
              const newLoadingItems = new Set(loadingItems);
              newLoadingItems.delete(productId);

              set({
                items: mergeItemsById(convertedItems),
                loadingItems: newLoadingItems,
              });
            } else {
              throw new Error(response.message || 'Failed to update quantity');
            }
          } else {
            // Use local storage
            const newLoadingItems = new Set(loadingItems);
            newLoadingItems.delete(productId);

            set({
              items: items.map((item) =>
                item.id === productId ? { ...item, quantity } : item
              ),
              loadingItems: newLoadingItems,
            });
          }
        } catch (error: any) {
          console.error('Failed to update quantity:', error);
          const newLoadingItems = new Set(loadingItems);
          newLoadingItems.delete(productId);

          // Fallback to local storage
          set({
            items: items.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            ),
            loadingItems: newLoadingItems,
          });
        }
      },

      increaseQuantity: async (productId: string, amount: number = 1) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const items = get().items;
        const item = items.find((item) => item.id === productId);

        if (!item) return;

        // Prevent duplicate calls - check and set atomically
        const loadingKey = item.cartItemId || productId;
        const currentLoadingItems = get().loadingItems;

        if (currentLoadingItems.has(loadingKey)) {
          return;
        }

        // Mark item as loading atomically (don't set global isLoading for individual items)
        set({
          loadingItems: new Set(Array.from(currentLoadingItems).concat(loadingKey))
        });

        try {
          if (isAuthenticated && item?.cartItemId) {
            // Use backend API - atomic increment
            const response = await cartAPI.increaseQuantity(item.cartItemId, amount);

            if (response.success && response.data?.cart) {
              const backendItems = response.data.cart.items || [];
              const convertedItems = backendItems.map(convertBackendCartItem);
              const updatedLoadingItems = get().loadingItems;
              const newLoadingItems = new Set(updatedLoadingItems);
              newLoadingItems.delete(loadingKey);

              set({
                items: mergeItemsById(convertedItems),
                loadingItems: newLoadingItems,
              });
            } else {
              throw new Error(response.message || 'Failed to increase quantity');
            }
          } else {
            // Use local storage
            const updatedLoadingItems = get().loadingItems;
            const newLoadingItems = new Set(updatedLoadingItems);
            newLoadingItems.delete(loadingKey);

            set({
              items: items.map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity + amount } : item
              ),
              loadingItems: newLoadingItems,
            });
          }
        } catch (error: any) {
          console.error('Failed to increase quantity:', error);
          const updatedLoadingItems = get().loadingItems;
          const newLoadingItems = new Set(updatedLoadingItems);
          newLoadingItems.delete(loadingKey);

          // Fallback to local storage
          set({
            items: items.map((item) =>
              item.id === productId ? { ...item, quantity: item.quantity + amount } : item
            ),
            loadingItems: newLoadingItems,
          });
        }
      },

      decreaseQuantity: async (productId: string, amount: number = 1) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const items = get().items;
        const item = items.find((item) => item.id === productId);

        if (!item) return;

        // Prevent duplicate calls - check and set atomically
        const loadingKey = item.cartItemId || productId;
        const currentLoadingItems = get().loadingItems;

        if (currentLoadingItems.has(loadingKey)) {
          return;
        }

        // Mark item as loading atomically (don't set global isLoading for individual items)
        set({
          loadingItems: new Set(Array.from(currentLoadingItems).concat(loadingKey))
        });

        try {
          if (isAuthenticated && item?.cartItemId) {
            // Use backend API - atomic decrement
            const response = await cartAPI.decreaseQuantity(item.cartItemId, amount);

            if (response.success && response.data?.cart) {
              const backendItems = response.data.cart.items || [];
              const convertedItems = backendItems.map(convertBackendCartItem);
              const updatedLoadingItems = get().loadingItems;
              const newLoadingItems = new Set(updatedLoadingItems);
              newLoadingItems.delete(loadingKey);

              set({
                items: mergeItemsById(convertedItems),
                loadingItems: newLoadingItems,
              });
            } else {
              throw new Error(response.message || 'Failed to decrease quantity');
            }
          } else {
            // Use local storage
            const updatedLoadingItems = get().loadingItems;
            const newLoadingItems = new Set(updatedLoadingItems);
            newLoadingItems.delete(loadingKey);

            const newQuantity = Math.max(0, item.quantity - amount);
            if (newQuantity <= 0) {
              set({
                items: items.filter((item) => item.id !== productId),
                loadingItems: newLoadingItems,
              });
            } else {
              set({
                items: items.map((item) =>
                  item.id === productId ? { ...item, quantity: newQuantity } : item
                ),
                loadingItems: newLoadingItems,
              });
            }
          }
        } catch (error: any) {
          console.error('Failed to decrease quantity:', error);
          const updatedLoadingItems = get().loadingItems;
          const newLoadingItems = new Set(updatedLoadingItems);
          newLoadingItems.delete(loadingKey);

          // Fallback to local storage
          const newQuantity = Math.max(0, item.quantity - amount);
          if (newQuantity <= 0) {
            set({
              items: items.filter((item) => item.id !== productId),
              loadingItems: newLoadingItems,
            });
          } else {
            set({
              items: items.map((item) =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
              ),
              loadingItems: newLoadingItems,
            });
          }
        }
      },

      clearCart: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        try {
          if (isAuthenticated) {
            // Use backend API
            set({ isLoading: true });
            await cartAPI.clearCart();
            set({
              items: [],
              isOpen: false,
              isLoading: false,
            });
          } else {
            // Use local storage
            set({
              items: [],
              isOpen: false,
            });
          }
        } catch (error: any) {
          console.error('Failed to clear cart:', error);
          set({ isLoading: false });
          // Fallback to local storage
          set({
            items: [],
            isOpen: false,
          });
        }
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
          const price = parseFloat(
            priceStr.replace('$', '').replace(',', '')
          );
          return total + price * item.quantity;
        }, 0);
      },

      getTotalDiscount: () => {
        return get().items.reduce((total, item) => {
          if (!item.discount || item.discount.value <= 0) return total;

          const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
          const price = parseFloat(priceStr.replace('$', '').replace(',', ''));

          let discountPerItem = 0;
          if (item.discount.type === 'percentage') {
            discountPerItem = (price * item.discount.value) / 100;
          } else {
            discountPerItem = item.discount.value;
          }

          return total + (discountPerItem * item.quantity);
        }, 0);
      },

      getTotalShipping: () => {
        const items = get().items;
        const subtotal = get().getTotalPrice();
        const totalQuantity = get().getTotalItems();

        let totalShipping = 0;

        for (const item of items) {
          if (!item.shipping || item.shipping.charges <= 0) continue;

          // Check free shipping conditions
          const isFreeByThreshold = item.shipping.freeShippingThreshold > 0 &&
            subtotal >= item.shipping.freeShippingThreshold;
          const isFreeByQuantity = item.shipping.freeShippingMinQuantity > 0 &&
            totalQuantity >= item.shipping.freeShippingMinQuantity;

          // If either condition is met, shipping is free
          if (!isFreeByThreshold && !isFreeByQuantity) {
            totalShipping += item.shipping.charges;
          }
        }

        return totalShipping;
      },

      getFinalTotal: () => {
        const subtotal = get().getTotalPrice();
        const discount = get().getTotalDiscount();
        const shipping = get().getTotalShipping();
        return Math.max(0, subtotal - discount + shipping);
      },

      removeToast: (id) => {
        set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
      },

      syncCart: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (!isAuthenticated) {
          return;
        }

        try {
          set({ isLoading: true });
          const response = await cartAPI.getCart();

          if (response.success && response.data?.cart) {
            const backendItems = response.data.cart.items || [];
            const convertedItems = backendItems.map(convertBackendCartItem);
            set({
              items: mergeItemsById(convertedItems),
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('Failed to sync cart:', error);
          set({ isLoading: false });
        }
      },

      isItemLoading: (productId: string) => {
        const items = get().items;
        const item = items.find((item) => item.id === productId);
        // Check both productId and cartItemId for loading state
        const loadingKey = item?.cartItemId || productId;
        return get().loadingItems.has(loadingKey) || get().loadingItems.has(productId);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        isOpen: state.isOpen,
        toasts: state.toasts,
        // Exclude loadingItems, isLoading, and redirectToLogin from persistence (runtime state only)
      }),
    }
  )
);
