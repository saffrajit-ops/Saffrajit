"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Product } from "@/lib/product-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Save, ArrowLeft, Upload, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { sanitizeHtml } from "@/lib/html-utils"

// Dropdown options
const CONCERN_OPTIONS = [
  { value: "Lines and Wrinkles", label: "Lines and Wrinkles" },
  { value: "Hydration and Glow", label: "Hydration and Glow" },
  { value: "Puffiness and Pigmentation", label: "Puffiness and Pigmentation" },
  { value: "Dark Skin (Whitening)", label: "Dark Skin (Whitening)" },
]

const CATEGORIES_OPTIONS = [
  { value: "Anti Aging", label: "Anti Aging" },
  { value: "Eye Care", label: "Eye Care" },
  { value: "Body Care", label: "Body Care" },
  { value: "Instant Face Lift", label: "Instant Face Lift" },
  { value: "Neck", label: "Neck" },
  { value: "Masks", label: "Masks" },
  { value: "Gift Sets", label: "Gift Sets" },
]

const COLLECTION_OPTIONS = [
  { value: "Prestige Line", label: "Prestige Line" },
]

interface ProductFormData {
  title: string
  sku: string
  brand: string
  price: string
  compareAtPrice: string
  discountValue: string
  discountType: string
  shippingCharges: string
  freeShippingThreshold: string
  freeShippingMinQuantity: string
  stock: string
  shortDescription: string
  description: string
  concern: string
  categories: string
  collection: string
  isActive: boolean
  isFeatured: boolean
  codEnabled: boolean
  returnable: boolean
  returnWindowDays: string
}

interface ImagePreview {
  file?: File
  preview: string
  altText: string
  url?: string
}

interface ProductFormProps {
  product?: Product | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<ProductFormData>({
    defaultValues: {
      title: "",
      sku: "",
      brand: "Cana Gold",
      price: "",
      compareAtPrice: "",
      discountValue: "0",
      discountType: "percentage",
      shippingCharges: "0",
      freeShippingThreshold: "0",
      freeShippingMinQuantity: "0",
      stock: "0",
      shortDescription: "",
      description: "",
      concern: "",
      categories: "",
      collection: "",
      isActive: true,
      isFeatured: false,
      codEnabled: false,
      returnable: true,
      returnWindowDays: "7",
    },
  })

  const [images, setImages] = useState<ImagePreview[]>([])
  const [shortDescriptionContent, setShortDescriptionContent] = useState("")
  const [descriptionContent, setDescriptionContent] = useState("")

  const isActive = watch("isActive")
  const isFeatured = watch("isFeatured")
  const concern = watch("concern")
  const categories = watch("categories")
  const collection = watch("collection")
  const price = watch("price")
  const compareAtPrice = watch("compareAtPrice")
  const discountType = watch("discountType")
  const discountValue = watch("discountValue")
  const codEnabled = watch("codEnabled")
  const returnable = watch("returnable")
  const returnWindowDays = watch("returnWindowDays")

  // Calculate final price based on original price and discount
  const calculateFinalPrice = () => {
    const originalPrice = parseFloat(price || "0")
    const discount = parseFloat(discountValue || "0")

    if (originalPrice <= 0 || discount <= 0) {
      return originalPrice
    }

    if (discountType === "percentage") {
      // Percentage discount
      const discountAmount = (originalPrice * discount) / 100
      return Math.max(0, originalPrice - discountAmount)
    } else {
      // Fixed amount discount
      return Math.max(0, originalPrice - discount)
    }
  }

  const finalPrice = calculateFinalPrice()

