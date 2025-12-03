"use client"

import { useState, useEffect } from "react"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { RichTextEditor } from "./rich-text-editor"
import { Save, ArrowLeft } from "lucide-react"
import Image from "next/image"

interface BlogFormProps {
    post?: BlogPost | null
    onSubmit: (formData: FormData) => Promise<void>
    onCancel: () => void
    isLoading: boolean
}

export function BlogForm({ post, onSubmit, onCancel, isLoading }: BlogFormProps) {
    const { uploadImage } = useBlogStore()
    const [title, setTitle] = useState("")
    const [excerpt, setExcerpt] = useState("")
    const [body, setBody] = useState("")
    const [author, setAuthor] = useState("")
    const [category, setCategory] = useState("")
    const [tags, setTags] = useState("")
    const [isPublished, setIsPublished] = useState(false)
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string>("")

    useEffect(() => {
        if (post) {
            setTitle(post.title)
            setExcerpt(post.excerpt || "")
            setBody(post.body)
            setAuthor(post.author)
            setCategory(post.category || "")
            setTags(post.tags?.join(", ") || "")
            setIsPublished(post.isPublished)
            if (post.coverImage?.url) {
                setCoverImagePreview(post.coverImage.url)
            }
        }
    }, [post])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleImageUpload = async (file: File): Promise<string> => {
        try {
            return await uploadImage(file)
        } catch (error) {
            console.error("Image upload error:", error)
            throw error
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!title.trim()) {
            return
        }
        if (!body.trim()) {
            return
        }
        if (!author.trim()) {
            return
        }
        if (!category.trim()) {
            return
        }
        if (!tags.trim()) {
            return
        }
        if (!post && !coverImage) {
            return
        }

        const formData = new FormData()
        formData.append("title", title.trim())
        formData.append("excerpt", excerpt.trim())
        formData.append("body", body)
        formData.append("author", author.trim())
        formData.append("category", category.trim())
        formData.append("tags", tags.trim())
        formData.append("isPublished", isPublished ? "true" : "false")
        if (coverImage) {
            formData.append("image", coverImage)
        }

        await onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="published"
                            checked={isPublished}
                            onCheckedChange={setIsPublished}
                        />
                        <Label htmlFor="published">Publish</Label>
                    </div>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isLoading ? "Saving..." : post ? "Update Post" : "Create Post"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter post title"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Slug will be auto-generated from the title
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Textarea
                                id="excerpt"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="Brief description of the post"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="body">Content *</Label>
                            <RichTextEditor
                                content={body}
                                onChange={setBody}
                                onImageUpload={handleImageUpload}
                            />
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="author">Author *</Label>
                            <Input
                                id="author"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Author name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Input
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Skincare, Wellness"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags *</Label>
                            <Input
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate tags with commas
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <Label>Cover Image *</Label>
                        {coverImagePreview && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                                <Image
                                    src={coverImagePreview}
                                    alt="Cover preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            required={!post}
                        />
                        <p className="text-xs text-muted-foreground">
                            Recommended: 1200x630px {post && "(Leave empty to keep current image)"}
                        </p>
                    </Card>
                </div>
            </div>
        </form>
    )
}
