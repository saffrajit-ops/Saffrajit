import { create } from 'zustand';
import { CartItem } from './cart-store';

export interface CheckoutAddress {
  _id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface CheckoutState {
  cartItems: CartItem[]; // Synced cart items for checkout
  selectedAddressId: string | null;
  showAddressForm: boolean;
  newAddress: Partial<CheckoutAddress>;
  couponCode: string;
  couponDiscount: number;
  isApplyingCoupon: boolean;
  isProcessingPayment: boolean;
  paymentError: string | null;
  
  setCartItems: (items: CartItem[]) => void;
  setSelectedAddressId: (id: string) => void;
  setShowAddressForm: (show: boolean) => void;
  setNewAddress: (address: Partial<CheckoutAddress>) => void;
  resetNewAddress: () => void;
  setCouponCode: (code: string) => void;
  setCouponDiscount: (discount: number) => void;
  setIsApplyingCoupon: (loading: boolean) => void;
  setIsProcessingPayment: (processing: boolean) => void;
  setPaymentError: (error: string | null) => void;
  reset: () => void;
}

const initialNewAddress: Partial<CheckoutAddress> = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  isDefault: false
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  cartItems: [],
  selectedAddressId: null,
  showAddressForm: false,
  newAddress: initialNewAddress,
  couponCode: '',
  couponDiscount: 0,
  isApplyingCoupon: false,
  isProcessingPayment: false,
  paymentError: null,
  
  setCartItems: (items: CartItem[]) => set({ cartItems: items }),
  
  setSelectedAddressId: (id: string) => set({ selectedAddressId: id }),
  
  setShowAddressForm: (show: boolean) => set({ showAddressForm: show }),
  
  setNewAddress: (address: Partial<CheckoutAddress>) =>
    set((state) => ({
      newAddress: { ...state.newAddress, ...address }
    })),
  
  resetNewAddress: () => set({ newAddress: initialNewAddress }),
  
  setCouponCode: (code: string) => set({ couponCode: code }),
  
  setCouponDiscount: (discount: number) => set({ couponDiscount: discount }),
  
  setIsApplyingCoupon: (loading: boolean) => set({ isApplyingCoupon: loading }),
  
  setIsProcessingPayment: (processing: boolean) => set({ isProcessingPayment: processing }),
  
  setPaymentError: (error: string | null) => set({ paymentError: error }),
  
  reset: () => set({
    cartItems: [],
    selectedAddressId: null,
    showAddressForm: false,
    newAddress: initialNewAddress,
    couponCode: '',
    couponDiscount: 0,
    isApplyingCoupon: false,
    isProcessingPayment: false,
    paymentError: null
  })
}));
