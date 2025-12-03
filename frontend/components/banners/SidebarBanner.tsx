"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import {
  Banner,
  shouldShowBanner,
  setupScrollTrigger,
  setupExitIntentTrigger,
  setupAddToCartTrigger,
  getDeviceType,
  getUserType,
  isUserLoggedIn
} from "@/lib/banner-triggers"

interface SidebarBannerProps {
  page?: string
  productData?: {
    isOutOfStock?: boolean
    codAvailable?: boolean
    categoryId?: string
  }
}

export function SidebarBanner({ page = 'home', productData }: SidebarBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Reset state when page changes
    setBanner(null)
    setIsOpen(false)
    setIsLoading(true)
    setShouldShow(false)

    fetchBanner()
  }, [page])
  
  useEffect(() => {
    if (!banner || !shouldShow) return
    
    // Setup behavior triggers
    const cleanup = setupBehaviorTriggers(banner)
    
    // Cleanup on unmount or when banner changes
    return cleanup
  }, [banner, shouldShow])

  const fetchBanner = async () => {
    try {
      // Build query params with context
      const params = new URLSearchParams({
        type: 'sidebar',
        page: page,
        deviceType: getDeviceType(),
        isLoggedIn: isUserLoggedIn().toString(),
        userType: getUserType()
      })

      if (productData?.categoryId) {
        params.append('categoryId', productData.categoryId)
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/banners/active?${params.toString()}`
      console.log('🎯 Fetching sidebar banner:', apiUrl)
      console.log('📍 Current page:', page)
      console.log('📱 Device type:', getDeviceType())
      console.log('👤 User type:', getUserType())
      console.log('🔐 Is logged in:', isUserLoggedIn())

      const response = await fetch(apiUrl)
      const data = await response.json()
      
      console.log('📦 Banner API response:', data)
      
      if (data.success && data.data.length > 0) {
        const fetchedBanner = data.data[0]
        console.log('🎨 Fetched banner:', fetchedBanner)
        console.log('🎯 Banner triggers:', fetchedBanner.triggers)
        
        // Client-side trigger evaluation
        const shouldShow = shouldShowBanner(fetchedBanner, { productData })
        console.log('✅ Should show banner:', shouldShow)
        
        if (shouldShow) {
          setBanner(fetchedBanner)
          setShouldShow(true)
          trackView(fetchedBanner._id)
          console.log('🎉 Banner set and will be displayed!')
        } else {
          console.log('❌ Banner failed client-side trigger evaluation')
        }
      } else {
        console.log('⚠️ No banners returned from API')
        setBanner(null)
      }
    } catch (error) {
      console.error("❌ Failed to fetch sidebar banner:", error)
      setBanner(null)
    } finally {
      setIsLoading(false)
    }
  }

  const setupBehaviorTriggers = (banner: Banner) => {
    const cleanups: (() => void)[] = []
    let hasAnyBehaviorTrigger = false

    if (banner.triggers?.behavior?.enabled) {
      // Scroll trigger
      if (banner.triggers.behavior.scrollPercentage && banner.triggers.behavior.scrollPercentage > 0) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupScrollTrigger(() => {
          if (!isOpen) setIsOpen(true)
        }, banner.triggers.behavior.scrollPercentage)
        cleanups.push(cleanup)
      }

      // Exit intent trigger
      if (banner.triggers.behavior.exitIntent) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupExitIntentTrigger(() => {
          if (!isOpen) setIsOpen(true)
        })
        cleanups.push(cleanup)
      }

      // Add to cart trigger
      if (banner.triggers.behavior.addToCart) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupAddToCartTrigger(() => {
          if (!isOpen) setIsOpen(true)
        })
        cleanups.push(cleanup)
      }
    }

    // If no behavior triggers are set, show immediately after 2 seconds (default)
    if (!hasAnyBehaviorTrigger) {
      const timer = setTimeout(() => setIsOpen(true), 2000)
      cleanups.push(() => clearTimeout(timer))
    }

    // Cleanup on unmount
    return () => cleanups.forEach(cleanup => cleanup())
  }

  const trackView = async (bannerId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/banners/${bannerId}/view`,
        { method: "POST" }
      )
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  }

  const trackClick = async (bannerId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/banners/${bannerId}/click`,
        { method: "POST" }
      )
    } catch (error) {
      console.error("Failed to track click:", error)
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (isLoading || !banner || !shouldShow) {
    return null
  }

  return (
    <>
      {/* Sidebar Banner - Left Bottom Corner, Small Horizontal */}
      <div
        className={`fixed bottom-4 left-4 z-40 transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ width: 'min(380px, calc(100vw - 2rem))' }}
      >
        <div className="bg-white shadow-2xl p-3 border-2 border-amber-200">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center hover:from-amber-700 hover:to-amber-900 transition-all hover:scale-110 z-10 shadow-md"
            aria-label="Close"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Banner Content - Horizontal Layout */}
          <Link
            href={banner.link || "#"}
            onClick={() => trackClick(banner._id)}
            className="block"
          >
            {/* Image with horizontal aspect ratio */}
            <div className="relative w-full aspect-[3/1] overflow-hidden border-2 border-amber-100">
              <Image
                src={banner.image.url}
                alt={banner.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Text Content Below Image */}
            <div className="mt-2 text-center px-1">
              <h3 className="text-sm font-bold mb-1 text-gray-900 line-clamp-1">{banner.title}</h3>
              {banner.description && (
                <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">
                  {banner.description}
                </p>
              )}
              {banner.linkText && (
                <span className="inline-block bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white px-4 py-1.5 font-bold text-[11px] hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                  {banner.linkText}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Toggle Button (Tab) - Left Bottom */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 transform hover:scale-105"
          aria-label="Open sidebar banner"
        >
          <div className="text-[11px] font-bold tracking-wider uppercase">
           Special Offer
          </div>
        </button>
      )}
    </>
  )
}
