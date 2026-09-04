import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { X, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import BlogContentEditor from "./BlogContentEditor";
import BlogFormActions from "./BlogFormActions";
import ImagePicker from "@/components/admin/common/ImagePicker";
import { useCreateBlogPost, useUpdateBlogPost } from "@/hooks/useBlogMutation";
import { slugify } from "@/lib/slugify";
import type { BlogFormData } from "@/types/admin";
import type { BlogCategory } from "@/types";

interface Props {
  mode: "create" | "edit";
  postId?: number;
  defaultValues?: Partial<BlogFormData>;
}

const CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "HOW-TO", label: "How-To" },
  { value: "LOCAL-LIFE", label: "Local Life" },
  { value: "K-CULTURE", label: "K-Culture" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
];

export default function BlogForm({ mode, postId, defaultValues }: Props) {
  const navigate = useNavigate();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const [thumbPicker, setThumbPicker] = useState(false);

  const methods = useForm<BlogFormData>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "HOW-TO",
      status: "draft",
      author: "",
      thumbnail_url: "",
      published_at: "",
      seo_title: "",
      seo_description: "",
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;

  const thumbnailUrl = watch("thumbnail_url");
  const seoTitle = watch("seo_title");
  const seoDescription = watch("seo_description");
  const title = watch("title");
  const excerpt = watch("excerpt");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("title", val);
    if (mode === "create") {
      setValue("slug", slugify(val));
    }
  };

  const doSubmit = async (data: BlogFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(data.status === "published" ? "Post published" : "Draft saved");
        navigate("/admin/blog");
      } else if (postId) {
        await updateMutation.mutateAsync({ id: postId, data });
        toast.success(data.status === "published" ? "Post updated" : "Draft saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    }
  };

  const handlePublish = handleSubmit((data) => {
    return doSubmit({ ...data, status: "published" });
  });

  const handleSaveDraft = async () => {
    const data = getValues();
    if (!data.title || !data.slug) {
      toast.error("Title and slug are required");
      return;
    }
    await doSubmit({ ...data, status: "draft" });
  };

  const displaySeoTitle = seoTitle || title || "Page Title";
  const displaySeoDesc = seoDescription || excerpt || "Page description will appear here...";

  return (
    <FormProvider {...methods}>
      <form onSubmit={handlePublish}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("title", { required: "Title is required", onChange: handleTitleChange })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter post title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    {...register("slug", { required: "Slug is required" })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="post-url-slug"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Excerpt</label>
                  <textarea
                    {...register("excerpt")}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Brief summary of the post"
                  />
                </div>
              </div>
            </section>

            {/* Content Editor */}
            <BlogContentEditor />

            {/* Thumbnail */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Thumbnail Image</h2>
              {thumbnailUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      loading="lazy"
                      className="h-40 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setValue("thumbnail_url", "")}
                      className="absolute -right-2 -top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThumbPicker(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-primary/50 hover:text-primary"
                  >
                    <ImageIcon className="h-4 w-4" /> Replace image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setThumbPicker(true)}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary/50"
                >
                  <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Search or upload a thumbnail</p>
                  <p className="mt-0.5 text-xs text-gray-400">Unsplash / Pexels search or file upload</p>
                </button>
              )}

              <ImagePicker
                open={thumbPicker}
                onClose={() => setThumbPicker(false)}
                onSelect={(url) => setValue("thumbnail_url", url)}
                orientation="landscape"
                initialQuery={title}
                title="Thumbnail image"
              />
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Status & Category */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    {...register("category")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Author</label>
                  <input
                    {...register("author")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    {...register("published_at")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Leave empty to publish immediately
                  </p>
                </div>
              </div>
            </section>

            {/* SEO */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">SEO</h2>

              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-blue-700 line-clamp-1">{displaySeoTitle}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{displaySeoDesc}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">SEO Title</label>
                    <span className="text-xs text-gray-400">{(seoTitle ?? "").length}/60</span>
                  </div>
                  <input
                    {...register("seo_title")}
                    maxLength={60}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Defaults to post title"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">SEO Description</label>
                    <span className="text-xs text-gray-400">{(seoDescription ?? "").length}/160</span>
                  </div>
                  <textarea
                    {...register("seo_description")}
                    rows={3}
                    maxLength={160}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Defaults to excerpt"
                  />
                </div>
              </div>
            </section>

            <BlogFormActions isSubmitting={isSubmitting} onSaveDraft={handleSaveDraft} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
