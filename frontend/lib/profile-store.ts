import { create } from 'zustand';
import { userAPI, orderAPI } from './api/client';

export interface Address {
  _id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  product: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images?: Array<{ url: string }>;
  };
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  status: string;
  total: number;
  subtotal: number;
  shipping?: {
    trackingNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
}

interface ProfileStore {
  profile: UserProfile | null;
  addresses: Address[];
  orders: Order[];
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<Address, '_id'>) => Promise<void>;
  updateAddress: (addressId: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  addresses: [],
  orders: [],
  isLoading: false,

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const response = await userAPI.getProfile();
      if (response.success && response.data?.user) {
        const user = response.data.user;
        set({
          profile: {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          },
          addresses: user.addresses || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAddresses: async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.success && response.data?.user) {
        set({ addresses: response.data.user.addresses || [] });
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  },

  fetchOrders: async () => {
    try {
      set({ isLoading: true });
      const response = await orderAPI.getUserOrders({ limit: 50 });
      if (response.success && response.data) {
        set({ orders: Array.isArray(response.data) ? response.data : [] });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (profileData: Partial<UserProfile>) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });

      if (response.success && response.data?.user) {
        const user = response.data.user;
        set({
          profile: {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          },
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addAddress: async (address: Omit<Address, '_id'>) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.addAddress(address);

      if (response.success && response.data?.user) {
        set({ addresses: response.data.user.addresses || [] });
      }
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAddress: async (addressId: string, address: Partial<Address>) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.updateAddress(addressId, address);

      if (response.success && response.data?.user) {
        set({ addresses: response.data.user.addresses || [] });
      }
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAddress: async (addressId: string) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.deleteAddress(addressId);

      if (response.success && response.data?.user) {
        set({ addresses: response.data.user.addresses || [] });
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setDefaultAddress: async (addressId: string) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.updateAddress(addressId, { isDefault: true });

      if (response.success && response.data?.user) {
        set({ addresses: response.data.user.addresses || [] });
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
