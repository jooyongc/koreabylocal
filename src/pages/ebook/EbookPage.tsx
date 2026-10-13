import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/common/OptimizedImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Gift, Loader2, Lock, Plus, MapPin, TrainFront, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import PageSEO from "@/components/common/PageSEO";
import { useEbooks, type PublicEbook } from "@/hooks/useEbooks";
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

const FORMAT_FAQ = {
  q: "What format is the e-book?",
  a: "A downloadable PDF, readable on any phone, tablet, e-reader or computer.",
};

const UPDATES_FAQ = {
  q: "Do I get future updates?",
  a: "Yes. Major updates are free — email us and we'll send you a fresh download link.",
};

const FAQS = [
  FORMAT_FAQ,
  {
    q: "How do I pay?",
    a: "Through PayPal's secure checkout. Your download button appears the moment payment goes through, and the link is emailed to you too.",
  },
  {
    q: "What's your refund policy?",
    a: "Full refund within 7 days if it's not for you — just email us.",
  },
  UPDATES_FAQ,
];

// A $0 book never reaches PayPal (it won't open an order for nothing), so
// there is nothing to pay for or refund.
const FREE_FAQS = [
  FORMAT_FAQ,
  {
    q: "Is it really free?",
    a: "Yes — no payment and no card. Leave your email and the download starts right away. We'll email you the link too, along with occasional Korea travel tips you can unsubscribe from anytime.",
  },
  UPDATES_FAQ,
];

export default function EbookPage() {
  const { data: ebooks, isLoading } = useEbooks();
  const navigate = useNavigate();
  const [showSample, setShowSample] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!ebooks || ebooks.length === 0) {
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

  // Several books live: a short list, each with its own buy/download button,
  // rather than the single-book landing page below.
  if (ebooks.length > 1) {
    return <EbookListPage ebooks={ebooks} navigate={navigate} />;
  }

  return <EbookDetail ebook={ebooks[0]} navigate={navigate} />;
}

