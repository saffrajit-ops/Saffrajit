"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore } from "@/lib/blog-store"
import { BlogForm } from "@/components/blog/blog-form"
import { useToast } from "@/hooks/use-toast"

export default function NewBlogPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { addPost, isLoading } = useBlogStore()
  const { toast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken) {
      toast({
        title: "Authentication required",
        description: "Please log in to create blog posts",
        variant: "destructive",
      })
      return
    }

    try {
      await addPost(formData, accessToken)
      toast({
        title: "Success",
        description: "Blog post created successfully",
      })
      router.push("/dashboard/blog")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create blog post",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/blog")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
          <p className="text-muted-foreground mt-1">
            Write and publish a new blog post
          </p>
        </div>

        <BlogForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
