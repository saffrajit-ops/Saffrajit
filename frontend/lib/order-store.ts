import { create } from 'zustand';

export interface OrderItem {
  _id?: string;
  productId: string;
  title: string;
  price: number;
  qty: number;
  variant?: {
    shade?: string;
    size?: string;
    skinType?: string;
  };
  product?: {
    _id?: string;
    title?: string;
    sku?: string;
    images?: Array<{
      url: string;
      altText?: string;
    }>;
  } | null;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface OrderAddress {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderState {
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  setCurrentOrder: (order: Order) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrder: null,
  isLoading: false,
  error: null,
  
  setCurrentOrder: (order: Order) => set({ currentOrder: order }),
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  reset: () => set({
    currentOrder: null,
    isLoading: false,
    error: null
  })
}));
