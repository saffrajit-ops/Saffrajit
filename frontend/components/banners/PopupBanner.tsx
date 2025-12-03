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

interface PopupBannerProps {
  page?: string
  productData?: {
    isOutOfStock?: boolean
    codAvailable?: boolean
    categoryId?: string
  }
}

export function PopupBanner({ page, productData }: PopupBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Fetch popup banner with trigger evaluation
    fetchBanner()

    // Cleanup function
    return () => {
      setBanner(null)
      setIsOpen(false)
      setShouldShow(false)
    }
  }, [page]) // Re-fetch when page changes

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
        type: 'popup',
        deviceType: getDeviceType(),
        isLoggedIn: isUserLoggedIn().toString(),
        userType: getUserType()
      })

      if (page) {
        params.append('page', page)
      }

      if (productData?.categoryId) {
        params.append('categoryId', productData.categoryId)
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/banners/active?${params.toString()}`
      console.log('🎯 Fetching popup banner:', apiUrl)
      console.log('📍 Current page:', page)

      const response = await fetch(apiUrl)
      const data = await response.json()
      
      console.log('📦 Popup API response:', data)

      if (data.success && data.data.length > 0) {
        const popupBanner = data.data[0]
        console.log('🎨 Fetched popup banner:', popupBanner)
        console.log('📄 Popup banner pages:', popupBanner.pages)

        // Client-side trigger evaluation
        const shouldShow = shouldShowBanner(popupBanner, { productData })
        console.log('✅ Should show popup:', shouldShow)
        
        if (shouldShow) {
          setBanner(popupBanner)
          setShouldShow(true)
          console.log('🎉 Popup banner set and will be displayed!')
        } else {
          console.log('❌ Popup failed client-side trigger evaluation')
        }
      } else {
        console.log('⚠️ No popup banners returned from API')
      }
    } catch (error) {
      console.error("❌ Failed to fetch popup banner:", error)
    }
  }

  const setupBehaviorTriggers = (banner: Banner) => {
    const cleanups: (() => void)[] = []
    let hasAnyBehaviorTrigger = false
    let viewTracked = false

    const showBannerAndTrack = () => {
      if (!isOpen) {
        setIsOpen(true)
        if (!viewTracked) {
          trackView(banner._id)
          viewTracked = true
        }
      }
    }

    if (banner.triggers?.behavior?.enabled) {
      // Scroll trigger
      if (banner.triggers.behavior.scrollPercentage && banner.triggers.behavior.scrollPercentage > 0) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupScrollTrigger(showBannerAndTrack, banner.triggers.behavior.scrollPercentage)
        cleanups.push(cleanup)
      }

      // Exit intent trigger
      if (banner.triggers.behavior.exitIntent) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupExitIntentTrigger(showBannerAndTrack)
        cleanups.push(cleanup)
      }

      // Add to cart trigger
      if (banner.triggers.behavior.addToCart) {
        hasAnyBehaviorTrigger = true
        const cleanup = setupAddToCartTrigger(showBannerAndTrack)
        cleanups.push(cleanup)
      }
    }

    // If no behavior triggers are set, show immediately after 1 second (default)
    if (!hasAnyBehaviorTrigger) {
      const timer = setTimeout(showBannerAndTrack, 1000)
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

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleBannerClick = () => {
    if (banner) {
      trackClick(banner._id)
      handleClose()
    }
  }

  if (!banner || !isOpen || !shouldShow) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-sm sm:max-w-md md:max-w-lg w-full relative animate-in zoom-in slide-in-from-bottom duration-500 shadow-2xl p-3 sm:p-4 border-2 border-gray-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 w-8 h-8 sm:w-10 sm:h-10 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110 z-10 shadow-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Banner Image with border - flexible height, sharp edges */}
        <div className="relative w-full aspect-[4/3] overflow-hidden border-2 border-gray-200">
          <Image
            src={banner.image.url}
            alt={banner.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Banner Content */}
        <div className="p-4 sm:p-6 md:p-8 text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
            {banner.title}
          </h3>
          {banner.description && (
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3">
              {banner.description}
            </p>
          )}
          {banner.link && (
            <Link
              href={banner.link}
              onClick={handleBannerClick}
              className="block bg-black text-white px-6 sm:px-8 py-2.5 sm:py-3 font-semibold hover:bg-gray-800 transition-all hover:scale-105 text-sm sm:text-base shadow-lg"
            >
              {banner.linkText || "Shop Now"}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