function EbookListPage({ ebooks, navigate }: { ebooks: PublicEbook[]; navigate: ReturnType<typeof useNavigate> }) {
  const [freeEbook, setFreeEbook] = useState<PublicEbook | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const claimFree = async (ebook: PublicEbook, email: string) => {
    const { data, error } = await supabase.functions.invoke("claim-free-ebook", {
      body: { ebook_id: ebook.id, email },
    });
    if (error || !data?.download_token) {
      toast.error("Couldn't get your copy. Please try again.");
      return false;
    }
    toast.success("Your download is starting — we've emailed you the link too.");
    navigate(`/ebook/download/${data.download_token}`);
    return true;
  };

  const buyNow = async (ebook: PublicEbook) => {
    if (buyingId) return;
    setBuyingId(ebook.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-ebook-checkout", {
        body: { ebook_id: ebook.id },
      });
      if (error || !data?.url) throw error ?? new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
      setBuyingId(null);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ebooks.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: e.title,
        description: e.description ?? undefined,
        image: e.cover_image_url ?? undefined,
        offers: {
          "@type": "Offer",
          price: Number(e.price_usd),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <>
      <PageSEO
        title="Free E-books & Travel Guides | Korea by Local"
        description="Our Korea travel e-books — hidden spots, food, transport and practical tips, written by locals."
        path="/ebook"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-[1080px] px-4 py-[clamp(32px,5vw,64px)] sm:px-6 lg:px-8">
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
          E-books & Guides
        </h1>
        <p className="mt-2 max-w-[60ch] text-[15px] text-muted">
          Written and checked by people who actually live here — not scraped or AI-written.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ebooks.map((ebook) => {
            const isFree = Number(ebook.price_usd) === 0;
            return (
              <div
                key={ebook.id}
                className="flex flex-col overflow-hidden rounded-[20px] border border-ink/10 bg-white shadow-[0_8px_26px_rgba(26,26,26,0.06)]"
              >
                {ebook.cover_image_url && (
                  <div className="aspect-[16/10] bg-cream-200">
                    <OptimizedImage src={ebook.cover_image_url} alt={ebook.title} preset="card" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-[18px] font-extrabold leading-[1.25] text-ink">{ebook.title}</h2>
                  {ebook.description && (
                    <p className="mt-2 line-clamp-3 text-[14px] leading-[1.55] text-muted">{ebook.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-display text-[18px] font-extrabold text-ink">
                      {isFree ? "Free" : money(Number(ebook.price_usd))}
                    </span>
                    <button
                      onClick={isFree ? () => setFreeEbook(ebook) : () => buyNow(ebook)}
                      disabled={buyingId === ebook.id}
                      className="flex items-center gap-2 rounded-[11px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {buyingId === ebook.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isFree ? "Download free" : "Buy Now"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {freeEbook && (
        <EmailCaptureModal
          title="Get your free copy"
          description="Enter your email and the download starts right away. We'll email you the link too, plus occasional Korea travel tips — unsubscribe anytime."
          source="ebook_page"
          leadMagnet="free_ebook"
          submitLabel="Download free"
          onSubmitEmail={(email) => claimFree(freeEbook, email)}
          onClose={() => setFreeEbook(null)}
        />
      )}
    </>
  );
}

function EbookDetail({ ebook, navigate }: { ebook: PublicEbook; navigate: ReturnType<typeof useNavigate> }) {
  const isFree = Number(ebook.price_usd) === 0;
  const [buying, setBuying] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showFree, setShowFree] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = isFree ? FREE_FAQS : FAQS;

  // Free books are handed over for an email (claim-free-ebook subscribes it);
  // the download page then fetches the file.
  const claimFree = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("claim-free-ebook", {
      body: { ebook_id: ebook.id, email },
    });
    if (error || !data?.download_token) {
      toast.error("Couldn't get your copy. Please try again.");
      return false;
    }
    toast.success("Your download is starting — we've emailed you the link too.");
    navigate(`/ebook/download/${data.download_token}`);
    return true;
  };

  const buyNow = async () => {
    if (buying) return;
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

  const jsonLd = {
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
  };

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
              <OptimizedImage src={ebook.cover_image_url} alt={ebook.title} preset="detail" priority className="w-full object-cover" />
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
              {isFree ? (
                <span className="font-display text-[36px] font-extrabold text-ink">Free</span>
              ) : (
                <>
                  <span className="font-display text-[36px] font-extrabold text-ink">{money(Number(ebook.price_usd))}</span>
                  <span className="text-[13px] text-muted-2">one-time</span>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={isFree ? () => setShowFree(true) : buyNow}
                disabled={buying}
                className="flex items-center gap-2 rounded-[13px] bg-accent px-8 py-4 text-[15.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {buying && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFree ? "Download free" : "Buy Now"}
              </button>
              {!isFree && (
                <button
                  onClick={() => setShowSample(true)}
                  className="rounded-[13px] border border-ink/15 bg-white px-8 py-4 text-[15.5px] font-bold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  Free Sample — 2 chapters
                </button>
              )}
            </div>
            {isFree ? (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-2">
                <Gift className="h-3 w-3" /> No payment needed — just your email. The download starts right away.
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-2">
                <Lock className="h-3 w-3" /> You'll pay on PayPal's secure checkout page. Full refund within 7 days.
              </p>
            )}
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
                  <OptimizedImage src={img} alt={`Preview page ${i + 1}`} preset="card" className="aspect-[3/4] w-full rounded-xl object-cover" />
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
            {faqs.map((f, i) => {
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

      {showFree && (
        <EmailCaptureModal
          title="Get your free copy"
          description="Enter your email and the download starts right away. We'll email you the link too, plus occasional Korea travel tips — unsubscribe anytime."
          source="ebook_page"
          leadMagnet="free_ebook"
          submitLabel="Download free"
          onSubmitEmail={claimFree}
          onClose={() => setShowFree(false)}
        />
      )}

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