  useEffect(() => {
    if (product) {
      setValue("title", product.title)
      setValue("sku", product.sku)
      setValue("brand", product.brand)
      setValue("price", product.price.toString())
      setValue("compareAtPrice", product.compareAtPrice?.toString() || "")
      setValue("discountValue", product.discount?.value?.toString() || "0")
      setValue("discountType", product.discount?.type || "percentage")
      setValue("shippingCharges", product.shipping?.charges?.toString() || "0")
      setValue("freeShippingThreshold", product.shipping?.freeShippingThreshold?.toString() || "0")
      setValue("freeShippingMinQuantity", product.shipping?.freeShippingMinQuantity?.toString() || "0")
      setValue("stock", product.stock.toString())
      setValue("shortDescription", product.shortDescription)
      setValue("description", product.description || "")
      setValue("concern", product.concern?.[0] || "")
      setValue("categories", product.categories?.[0] || "")
      setValue("collection", product.collection || "")
      setValue("isActive", product.isActive)
      setValue("isFeatured", product.isFeatured)
      setValue("codEnabled", product.cashOnDelivery?.enabled || false)
      setValue("returnable", product.returnPolicy?.returnable !== false)
      setValue("returnWindowDays", product.returnPolicy?.returnWindowDays?.toString() || "7")

      // Set rich text editor content - decode HTML entities
      setShortDescriptionContent(sanitizeHtml(product.shortDescription || ""))
      setDescriptionContent(sanitizeHtml(product.description || ""))

      // Load existing images
      if (product.images && product.images.length > 0) {
        const existingImages = product.images.map((img) => ({
          url: img.url,
          preview: img.url,
          altText: img.altText || "",
        }))
        setImages(existingImages)
      }
    }
  }, [product, setValue])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding new images would exceed the limit
    const totalImages = images.length + files.length
    if (totalImages > 5) {
      toast.error("Image Limit Exceeded", {
        description: `You can only upload a maximum of 5 images. You currently have ${images.length} image(s).`,
      })
      // Reset the file input
      e.target.value = ""
      return
    }

