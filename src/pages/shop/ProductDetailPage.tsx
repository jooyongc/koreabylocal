import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Share2,
  Eye,
  Star,
  ShieldCheck,
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
import ProductHighlights from "@/components/product/ProductHighlights";
import GoodToKnow from "@/components/product/GoodToKnow";

function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const BADGE_COLORS: Record<string, string> = {
  NEW: "bg-purple",
  BEST: "bg-accent",
  HOT: "bg-coral",
  MD: "bg-purple",
  SALE: "bg-green",
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
      .invoke("increment-view-count", {
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
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
          <div className="aspect-square animate-pulse rounded-[20px] bg-cream-200" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-cream-200" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-cream-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-cream-200" />
            <div className="h-20 w-full animate-pulse rounded bg-cream-200" />
            <div className="h-12 w-full animate-pulse rounded bg-cream-200" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Product not found
        </h1>
        <p className="mt-2 text-muted">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple"
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

  const pageTitle = `${product.seo_title ?? product.title} | Korea By Local`;
  const pageDesc = product.seo_description ?? product.description ?? "View product details.";
  const pagePath = `/product/${product.slug}`;

  // JSON-LD structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: pageDesc,
    image: product.thumbnail_url ?? undefined,
    url: `${SITE_URL}${pagePath}`,
    brand: {
      "@type": "Brand",
      name: "Korea By Local",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${SITE_URL}${pagePath}`,
      seller: {
        "@type": "Organization",
        name: "Korea By Local",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(product.categories
        ? [{
            "@type": "ListItem",
            position: 3,
            name: product.categories.name,
            item: `${SITE_URL}/shop`,
          }]
        : []),
      {
        "@type": "ListItem",
        position: product.categories ? 4 : 3,
        name: product.title,
      },
    ],
  };

  const hasOptions = product.product_options.length > 0;
  const showTotal = hasOptions || quantity > 1;

  return (
    <>
      <PageSEO
        title={pageTitle}
        description={pageDesc}
        path={pagePath}
        ogImage={product.thumbnail_url ?? undefined}
        ogType="product"
        jsonLd={[productSchema, breadcrumbSchema]}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-1.5 px-4 pt-[clamp(18px,2.5vw,30px)] text-[12.5px] text-muted-2 sm:px-6 lg:px-8"
      >
        <Link to="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link to="/shop" className="transition-colors hover:text-ink">
          Shop
        </Link>
        {product.categories && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{product.categories.name}</span>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate text-ink">{product.title}</span>
      </nav>

      {/* Main content: editorial column + sticky purchase card */}
      <section className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-[clamp(24px,3.5vw,44px)] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(16px,2vw,26px)] sm:px-6 lg:px-8">
        {/* Left editorial column */}
        <div className="min-w-[300px] flex-[3_1_460px]">
          {/* Badges */}
          {(product.badges?.length || hasDiscount) && (
            <div className="mb-3.5 flex flex-wrap gap-2">
              {product.badges?.map((badge) => (
                <span
                  key={badge}
                  className={`rounded-md px-2.5 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.06em] text-white ${
                    BADGE_COLORS[badge] ?? "bg-muted"
                  }`}
                >
                  {badge}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green/10 px-2.5 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.06em] text-green">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Buyer protection
              </span>
            </div>
          )}

          {/* Category */}
          {product.categories && (
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
              {product.categories.name}
            </p>
          )}

          {/* Title */}
          <h1 className="font-display text-[clamp(28px,4.2vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
            {product.title}
          </h1>

          {/* Meta row: views + share */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-sm text-muted-2">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {product.view_count.toLocaleString()} views
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </button>
          </div>

          {/* Gallery (main image + thumbnail row) */}
          <div className="mt-5">
            <ImageGallery
              images={product.images}
              thumbnailUrl={product.thumbnail_url}
              title={product.title}
            />
          </div>

          {/* Highlight cards row */}
          <div className="my-[26px]">
            <ProductHighlights />
          </div>

          {/* About this experience */}
          {product.description && (
            <>
              <h2 className="mb-3 font-display text-2xl font-bold text-ink">
                About this product
              </h2>
              <p className="max-w-[62ch] text-[15.5px] leading-[1.7] text-muted">
                {product.description}
              </p>
            </>
          )}

          {/* Full content (Description / Included / Booking / Cancellation) */}
          <div className="mt-12">
            <ContentTabs content={product.content} />
          </div>

          {/* Reviews summary */}
          <h2 className="mb-4 mt-12 font-display text-2xl font-bold text-ink">
            Reviews
          </h2>
          <div className="flex flex-wrap items-center gap-6 rounded-[18px] bg-white p-[22px] shadow-card">
            <div className="flex-none text-center">
              <div className="font-display text-[52px] font-extrabold leading-none text-ink">
                {product.view_count > 0 ? "—" : "New"}
              </div>
              <div
                className="mt-1 flex items-center justify-center gap-0.5 text-accent"
                aria-hidden="true"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="mt-1 text-[12.5px] text-muted-2">
                Be the first to review
              </div>
            </div>
            <p className="flex-1 basis-[220px] text-sm leading-relaxed text-muted">
              We&apos;d love to hear what you think. After your purchase, share a
              review to help other travellers shop with confidence.
            </p>
          </div>

          {/* Good to know accordion */}
          <h2 className="mb-3.5 mt-[34px] font-display text-2xl font-bold text-ink">
            Good to know
          </h2>
          <GoodToKnow />
        </div>

        {/* Right: sticky purchase card */}
        <aside className="sticky top-[88px] min-w-[280px] flex-[1_1_300px] rounded-[22px] bg-white p-6 shadow-float">
          {/* Price + compare-at price */}
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-[13px] text-muted-2">from</span>
            <span
              className={`font-display text-[34px] font-extrabold leading-none ${
                hasDiscount ? "text-accent" : "text-ink"
              }`}
            >
              {formatPrice(product.price, product.currency)}
            </span>
            {hasDiscount && product.compare_price != null && (
              <span className="text-[15px] text-muted-3 line-through">
                {formatPrice(product.compare_price, product.currency)}
              </span>
            )}
          </div>

          {/* Discount pill */}
          {hasDiscount && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
              Save {discountPct}%
            </div>
          )}

          {/* Sold out notice */}
          {isSoldOut && (
            <div className="mt-3 rounded-xl bg-cream-300 px-3 py-2 text-center text-sm font-semibold text-muted">
              Currently sold out
            </div>
          )}

          {/* Options */}
          {hasOptions && (
            <div className="mt-5">
              <OptionSelector
                options={product.product_options}
                selectedOptions={selectedOptions}
                onChange={setSelectedOptions}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="mt-5">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted-3">
              Quantity
            </span>
            <div className="inline-flex items-center rounded-xl border border-ink/15">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-muted-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="flex h-10 w-12 items-center justify-center border-x border-ink/15 text-sm font-semibold text-ink"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center text-muted-2 transition-colors hover:text-ink"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total breakdown */}
          {showTotal && (
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>
                  {formatPrice(unitPrice, product.currency)} × {quantity}
                </span>
                <span>{formatPrice(unitPrice * quantity, product.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-ink/10 pt-2.5 font-display text-lg font-extrabold text-ink">
                <span>Total</span>
                <span>{formatPrice(totalPrice, product.currency)}</span>
              </div>
            </div>
          )}

          {/* Primary CTA: Buy now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isSoldOut}
            className="mt-5 w-full rounded-[13px] bg-accent py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(255,45,120,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSoldOut ? "Sold Out" : "Buy Now"}
          </button>

          {/* Secondary CTA: Add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[13px] border border-ink/15 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-cream-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Add to Cart
          </button>

          {/* Reassurance line */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden="true" />
            Secure checkout · Buyer protection included
          </div>
        </aside>
      </section>

      {/* Related products */}
      <section className="mx-auto max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] sm:px-6 lg:px-8">
        <RelatedProducts
          categoryId={product.categories?.id}
          currentProductId={product.id}
        />
      </section>
    </>
  );
}
