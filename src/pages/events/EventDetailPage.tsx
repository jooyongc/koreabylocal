import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, CalendarDays, MapPin, Lock, Check } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PageSEO from "@/components/common/PageSEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useEvent } from "@/hooks/useEvents";
import { supabase } from "@/lib/supabase";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEvent(slug);
  const [buying, setBuying] = useState(false);

  const buyNow = async () => {
    if (!event || buying) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-event-checkout", {
        body: { event_id: event.id },
      });
      if (error || !data?.url) throw error ?? new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
      setBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Event not found</h1>
        <Link to="/events" className="mt-6 inline-block font-semibold text-accent">
          ← Back to events
        </Link>
      </div>
    );
  }

  const soldOut = event.sold_count >= event.capacity;
  const spotsLeft = Math.max(event.capacity - event.sold_count, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.event_date,
    location: event.location ? { "@type": "Place", name: event.location } : undefined,
    offers: {
      "@type": "Offer",
      price: Number(event.price_usd),
      priceCurrency: "USD",
      availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <PageSEO
        title={`${event.title} | Korea By Local`}
        description={(event.description ?? "A limited-time event in Korea.").slice(0, 160)}
        path={`/events/${event.slug}`}
        ogImage={event.cover_image_url ?? undefined}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-[1080px] px-4 py-[clamp(32px,5vw,64px)] sm:px-6 lg:px-8">
        <div className="grid gap-[clamp(24px,4vw,48px)] lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
          {event.cover_image_url && (
            <div className="overflow-hidden rounded-[20px] bg-cream-200 shadow-[0_20px_44px_rgba(26,26,26,0.16)]">
              <OptimizedImage src={event.cover_image_url} alt={event.title} preset="detail" priority className="w-full object-cover" />
            </div>
          )}

          <div>
            <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-dark">
              Event
            </span>
            <h1 className="mt-3 font-display text-[clamp(28px,4.5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              {event.title}
            </h1>
            {event.subtitle && <p className="mt-2 text-[15px] font-medium text-muted-2">{event.subtitle}</p>}

            <div className="mt-4 flex flex-col gap-1.5 text-[14.5px] text-ink">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                {format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}
                {event.time_label ? ` · ${event.time_label}` : ""}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-accent" /> {event.location}
                </span>
              )}
            </div>

            {event.description && (
              <div className="mt-5 max-w-[60ch] space-y-3 text-[15.5px] leading-[1.65] text-muted">
                {event.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {event.audience_note && (
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-dark">{event.audience_note}</p>
            )}

            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-[36px] font-extrabold text-ink">{money(Number(event.price_usd))}</span>
              {event.price_krw && <span className="text-[13px] text-muted-2">(≈ ₩{Number(event.price_krw).toLocaleString()})</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={buyNow}
                disabled={buying || soldOut}
                className="flex items-center gap-2 rounded-[13px] bg-accent px-8 py-4 text-[15.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {buying && <Loader2 className="h-4 w-4 animate-spin" />}
                {soldOut ? "Sold out" : "Reserve my spot"}
              </button>
              {!soldOut && (
                <span className="text-[13px] text-muted-2">
                  {spotsLeft} of {event.capacity} spots left
                </span>
              )}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-2">
              <Lock className="h-3 w-3" /> You'll pay on PayPal's secure checkout page. A confirmation code is emailed instantly.
            </p>
          </div>
        </div>

        {event.perks && event.perks.length > 0 && (
          <div className="mt-[clamp(32px,5vw,56px)] rounded-2xl bg-gray-50 p-[clamp(22px,3vw,32px)]">
            <h2 className="font-display text-[20px] font-extrabold text-ink">What you'll get</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {event.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
