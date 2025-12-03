"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Save, ArrowLeft, Upload, X, Eye } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { RichTextEditor } from "./rich-text-editor"
import { BlogPreviewDialog } from "./blog-preview-dialog"

interface BlogFormData {
  title: string
  excerpt: string
  body: string
  author: string
  category: string
  tags: string
  isPublished: boolean
}

interface BlogFormPageProps {
  post?: BlogPost | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function BlogFormPage({ post, onSubmit, onCancel, isLoading }: BlogFormPageProps) {
  const { uploadImage } = useBlogStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<BlogFormData>({
    defaultValues: {
      title: "",
      excerpt: "",
      body: "",
      author: "",
      category: "",
      tags: "",
      isPublished: false,
    },
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>("")
  const [bodyContent, setBodyContent] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const isPublished = watch("isPublished")
  
  const title = watch("title")
  const excerpt = watch("excerpt")
  const author = watch("author")
  const category = watch("category")
  const tags = watch("tags")

  useEffect(() => {
    if (post) {
      setValue("title", post.title)
      setValue("excerpt", post.excerpt || "")
      setValue("body", post.body)
      setBodyContent(post.body)
      setValue("author", post.author)
      setValue("category", post.category || "")
      setValue("tags", post.tags?.join(", ") || "")
      setValue("isPublished", post.isPublished)
      if (post.coverImage?.url) {
        setCoverImagePreview(post.coverImage.url)
      }
    }
  }, [post, setValue])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "Cover image must be less than 10MB",
        })
        e.target.value = ""
        return
      }

      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setCoverImage(null)
    setCoverImagePreview("")
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      return await uploadImage(file)
    } catch (error) {
      console.error("Image upload error:", error)
      throw error
    }
  }

  const onFormSubmit = async (data: BlogFormData) => {
    // Validate required fields
    if (!data.title.trim()) {
      toast.error("Validation Error", {
        description: "Title is required",
      })
      setError("title", { message: "Title is required" })
      return
    }

    if (!bodyContent.trim()) {
      toast.error("Validation Error", {
        description: "Content is required",
      })
      return
    }

    if (!data.author.trim()) {
      toast.error("Validation Error", {
        description: "Author is required",
      })
      setError("author", { message: "Author is required" })
      return
    }

    if (!data.category.trim()) {
      toast.error("Validation Error", {
        description: "Category is required",
      })
      setError("category", { message: "Category is required" })
      return
    }

    if (!data.tags.trim()) {
      toast.error("Validation Error", {
        description: "Tags are required",
      })
      setError("tags", { message: "Tags are required" })
      return
    }

    if (!post && !coverImage) {
      toast.error("Validation Error", {
        description: "Cover image is required",
      })
      return
    }

    const formData = new FormData()
    formData.append("title", data.title.trim())
    formData.append("excerpt", data.excerpt.trim())
    formData.append("body", bodyContent)
    formData.append("author", data.author.trim())
    formData.append("category", data.category.trim())
    formData.append("tags", data.tags.trim())
    formData.append("isPublished", data.isPublished ? "true" : "false")
    if (coverImage) {
      formData.append("image", coverImage)
    }

    try {
      await onSubmit(formData)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save blog post"
      console.log("=== FORM ERROR HANDLER ===")
      console.log("Form caught error:", errorMessage)

      if (errorMessage.toLowerCase().includes("slug")) {
        toast.error("Duplicate Post", {
          description: "A blog post with this title already exists. Please use a different title.",
        })
        setError("title", { message: "Post title already exists" })
      } else {
        toast.error("Error", {
          description: errorMessage,
        })
      }
      console.log("=== END ERROR HANDLER ===")
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onCancel} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Button>
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPreviewOpen(true)} 
            className="gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("isPublished", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="published" className="cursor-pointer">Publish</Label>
          </div>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : post ? "Update Post" : "Create Post"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Post Content</h2>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Enter post title"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Slug will be auto-generated from the title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Brief description of the post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">
                Content <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={bodyContent}
                onChange={setBodyContent}
                onImageUpload={handleImageUpload}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Post Details</h2>

            <div className="space-y-2">
              <Label htmlFor="author">
                Author <span className="text-destructive">*</span>
              </Label>
              <Input
                id="author"
                {...register("author", { required: "Author is required" })}
                placeholder="Author name"
              />
              {errors.author && (
                <p className="text-xs text-destructive">{errors.author.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                {...register("category", { required: "Category is required" })}
                placeholder="e.g., Skincare, Wellness"
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tags"
                {...register("tags", { required: "Tags are required" })}
                placeholder="tag1, tag2, tag3"
              />
              {errors.tags && (
                <p className="text-xs text-destructive">{errors.tags.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Cover Image <span className="text-destructive">*</span>
              </Label>
              {!post && !coverImagePreview && (
                <p className="text-xs text-destructive">Required</p>
              )}
            </div>
            {coverImagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted group">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${!coverImagePreview && !post ? "border-destructive" : ""}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${!coverImagePreview && !post ? "text-destructive" : "text-muted-foreground"}`} />
              <Label htmlFor="coverImage" className="cursor-pointer">
                <span className={`text-sm ${!coverImagePreview && !post ? "text-destructive" : "text-muted-foreground"}`}>
                  Click to upload cover image
                </span>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 1200x630px {post && "(Leave empty to keep current image)"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <BlogPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        excerpt={excerpt}
        body={bodyContent}
        author={author}
        category={category}
        tags={tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []}
        coverImagePreview={coverImagePreview}
      />
    </form>
  )
}
