import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Loader2, Plus, MapPin, TrainFront, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import PageSEO from "@/components/common/PageSEO";
import { useEbooks } from "@/hooks/useEbooks";
import { supabase } from "@/lib/supabase";
import EmailCaptureModal from "@/components/ebook/EmailCaptureModal";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css/pagination";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const FEATURES = [
  { icon: MapPin, label: "50+ Hidden Spots" },
  { icon: TrainFront, label: "Transport Decoded" },
  { icon: Utensils, label: "Food Guide" },
];

const TABLE_OF_CONTENTS = [
  "Getting around Korea — trains, buses & apps",
  "Seoul neighborhood guides",
  "Hidden cafés & local eats",
  "Festivals & seasonal events",
  "Day trips outside Seoul",
  "Practical tips & useful phrases",
];

const FAQS = [
  {
    q: "What format is the e-book?",
    a: "A downloadable PDF, readable on any phone, tablet, e-reader or computer.",
  },
  {
    q: "What's your refund policy?",
    a: "Full refund within 7 days if it's not for you — just email us.",
  },
  {
    q: "Do I get future updates?",
    a: "Yes. Major updates are free — redownload anytime from the same link.",
  },
];

export default function EbookPage() {
  const { data: ebooks, isLoading } = useEbooks();
  const ebook = ebooks?.[0];
  const [buying, setBuying] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const buyNow = async () => {
    if (!ebook || buying) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-ebook-checkout", {
        body: { ebook_id: ebook.id },
      });
      if (error || !data?.url) throw error ?? new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
      setBuying(false);
    }
  };

  const jsonLd = ebook
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: ebook.title,
        description: ebook.description ?? undefined,
        image: ebook.cover_image_url ?? undefined,
        offers: {
          "@type": "Offer",
          price: Number(ebook.price_usd),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">E-book coming soon</h1>
        <p className="mt-2 text-muted">Leave your email and we’ll let you know the moment it’s ready.</p>
        <button
          onClick={() => setShowSample(true)}
          className="mt-6 rounded-[13px] bg-accent px-6 py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Notify me
        </button>
        {showSample && (
          <EmailCaptureModal
            title="Get notified"
            description="We'll email you the moment the e-book is ready."
            source="ebook_page"
            leadMagnet="ebook_launch"
            successMessage="You're on the list — we'll email you when it's live!"
            onClose={() => setShowSample(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`${ebook.title} — E-book | Korea by Local`}
        description={(ebook.description ?? "Our full local guide to Korea, in one downloadable e-book.").slice(0, 160)}
        path="/ebook"
        ogImage={ebook.cover_image_url ?? undefined}
        ogType="product"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <div className="mx-auto max-w-[1080px] px-4 py-[clamp(32px,5vw,64px)] sm:px-6 lg:px-8">
        <div className="grid gap-[clamp(24px,4vw,48px)] lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
          {ebook.cover_image_url && (
            <div className="overflow-hidden rounded-[20px] bg-cream-200 shadow-[0_20px_44px_rgba(26,26,26,0.16)]">
              <img src={ebook.cover_image_url} alt={ebook.title} className="w-full object-cover" />
            </div>
          )}

          <div>
            <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-dark">
              E-book
            </span>
            <h1 className="mt-3 font-display text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              {ebook.title}
            </h1>
            {ebook.description && (
              <div className="mt-4 max-w-[60ch] space-y-3 text-[15.5px] leading-[1.65] text-muted">
                {ebook.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-[36px] font-extrabold text-ink">{money(Number(ebook.price_usd))}</span>
              <span className="text-[13px] text-muted-2">one-time</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={buyNow}
                disabled={buying}
                className="flex items-center gap-2 rounded-[13px] bg-accent px-8 py-4 text-[15.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {buying && <Loader2 className="h-4 w-4 animate-spin" />}
                Buy Now
              </button>
              <button
                onClick={() => setShowSample(true)}
                className="rounded-[13px] border border-ink/15 bg-white px-8 py-4 text-[15.5px] font-bold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Free Sample — 2 chapters
              </button>
            </div>
          </div>
        </div>

        {/* Feature row */}
        <div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <span className="text-[14.5px] font-bold text-ink">{label}</span>
            </div>
          ))}
        </div>

        {/* Preview carousel */}
        {ebook.preview_images.length > 0 && (
          <div className="mt-[clamp(32px,5vw,56px)]">
            <h2 className="font-display text-[20px] font-extrabold text-ink">Inside the guide</h2>
            <Swiper
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={14}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3.2 } }}
              className="ebook-preview-swiper mt-4 pb-9"
            >
              {ebook.preview_images.map((img, i) => (
                <SwiperSlide key={i}>
                  <img src={img} alt={`Preview page ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full rounded-xl object-cover" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Table of contents */}
        <div className="mt-[clamp(32px,5vw,56px)] rounded-2xl bg-gray-50 p-[clamp(22px,3vw,32px)]">
          <h2 className="font-display text-[20px] font-extrabold text-ink">What's inside</h2>
          <ol className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TABLE_OF_CONTENTS.map((item, i) => (
              <li key={item} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                <span className="font-display font-extrabold text-accent">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* FAQ */}
        <div className="mt-[clamp(32px,5vw,56px)]">
          <h2 className="font-display text-[20px] font-extrabold text-ink">Questions</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <button
                  key={f.q}
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  className="rounded-2xl bg-gray-50 p-[18px] px-5 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex-1 font-display text-[15.5px] font-bold text-ink">{f.q}</span>
                    <span
                      className={`flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full transition-all duration-200 ${
                        isOpen ? "rotate-45 bg-accent text-white" : "bg-ink/5 text-ink"
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                  <div
                    className="overflow-hidden text-[14px] leading-[1.6] text-muted transition-all duration-300"
                    style={isOpen ? { maxHeight: 200, opacity: 1, marginTop: 10 } : { maxHeight: 0, opacity: 0, marginTop: 0 }}
                  >
                    {f.a}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showSample && (
        <EmailCaptureModal
          title="Get a free sample"
          description="We'll send the first 2 chapters straight to your inbox."
          source="ebook_page"
          leadMagnet="ebook_sample"
          successMessage="Check your inbox — your free sample is on the way!"
          onClose={() => setShowSample(false)}
        />
      )}
    </>
  );
}
