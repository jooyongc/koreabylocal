import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageCircle,
} from "lucide-react";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import { useSpot } from "@/hooks/useSpot";
import { useExperiences, useRegion } from "@/hooks/useConcepts";
import { useBlogPostsBySlugs } from "@/hooks/useBlogPost";
import { supabase } from "@/lib/supabase";
import SpotCard from "@/components/home/SpotCard";

export default function SpotDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: spot, isLoading } = useSpot(slug);

  // Best-effort view count (mirrors BlogDetailPage's pattern).
  useEffect(() => {
    if (!spot?.id) return;
    supabase.functions
      .invoke("increment-view-count", { body: { type: "spot", id: spot.id } })
      .catch(() => {});
  }, [spot?.id]);

  const { data: region } = useRegion(spot?.region ?? undefined);
  const { data: moreInRegion } = useExperiences({ region: spot?.region ?? undefined, limit: 4 });
  const { data: relatedPosts } = useBlogPostsBySlugs(spot?.related_post_slugs ?? []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Spot not found</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-accent">← Back to Explore</Link>
      </div>
    );
  }

  const images = (Array.isArray(spot.images) ? (spot.images as string[]) : []).filter(Boolean);
  const hero = spot.thumbnail_url || images[0] || "";
  const regionName = region?.name ?? spot.area ?? spot.location ?? undefined;
  const sidebarSpots = (moreInRegion ?? []).filter((s) => s.id !== spot.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: spot.title,
    description: spot.tagline ?? spot.description ?? spot.title,
    image: hero || undefined,
    address: spot.address ?? undefined,
    telephone: spot.phone ?? undefined,
    url: `${SITE_URL}/spots/${spot.slug}`,
    ...(spot.latitude != null && spot.longitude != null
      ? { geo: { "@type": "GeoCoordinates", latitude: spot.latitude, longitude: spot.longitude } }
      : {}),
    ...(spot.hours ? { openingHours: spot.hours } : {}),
  };

  return (
    <>
      <PageSEO
        title={regionName ? `${spot.title} — ${regionName} | Korea by Local` : `${spot.title} | Korea by Local`}
        description={(spot.tagline ?? spot.description ?? `${spot.title} — a local spot in ${spot.location ?? "Korea"}.`).slice(0, 160)}
        path={`/spots/${spot.slug}`}
        ogImage={hero || undefined}
        jsonLd={jsonLd}
      />

      {/* 1. Hero */}
      {hero && (
        <div className="h-[400px] w-full overflow-hidden bg-cream-200">
          <img src={hero} alt={spot.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-[1180px] px-4 py-[clamp(24px,4vw,44px)] sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-[clamp(28px,4vw,52px)] lg:grid-cols-[1fr_320px]">
          {/* 2. Content */}
          <div className="mx-auto w-full max-w-[800px] lg:mx-0">
            <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-2">
              <Link to="/" className="hover:text-ink">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate text-ink">{spot.title}</span>
            </nav>

            <h1 className="font-display text-[clamp(28px,4.2vw,42px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
              {spot.title}
            </h1>
            {spot.tagline && (
              <p className="mt-2.5 font-serif-accent text-[18px] italic text-muted">{spot.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {spot.spot_type && (
                <span className="rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-accent-dark">
                  {spot.spot_type}
                </span>
              )}
              {regionName && (
                <span className="flex items-center gap-1 text-[13.5px] font-medium text-muted-2">
                  <MapPin className="h-3.5 w-3.5" /> {regionName}
                </span>
              )}
            </div>

            <hr className="mt-6 border-ink/10" />

            {spot.description && (
              <section className="mt-7">
                <h2 className="font-display text-[19px] font-extrabold text-ink">Why we love it</h2>
                <p className="mt-2.5 text-[15.5px] leading-[1.75] text-ink">{spot.description}</p>
              </section>
            )}

            {spot.tips && (
              <section className="mt-8">
                <h2 className="font-display text-[19px] font-extrabold text-ink">Tips from a local</h2>
                <p className="mt-2.5 text-[15.5px] leading-[1.7] text-ink">{spot.tips}</p>
              </section>
            )}

            {/* Place info card */}
            <div className="mt-8 grid gap-3 rounded-2xl bg-gray-50 p-5 text-[14px] text-ink sm:grid-cols-2">
              {(spot.address || spot.location) && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <div>{spot.address ?? spot.location}</div>
                    {spot.google_maps_url && (
                      <a
                        href={spot.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline"
                      >
                        Get directions <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {spot.hours && (
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{spot.hours}</span>
                </div>
              )}
              {spot.price_range && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-accent">💰</span>
                  <span>{spot.price_range}</span>
                </div>
              )}
              {spot.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <a href={`tel:${spot.phone}`} className="hover:underline">{spot.phone}</a>
                </div>
              )}
              {spot.website && (
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <a href={spot.website} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                    {spot.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {spot.instagram && (
                <div className="flex items-start gap-2">
                  <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <a
                    href={`https://instagram.com/${spot.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    @{spot.instagram.replace(/^@/, "")}
                  </a>
                </div>
              )}
            </div>

            {spot.latitude != null && spot.longitude != null && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
                <iframe
                  title={`Map to ${spot.title}`}
                  src={`https://maps.google.com/maps?q=${spot.latitude},${spot.longitude}&output=embed`}
                  className="h-[280px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* 3. Sidebar */}
          <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
            {sidebarSpots.length > 0 && (
              <div>
                <h3 className="font-display text-[15px] font-extrabold text-ink">
                  More in {regionName ?? "the area"}
                </h3>
                <div className="mt-3 flex flex-col gap-3">
                  {sidebarSpots.map((s) => (
                    <SpotCard key={s.id} spot={s} />
                  ))}
                </div>
              </div>
            )}

            {relatedPosts && relatedPosts.length > 0 && (
              <div>
                <h3 className="font-display text-[15px] font-extrabold text-ink">From the guidebook</h3>
                <div className="mt-3 flex flex-col gap-2.5">
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/guidebook/${post.slug}`}
                      className="rounded-xl border border-ink/10 bg-white p-3.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              to="/about"
              className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="text-[13.5px] font-bold">Need more like this?</div>
                <div className="text-[12px] text-white/70">Chat with a real local →</div>
              </div>
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
