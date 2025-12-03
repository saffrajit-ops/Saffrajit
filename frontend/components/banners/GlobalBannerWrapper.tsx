"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PopupBanner } from './PopupBanner'
import { SidebarBanner } from './SidebarBanner'
import { trackVisit } from '@/lib/banner-triggers'

export function GlobalBannerWrapper() {
    const pathname = usePathname()
    const [key, setKey] = useState(0)
    
    // Track visit on mount for returning user detection
    useEffect(() => {
        trackVisit()
    }, [])

    // Determine current page from pathname based on actual site structure
    const getPageName = () => {
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
        
        return 'home'
    }

    const currentPage = getPageName()

    // Force re-render when pathname changes
    useEffect(() => {
        setKey(prev => prev + 1)
    }, [pathname])

    return (
        <>
            {/* Popup Banner - Page-specific or global */}
            <PopupBanner key={`popup-${key}`} page={currentPage} />

            {/* Sidebar Banner - Page-specific or global */}
            <SidebarBanner key={`sidebar-${key}`} page={currentPage} />
        </>
    )
}
