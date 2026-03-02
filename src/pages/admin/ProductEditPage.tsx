import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductForm } from "@/components/admin/products";
import { useAdminProduct } from "@/hooks/useAdminProduct";
import type { ProductFormData, OptionGroupFormData } from "@/types/admin";
import type { ProductBadge } from "@/types";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : undefined;
  const { data: product, isLoading, error } = useAdminProduct(productId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-500">Product not found</p>
        <Link to="/admin/products" className="mt-4 text-sm text-primary hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const existingOptions: OptionGroupFormData[] = product.product_options.map((opt) => ({
    id: opt.id,
    name: opt.name,
    type: opt.type as "select" | "date" | "text" | "number",
    is_required: opt.is_required,
    values: opt.product_option_values.map((v) => ({
      id: v.id,
      label: v.label,
      price_modifier: v.price_modifier,
    })),
  }));

  const defaultValues: Partial<ProductFormData> = {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    content: product.content ?? "",
    price: product.price,
    compare_price: product.compare_price,
    status: product.status as ProductFormData["status"],
    category_id: product.category_id,
    badges: (product.badges as ProductBadge[]) ?? [],
    images: (product.images as string[]) ?? [],
    thumbnail_url: product.thumbnail_url ?? "",
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    options: existingOptions,
    featured_collection_ids: product.featured_collection_products.map((f) => f.collection_id),
  };

  return (
    <>
      <Helmet>
        <title>Edit {product.title} | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link
            to="/admin/products"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-primary">Edit: {product.title}</h1>
        </div>

        <ProductForm
          mode="edit"
          productId={productId}
          defaultValues={defaultValues}
          existingOptions={existingOptions}
        />
      </div>
    </>
  );
}
