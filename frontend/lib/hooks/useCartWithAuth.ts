import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';

/**
 * Hook that sets up cart authentication redirect
 * Use this in components where users can add items to cart
 */
export function useCartWithAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const setRedirectToLogin = useCartStore((state) => state.setRedirectToLogin);

  useEffect(() => {
    // Set up redirect callback
    setRedirectToLogin(() => {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    });

    // Cleanup
    return () => {
      setRedirectToLogin(null);
    };
  }, [router, pathname, setRedirectToLogin]);
}
