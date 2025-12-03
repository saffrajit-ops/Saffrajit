"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore, Product } from "@/lib/product-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Package } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { sanitizeHtml } from "@/lib/html-utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { fetchProductById } = useProductStore()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      if (!accessToken) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        router.push("/dashboard/products")
        return
      }

      try {
        const productData = await fetchProductById(params.id as string, accessToken)
        if (productData) {
          setProduct(productData)
        } else {
          throw new Error("Product not found")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load product",
          variant: "destructive",
        })
        router.push("/dashboard/products")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id, accessToken, fetchProductById, router, toast])

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/products")}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
          <Button
            onClick={() => {
              setIsNavigating(true)
              router.push(`/dashboard/products/${product._id}/edit`)
            }}
            className="gap-2 cursor-pointer"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit Product
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted shrink-0 border-2 border-border">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.title}
                      width={160}
                      height={160}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                      <div
                        className="text-muted-foreground text-base prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.shortDescription) }}
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {product.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      {product.isFeatured && <Badge variant="outline" className="text-xs">Featured</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">SKU:</span>
                      <span className="font-mono font-semibold text-sm">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Brand:</span>
                      <span className="font-semibold text-sm">{product.brand}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span
                        className={`font-semibold text-sm ${product.stock === 0
                          ? "text-destructive"
                          : product.stock < 10
                            ? "text-orange-600"
                            : "text-green-600"
                          }`}
                      >
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            {product.description && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Description
                </h2>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                />
              </Card>
            )}

            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Product Images ({product.images.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-primary transition-colors cursor-pointer group"
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `${product.title} - Image ${index + 1}`}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Pricing
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-4xl font-bold text-primary">${product.price}</p>
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Original Price</p>
                    <p className="text-xl font-semibold text-muted-foreground line-through">
                      ${product.compareAtPrice}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-sm font-medium">
                      <span>
                        {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Categories */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Categories
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Concern</p>
                  {product.concern && product.concern.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.concern.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Category</p>
                  {product.categories && product.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.categories.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Collection</p>
                  {product.collection ? (
                    <Badge variant="secondary" className="text-xs">{product.collection}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Payment & Returns */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Payment & Returns
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when product is delivered</p>
                  </div>
                  <Badge variant={product.cashOnDelivery?.enabled ? "default" : "secondary"}>
                    {product.cashOnDelivery?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Returnable</p>
                    <p className="text-xs text-muted-foreground">
                      {product.returnPolicy?.returnable !== false 
                        ? `${product.returnPolicy?.returnWindowDays || 7} days return window`
                        : "Product cannot be returned"}
                    </p>
                  </div>
                  <Badge variant={product.returnPolicy?.returnable !== false ? "default" : "secondary"}>
                    {product.returnPolicy?.returnable !== false ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium">{new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                {product.updatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Product ID</p>
                  <p className="font-mono text-xs break-all">{product._id}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
