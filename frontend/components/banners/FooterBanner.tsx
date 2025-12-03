"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Banner,
  shouldShowBanner,
  getDeviceType,
  getUserType,
  isUserLoggedIn
} from "@/lib/banner-triggers"

interface FooterBannerProps {
  page?: string
  productData?: {
    isOutOfStock?: boolean
    codAvailable?: boolean
    categoryId?: string
  }
}

export function FooterBanner({ page = 'home', productData }: FooterBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Reset state when page changes
    setBanner(null)
    setIsLoading(true)
    setShouldShow(false)

    fetchBanner()
  }, [page])

  const fetchBanner = async () => {
    try {
      // Build query params with context
      const params = new URLSearchParams({
        type: 'footer',
        page: page,
        deviceType: getDeviceType(),
        isLoggedIn: isUserLoggedIn().toString(),
        userType: getUserType()
      })

      if (productData?.categoryId) {
        params.append('categoryId', productData.categoryId)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/banners/active?${params.toString()}`
      )
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        const fetchedBanner = data.data[0]
        
        // Client-side trigger evaluation
        if (shouldShowBanner(fetchedBanner, { productData })) {
          setBanner(fetchedBanner)
          setShouldShow(true)
          trackView(fetchedBanner._id)
        }
      } else {
        setBanner(null)
      }
    } catch (error) {
      console.error("Failed to fetch footer banner:", error)
      setBanner(null)
    } finally {
      setIsLoading(false)
    }
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

  if (isLoading) {
    return (
      <div className="w-full h-[120px] sm:h-[150px] bg-gray-200 animate-pulse my-8" />
    )
  }

  if (!banner || !shouldShow) {
    return null
  }

  return (
    <div className="w-full my-8 px-3 sm:px-4 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="bg-white shadow-lg p-3 sm:p-4 border-2 border-gray-200">
        <Link
          href={banner.link || "#"}
          onClick={() => trackClick(banner._id)}
          className="block relative overflow-hidden group border-2 border-gray-200"
        >
          <div className="relative w-full aspect-[6/1] min-h-[120px] max-h-[250px]">
            <Image
              src={banner.image.url}
              alt={banner.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />
          </div>

          {/* Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center p-4 sm:p-6 max-w-3xl">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 opacity-90">
                  {banner.description}
                </p>
              )}
              {banner.linkText && (
                <span className="inline-block bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm group-hover:bg-gray-100 transition-all shadow-md">
                  {banner.linkText}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
