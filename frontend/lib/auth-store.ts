import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: {
    url: string;
  };
  isEmailVerified: boolean;
  isActive: boolean;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // Clear cart when logging out
        if (typeof window !== 'undefined') {
          const cartStore = localStorage.getItem('cart-storage');
          if (cartStore) {
            try {
              const parsed = JSON.parse(cartStore);
              parsed.state.items = [];
              parsed.state.toasts = [];
              localStorage.setItem('cart-storage', JSON.stringify(parsed));
            } catch (e) {
              // If parsing fails, just remove the cart storage
              localStorage.removeItem('cart-storage');
            }
          }
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (userData: Partial<User>) => {
        set((state: AuthStore) => {
          const updatedUser = state.user ? { ...state.user, ...userData } : null;
          return {
            user: updatedUser,
            isAuthenticated: !!(state.token && updatedUser),
          };
        });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      // Custom merge function to ensure isAuthenticated is computed on hydration
      merge: (persistedState: any, currentState: any) => {
        const token = persistedState?.token || null;
        const user = persistedState?.user || null;
        return {
          ...currentState,
          ...persistedState,
          isAuthenticated: !!(token && user),
          hasHydrated: true,
        };
      },
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated when rehydration completes
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

