import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, Phone, Globe, Instagram, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import { useExperience } from "@/hooks/useConcepts";

export default function SpotDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: spot, isLoading } = useExperience(slug);

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
  const relatedSlugs = spot.related_post_slugs ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: spot.title,
    description: spot.tagline ?? spot.description ?? spot.title,
    image: hero || undefined,
    address: spot.address ?? undefined,
    telephone: spot.phone ?? undefined,
    url: `${SITE_URL}/spots/${spot.slug}`,
  };

  return (
    <>
      <PageSEO
        title={`${spot.title} | Korea By Local`}
        description={(spot.tagline ?? spot.description ?? `${spot.title} — a local spot in ${spot.location ?? "Korea"}.`).slice(0, 160)}
        path={`/spots/${spot.slug}`}
        ogImage={hero || undefined}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-ink">{spot.title}</span>
        </nav>

        {hero && (
          <div className="overflow-hidden rounded-[20px] bg-cream-200">
            <img src={hero} alt={spot.title} className="aspect-[16/10] w-full object-cover" />
          </div>
        )}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.slice(0, 8).map((img, i) => (
              <img key={img + i} src={img} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {spot.spot_type && (
            <span className="rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-accent-dark">
              {spot.spot_type}
            </span>
          )}
          {spot.editor_pick && (
            <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-bold text-ink">★ Editor's pick</span>
          )}
          {spot.price_range && <span className="text-[13px] font-semibold text-muted-2">{spot.price_range}</span>}
        </div>

        <h1 className="mt-2.5 font-display text-[clamp(26px,4vw,40px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
          {spot.title}
        </h1>
        {spot.tagline && (
          <p className="mt-2 font-serif-accent text-[17px] italic text-muted">{spot.tagline}</p>
        )}

        <div className="mt-4 grid gap-2.5 rounded-[16px] border border-ink/10 bg-white p-4 text-[14px] text-ink sm:grid-cols-2">
          {(spot.address || spot.location) && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <div>{spot.address ?? spot.location}</div>
                {spot.area && <div className="text-[12.5px] text-muted-2">{spot.area}</div>}
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

        {spot.description && (
          <p className="mt-7 max-w-none text-[15.5px] leading-[1.75] text-ink">{spot.description}</p>
        )}

        {spot.tips && (
          <div className="mt-6 rounded-[16px] bg-accent-light p-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent-dark">Local tips</div>
            <p className="mt-1.5 text-[14.5px] leading-[1.6] text-ink">{spot.tips}</p>
          </div>
        )}

        {relatedSlugs.length > 0 && (
          <div className="mt-9 border-t border-ink/10 pt-6">
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">Read more</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {relatedSlugs.map((s) => (
                <Link
                  key={s}
                  to={`/guidebook/${s}`}
                  className="rounded-full border border-ink/10 px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:border-accent hover:text-accent"
                >
                  {s.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
