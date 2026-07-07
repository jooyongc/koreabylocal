import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, Star, Check, ChevronRight, Minus, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import { useExperience } from "@/hooks/useConcepts";
import { useCartStore } from "@/stores/useCartStore";

const money = (n: number | null | undefined, currency = "USD") =>
  n == null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exp, isLoading } = useExperience(slug);
  const addItem = useCartStore((s) => s.addItem);
  const [guests, setGuests] = useState(1);
  const [heroIdx, setHeroIdx] = useState(0);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  if (!exp) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Experience not found</h1>
        <Link to="/tours" className="mt-4 inline-block font-semibold text-accent">← Back to all experiences</Link>
      </div>
    );
  }

  const images = (Array.isArray(exp.images) ? (exp.images as string[]) : []).filter(Boolean);
  const hero = images[heroIdx] || exp.thumbnail_url || images[0] || "";
  const content = (exp as unknown as { content?: string }).content ?? "";
  const hasDiscount = exp.compare_price != null && Number(exp.compare_price) > Number(exp.price);

  const book = () => {
    addItem({
      id: `exp-${exp.id}`,
      productId: exp.id,
      slug: exp.slug,
      title: exp.title,
      price: Number(exp.price),
      quantity: guests,
      selectedOptions: `${guests} guest${guests > 1 ? "s" : ""}`,
      thumbnail: exp.thumbnail_url ?? images[0] ?? undefined,
    });
    toast.success("Added to your booking!");
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: exp.title,
    image: images.length ? images : exp.thumbnail_url ? [exp.thumbnail_url] : [],
    description: exp.description ?? exp.title,
    category: exp.category ?? "Tours",
    brand: { "@type": "Brand", name: "Korea by Local" },
    offers: {
      "@type": "Offer",
      price: Number(exp.price),
      priceCurrency: exp.currency ?? "USD",
      availability: exp.is_active ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${SITE_URL}/tours/${exp.slug}`,
    },
    ...(exp.rating != null ? { aggregateRating: { "@type": "AggregateRating", ratingValue: exp.rating, reviewCount: exp.reviews_count || 1 } } : {}),
  };

  return (
    <>
      <PageSEO
        title={`${exp.title} | Korea By Local`}
        description={(exp.description ?? `Book ${exp.title} — a local-led experience in ${exp.location ?? "Korea"}.`).slice(0, 160)}
        path={`/tours/${exp.slug}`}
        ogImage={exp.thumbnail_url ?? images[0] ?? undefined}
        ogType="product"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/tours" className="hover:text-ink">Experiences</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-ink">{exp.title}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left: gallery + content */}
          <div className="min-w-0 flex-[3_1_560px]">
            {hero && (
              <div className="overflow-hidden rounded-[20px] bg-cream-200">
                <img src={hero} alt={exp.title} className="aspect-[16/10] w-full object-cover" />
              </div>
            )}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 8).map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === heroIdx ? "border-accent" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Header (mobile shows here) */}
            <div className="mt-6 lg:hidden">
              <TourHeader exp={exp} />
            </div>

            {content && (
              <div
                className="kbl-article mt-7 max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>

          {/* Right: booking card */}
          <aside className="lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0">
            <div className="hidden lg:block">
              <TourHeader exp={exp} />
            </div>
            <div className="mt-5 rounded-[18px] border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(16,15,44,0.08)]">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] text-muted-2">from</span>
                <span className="font-display text-[30px] font-extrabold text-ink">{money(Number(exp.price), exp.currency ?? "USD")}</span>
                {hasDiscount && <span className="text-[15px] text-muted-3 line-through">{money(Number(exp.compare_price), exp.currency ?? "USD")}</span>}
                <span className="text-[13px] text-muted-2">/ person</span>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-ink/10 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-ink">Guests</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setGuests((g) => Math.max(1, g - 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-200 text-ink hover:bg-cream-300" aria-label="Fewer guests">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center font-bold text-ink">{guests}</span>
                  <button onClick={() => setGuests((g) => Math.min(20, g + 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-200 text-ink hover:bg-cream-300" aria-label="More guests">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[14px]">
                <span className="text-muted-2">Total</span>
                <span className="font-display text-[20px] font-extrabold text-ink">{money(Number(exp.price) * guests, exp.currency ?? "USD")}</span>
              </div>

              <button
                onClick={book}
                disabled={!exp.is_active}
                className="mt-4 w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {exp.is_active ? "Add to booking" : "Sold out"}
              </button>
              <Link to="/cart" className="mt-2.5 block text-center text-[13px] font-semibold text-accent hover:underline">
                View booking →
              </Link>

              <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[12.5px] text-muted-2">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Local host · small group</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Instant confirmation</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Secure checkout (PayPal)</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function TourHeader({ exp }: { exp: { title: string; location: string | null; duration: string | null; rating: number | null; reviews_count: number; badge: string | null; category: string | null } }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {exp.category && <span className="rounded-full bg-purple/15 px-2.5 py-1 text-[11px] font-bold text-purple">{exp.category}</span>}
        {exp.badge && <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">{exp.badge}</span>}
      </div>
      <h1 className="mt-2.5 font-display text-[clamp(24px,3.5vw,36px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
        {exp.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-muted-2">
        {exp.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" /> {exp.location}</span>}
        {exp.duration && <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-accent" /> {exp.duration}</span>}
        {exp.rating != null && (
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /> {exp.rating} ({exp.reviews_count})</span>
        )}
      </div>
    </div>
  );
}