    const newImages: ImagePreview[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: "",
    }))

    setImages((prev) => [...prev, ...newImages])
    // Reset the file input
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const removed = newImages.splice(index, 1)[0]
      // Revoke object URL if it's a new upload
      if (removed.file && removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newImages
    })
  }

  const onFormSubmit = async (data: ProductFormData) => {
    // Validate categories is required
    if (!data.categories || !data.categories.trim()) {
      toast.error("Validation Error", {
        description: "Category is required",
      })
      setError("categories", { message: "Category is required" })
      return
    }

    // Validate at least one image is required
    if (images.length === 0) {
      toast.error("Validation Error", {
        description: "At least one product image is required",
      })
      return
    }

    // Validate compareAtPrice if provided
    const priceValue = parseFloat(data.price)
    const compareAtPriceStr = data.compareAtPrice?.toString().trim()
    const compareAtPriceValue = compareAtPriceStr ? parseFloat(compareAtPriceStr) : 0

    if (compareAtPriceValue > 0 && compareAtPriceValue <= priceValue) {
      toast.error("Validation Error", {
        description: "Compare at price must be greater than regular price",
      })
      setError("compareAtPrice", {
        message: "Must be greater than regular price",
      })
      return
    }

    const formData = new FormData()

    // Required fields
    formData.append("type", "single")
    formData.append("title", data.title.trim())
    formData.append("sku", data.sku.trim())
    formData.append("brand", data.brand.trim())
    formData.append("price", priceValue.toString())
    formData.append("stock", data.stock)
    formData.append("shortDescription", data.shortDescription.trim())
    formData.append("isActive", data.isActive ? "true" : "false")
    formData.append("isFeatured", data.isFeatured ? "true" : "false")

    // Optional fields
    if (compareAtPriceValue > priceValue) {
      formData.append("compareAtPrice", compareAtPriceValue.toString())
    }

    if (data.description && data.description.trim()) {
      formData.append("description", data.description.trim())
    }

    // Auto-generate slug from title
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    formData.append("slug", slug)

    // Add new fields
    if (data.concern && data.concern.trim()) {
      formData.append("concern", data.concern.trim())
    }
    if (data.categories && data.categories.trim()) {
      formData.append("categories", data.categories.trim())
    }
    if (data.collection && data.collection.trim()) {
      formData.append("collection", data.collection.trim())
    }

    // Add discount fields
    const discountValue = parseFloat(data.discountValue || "0")
    if (discountValue > 0) {
      formData.append("discount[value]", discountValue.toString())
      formData.append("discount[type]", data.discountType)
    }

    // Add shipping fields
    const shippingCharges = parseFloat(data.shippingCharges || "0")
    const freeShippingThreshold = parseFloat(data.freeShippingThreshold || "0")
    const freeShippingMinQuantity = parseInt(data.freeShippingMinQuantity || "0")

    formData.append("shipping[charges]", shippingCharges.toString())
    formData.append("shipping[freeShippingThreshold]", freeShippingThreshold.toString())
    formData.append("shipping[freeShippingMinQuantity]", freeShippingMinQuantity.toString())

    // Add COD and return policy fields
    formData.append("cashOnDelivery[enabled]", data.codEnabled ? "true" : "false")
    formData.append("returnPolicy[returnable]", data.returnable ? "true" : "false")
    formData.append("returnPolicy[returnWindowDays]", data.returnWindowDays || "7")

    // Add new images only (files, not URLs)
    const newImages = images.filter((img) => img.file)
    newImages.forEach((image) => {
      formData.append("images", image.file!)
    })

    try {
      await onSubmit(formData)
      // Success toast will be shown by parent component
    } catch (error: any) {
      // Handle duplicate SKU error
      const errorMessage = error.message || "Failed to save product"
      console.log("=== FORM ERROR HANDLER ===")
      console.log("Form caught error:", errorMessage)
      console.log("Error type:", typeof error)
      console.log("Error object:", error)

      if (errorMessage.toLowerCase().includes("sku")) {
        console.log("✅ Showing duplicate SKU toast")
        toast.error("Duplicate SKU", {
          description: "A product with this SKU already exists. Please use a different SKU.",
        })
        setError("sku", { message: "SKU already exists" })
      } else if (errorMessage.toLowerCase().includes("slug")) {
        console.log("✅ Showing duplicate slug toast")
        toast.error("Duplicate Product", {
          description: "A product with this name already exists. Please use a different title.",
        })
        setError("title", { message: "Product name already exists" })
      } else {
        console.log("✅ Showing generic error toast")
        toast.error("Error", {
          description: errorMessage,
        })
      }
      console.log("=== END ERROR HANDLER ===")
      // Don't re-throw to prevent duplicate error handling
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
          {/* Test Toast Button */}
          {/* <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("Test button clicked")
              toast.error("Test Toast", {
                description: "If you see this, toast is working!",
              })
            }}
          >
            Test Toast
          </Button> */}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setValue("isFeatured", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
          </div>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Product Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  placeholder="e.g., Premium Face Cream"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  {...register("sku", { required: "SKU is required" })}
                  placeholder="e.g., PFC-001"
                />
                {errors.sku && (
                  <p className="text-xs text-destructive">{errors.sku.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  {...register("brand", { required: "Brand is required" })}
                  placeholder="e.g., Cana Gold"
                />
                {errors.brand && (
                  <p className="text-xs text-destructive">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  {...register("stock", {
                    required: "Stock is required",
                    min: { value: 0, message: "Stock cannot be negative" },
                    validate: (value) => {
                      const num = parseInt(value)
                      if (num < 0) return "Stock cannot be negative"
                      return true
                    },
                  })}
                  placeholder="100"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault()
                    }
                  }}
                />
                {errors.stock && (
                  <p className="text-xs text-destructive">{errors.stock.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">
                Short Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={shortDescriptionContent}
                onChange={(content) => {
                  setShortDescriptionContent(content)
                  setValue("shortDescription", content)
                }}
                placeholder="Brief product description with formatting..."
              />
              {errors.shortDescription && (
                <p className="text-xs text-destructive">
                  {errors.shortDescription.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Use the toolbar to format text, add colors, and create lists
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <RichTextEditor
                content={descriptionContent}
                onChange={(content) => {
                  setDescriptionContent(content)
                  setValue("description", content)
                }}
                placeholder="Detailed product information, features, and benefits..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Add detailed product information with rich formatting
              </p>
            </div>
          </Card>



          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Product Images <span className="text-destructive">*</span>
              </h2>
              {images.length === 0 && (
                <p className="text-xs text-destructive">At least one image required</p>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={image.preview}
                        alt={`Product image ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${images.length === 0 ? "border-destructive" : images.length >= 5 ? "border-muted bg-muted/50" : ""}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${images.length === 0 ? "text-destructive" : images.length >= 5 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
              <Label htmlFor="images" className={images.length >= 5 ? "cursor-not-allowed" : "cursor-pointer"}>
                <span className={`text-sm ${images.length === 0 ? "text-destructive" : images.length >= 5 ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                  {images.length >= 5 ? "Maximum 5 images reached" : "Click to upload or drag and drop"}
                </span>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 5}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, GIF up to 10MB ({images.length}/5 images)
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Categories</h2>

            <div className="space-y-2">
              <Label htmlFor="concern">Concern</Label>
              <Select value={concern} onValueChange={(value) => setValue("concern", value)}>
                <SelectTrigger id="concern" className="cursor-pointer">
                  <SelectValue placeholder="Select concern" />
                </SelectTrigger>
                <SelectContent>
                  {CONCERN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categories}
                onValueChange={(value) => setValue("categories", value)}
              >
                <SelectTrigger id="categories" className="cursor-pointer">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categories && (
                <p className="text-xs text-destructive">{errors.categories.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={collection}
                onValueChange={(value) => setValue("collection", value)}
              >
                <SelectTrigger id="collection" className="cursor-pointer">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register("price", {
                      required: "Price is required",
                      min: { value: 1, message: "Price must be at least $1" },
                      validate: (value) => {
                        const num = parseFloat(value)
                        if (num < 1) return "Price must be at least $1"
                        return true
                      },
                    })}
                    placeholder="99.99"
                    className="pl-7"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min={price ? parseFloat(price) + 0.01 : "0"}
                    {...register("compareAtPrice", {
                      validate: (value) => {
                        if (!value || value === "") return true
                        const comparePrice = parseFloat(value)
                        const regularPrice = parseFloat(price || "0")
                        if (comparePrice <= regularPrice) {
                          return "Must be greater than regular price"
                        }
                        return true
                      },
                    })}
                    placeholder="Leave empty if no comparison"
                    className="pl-7"
                    disabled={!price || parseFloat(price) < 1}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                {errors.compareAtPrice && (
                  <p className="text-xs text-destructive">{errors.compareAtPrice.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be greater than regular price. {!price || parseFloat(price) < 1 ? "(Enter price first)" : ""}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Discount</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("discountValue")}
                    placeholder="0"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault()
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {discountType === "percentage" ? "Enter percentage (e.g., 10 for 10%)" : "Enter fixed amount (e.g., 5 for $5 off)"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value) => setValue("discountType", value)}
                  >
                    <SelectTrigger id="discountType" className="cursor-pointer">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage" className="cursor-pointer">Percentage (%)</SelectItem>
                      <SelectItem value="fixed" className="cursor-pointer">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {parseFloat(price || "0") > 0 && parseFloat(discountValue || "0") > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Original Price:</span>
                    <span className="font-medium">${parseFloat(price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-destructive font-medium">
                      -{discountType === "percentage"
                        ? `${discountValue}% ($${((parseFloat(price) * parseFloat(discountValue)) / 100).toFixed(2)})`
                        : `$${parseFloat(discountValue).toFixed(2)}`
                      }
                    </span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="font-semibold">Final Price:</span>
                    <span className="text-lg font-bold text-primary">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Shipping</h2>

            <div className="space-y-2">
              <Label htmlFor="shippingCharges">Shipping Charges</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="shippingCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("shippingCharges")}
                  placeholder="0"
                  className="pl-7"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Standard shipping cost for this product
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Free Shipping Conditions</h3>

              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Order Value Threshold</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("freeShippingThreshold")}
                    placeholder="0"
                    className="pl-7"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Free shipping if total order value exceeds this amount (e.g., 1000 for orders over $1000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeShippingMinQuantity">Minimum Quantity</Label>
                <Input
                  id="freeShippingMinQuantity"
                  type="number"
                  min="0"
                  {...register("freeShippingMinQuantity")}
                  placeholder="0"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                      e.preventDefault()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Free shipping if customer buys this many products (e.g., 2 for "Buy 2, get free delivery")
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Payment & Returns</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="codEnabled" className="cursor-pointer font-medium">
                    Cash on Delivery (COD)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow customers to pay cash when product is delivered
                  </p>
                </div>
                <Switch
                  id="codEnabled"
                  checked={codEnabled}
                  onCheckedChange={(checked) => setValue("codEnabled", checked)}
                  className="cursor-pointer"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="returnable" className="cursor-pointer font-medium">
                      Returnable Product
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow customers to return this product after delivery
                    </p>
                  </div>
                  <Switch
                    id="returnable"
                    checked={returnable}
                    onCheckedChange={(checked) => setValue("returnable", checked)}
                    className="cursor-pointer"
                  />
                </div>

                {returnable && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="returnWindowDays">Return Window (Days)</Label>
                    <Input
                      id="returnWindowDays"
                      type="number"
                      min="1"
                      max="90"
                      {...register("returnWindowDays", {
                        min: { value: 1, message: "Minimum 1 day" },
                        max: { value: 90, message: "Maximum 90 days" },
                      })}
                      placeholder="7"
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                          e.preventDefault()
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of days after delivery when customer can request a return (1-90 days)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
