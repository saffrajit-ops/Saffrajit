'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { authAPI } from '@/lib/api/client';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { token, user, setAuth, setLoading, logout, hasHydrated, isAuthenticated } = useAuthStore();
  const { syncCart, clearCart } = useCartStore();
  const initialized = useRef(false);
  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    // Wait for hydration to complete
    if (!hasHydrated) return;

    // Only initialize once
    if (initialized.current) return;

    // If we have a token but no user, fetch user data
    if (token && !user) {
      initialized.current = true;

      const initializeAuth = async () => {
        try {
          setLoading(true);
          const response = await authAPI.getMe();
          if (response.success && response.data?.user) {
            setAuth(response.data.user, token);
            // Sync cart after successful authentication
            await syncCart();
          } else {
            // Invalid response, clear auth
            logout();
          }
        } catch (error) {
          // Token might be invalid, clear it
          logout();
        } finally {
          setLoading(false);
        }
      };

      initializeAuth();
    } else if (!token && user) {
      // No token but user exists, clear user
      initialized.current = true;
      logout();
    } else {
      initialized.current = true;
    }
  }, [hasHydrated, token, user, setAuth, setLoading, logout, syncCart]);

  // Sync cart when user logs in
  useEffect(() => {
    if (hasHydrated && token && user) {
      syncCart();
    }
  }, [hasHydrated, token, user, syncCart]);

  // Clear cart when user logs out
  useEffect(() => {
    if (hasHydrated) {
      // If user was authenticated but now is not, clear the cart
      if (wasAuthenticated.current && !isAuthenticated) {
        clearCart();
      }
      wasAuthenticated.current = isAuthenticated;
    }
  }, [hasHydrated, isAuthenticated, clearCart]);

  return <>{children}</>;
}

