import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Share2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProduct } from "@/hooks/useProduct";
import { useCartStore } from "@/stores/useCartStore";
import { supabase } from "@/lib/supabase";
import ImageGallery from "@/components/product/ImageGallery";
import OptionSelector from "@/components/product/OptionSelector";
import type { SelectedOptions } from "@/components/product/OptionSelector";
import ContentTabs from "@/components/product/ContentTabs";
import RelatedProducts from "@/components/product/RelatedProducts";

function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const BADGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  BEST: "bg-red-500",
  HOT: "bg-orange-500",
  MD: "bg-purple-500",
  SALE: "bg-emerald-500",
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug);
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});

  // Increment view count on mount (fire and forget)
  useEffect(() => {
    if (!product?.id) return;
    supabase.functions
      .invoke("increment-view", {
        body: { type: "product", id: product.id },
      })
      .catch(() => {});
  }, [product?.id]);

  // Reset options when product changes
  useEffect(() => {
    setSelectedOptions({});
    setQuantity(1);
  }, [slug]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const optionModifier = Object.values(selectedOptions).reduce(
      (sum, opt) => sum + (opt.priceModifier ?? 0),
      0,
    );
    return (product.price + optionModifier) * quantity;
  }, [product, selectedOptions, quantity]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    return (
      product.price +
      Object.values(selectedOptions).reduce(
        (sum, opt) => sum + (opt.priceModifier ?? 0),
        0,
      )
    );
  }, [product, selectedOptions]);

  // Check required options
  const allRequiredSelected = useMemo(() => {
    if (!product) return false;
    return product.product_options
      .filter((opt) => opt.is_required)
      .every((opt) => {
        const sel = selectedOptions[opt.id];
        if (!sel) return false;
        if (opt.product_option_values.length > 0) return !!sel.valueId;
        return !!sel.textValue;
      });
  }, [product, selectedOptions]);

  function handleAddToCart() {
    if (!product) return;
    if (!allRequiredSelected) {
      toast.error("Please select all required options.");
      return;
    }

    // Build unique cart item ID from product + selected option values
    const optionKeys = Object.entries(selectedOptions)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v.valueId ?? v.textValue ?? "")
      .join("-");
    const cartId = optionKeys ? `${product.id}-${optionKeys}` : String(product.id);

    const optionLabels = Object.values(selectedOptions)
      .map((o) => o.label)
      .filter(Boolean);

    addItem({
      id: cartId,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: unitPrice,
      quantity,
      selectedOptions: optionLabels.length
        ? optionLabels.join(", ")
        : undefined,
      thumbnail: product.thumbnail_url ?? undefined,
    });

    toast.success("Added to cart!");
  }

  function handleBuyNow() {
    handleAddToCart();
    if (allRequiredSelected || product?.product_options.length === 0) {
      navigate("/cart");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-primary">Product not found</h1>
        <p className="mt-2 text-text-secondary">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) *
          100,
      )
    : 0;
  const isSoldOut = product.status === "sold_out";

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo_description ?? product.description ?? "",
    image: product.thumbnail_url ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Helmet>
        <title>
          {product.seo_title ?? product.title} | Korea By Local
        </title>
        <meta
          name="description"
          content={
            product.seo_description ?? product.description ?? "View product details."
          }
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product.categories && (
            <>
              <Link
                to={`/shop`}
                className="hover:text-primary"
              >
                Shop
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="hover:text-primary">
                {product.categories.name}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="truncate text-primary">{product.title}</span>
        </nav>

        {/* Main content: 2-column */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Image Gallery */}
          <ImageGallery
            images={product.images}
            thumbnailUrl={product.thumbnail_url}
            title={product.title}
          />

          {/* Right: Product Info */}
          <div>
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-md px-2 py-0.5 text-xs font-bold text-white ${
                      BADGE_COLORS[badge] ?? "bg-gray-500"
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Category */}
            {product.categories && (
              <p className="mb-1 text-sm font-medium text-text-secondary">
                {product.categories.name}
              </p>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-primary lg:text-3xl">
              {product.title}
            </h1>

            {/* View count + Share */}
            <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.view_count.toLocaleString()} views
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 transition-colors hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              {hasDiscount && (
                <span className="rounded bg-red-500 px-2 py-0.5 text-sm font-bold text-white">
                  -{discountPct}%
                </span>
              )}
              <span
                className={`text-2xl font-bold lg:text-3xl ${
                  hasDiscount ? "text-red-500" : "text-primary"
                }`}
              >
                {formatPrice(product.price, product.currency)}
              </span>
              {hasDiscount && product.compare_price != null && (
                <span className="text-lg text-text-secondary line-through">
                  {formatPrice(product.compare_price, product.currency)}
                </span>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {product.description}
              </p>
            )}

            {/* Divider */}
            <hr className="my-5 border-gray-200" />

            {/* Options */}
            {product.product_options.length > 0 && (
              <div className="mb-5">
                <OptionSelector
                  options={product.product_options}
                  selectedOptions={selectedOptions}
                  onChange={setSelectedOptions}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-primary">
                Quantity
              </label>
              <div className="inline-flex items-center rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:text-primary"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-sm font-medium text-primary">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Total price */}
            {(product.product_options.length > 0 || quantity > 1) && (
              <div className="mb-5 flex items-center justify-between rounded-lg bg-background-gray px-4 py-3">
                <span className="text-sm font-medium text-text-secondary">
                  Total
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(totalPrice, product.currency)}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-primary py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSoldOut ? "Sold Out" : "Buy Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Content tabs */}
        <div className="mt-12 lg:mt-16">
          <ContentTabs content={product.content} />
        </div>

        {/* Related products */}
        <div className="mt-12 lg:mt-16">
          <RelatedProducts
            categoryId={product.categories?.id}
            currentProductId={product.id}
          />
        </div>
      </div>
    </>
  );
}
