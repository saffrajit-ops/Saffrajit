"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/user-tracking'

/**
 * PageTracker Component
 * Automatically tracks page views when pathname changes
 */
export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      // Convert pathname to page name
      const pageName = getPageNameFromPath(pathname)
      trackPageView(pageName)
    }
  }, [pathname])

  return null // This component doesn't render anything
}

function getPageNameFromPath(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname === '/skincare') return 'skincare'
  if (pathname === '/gifts') return 'gifts'
  if (pathname.startsWith('/product/')) return 'product-detail'
  if (pathname === '/checkout') return 'checkout'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname === '/about') return 'about'
  if (pathname === '/cana-gold-story') return 'cana-gold-story'
  if (pathname === '/our-ingredients') return 'our-ingredients'
  if (pathname === '/contact') return 'contact'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname === '/faq') return 'faq'
  if (pathname === '/shipping') return 'shipping'
  if (pathname === '/privacy') return 'privacy'
  if (pathname === '/terms') return 'terms'
  if (pathname === '/login') return 'login'
  if (pathname === '/register') return 'register'
  if (pathname === '/order-confirmation') return 'order-confirmation'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/cart')) return 'cart'
  
  return pathname.replace(/^\//, '').replace(/\//g, '-') || 'home'
}
