import { useParams, Link } from "react-router-dom";
import { ChevronRight, Sun, Navigation2, Loader2 } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { useRegion, useExperiences } from "@/hooks/useConcepts";

export default function DestinationDetailPage() {
  const { region } = useParams<{ region: string }>();
  const { data: destination, isLoading: loadingRegion } = useRegion(region);
  const { data: spots, isLoading: loadingSpots } = useExperiences({ region });

  if (loadingRegion) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Destination not found</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-accent">← Back to Explore</Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`${destination.name} | Korea By Local`}
        description={destination.description ?? destination.blurb ?? `Explore ${destination.name} with Korea By Local.`}
        path={`/destinations/${destination.key}`}
        ogImage={destination.cover_image_url ?? undefined}
      />

      {destination.cover_image_url && (
        <div className="relative h-[clamp(220px,32vw,380px)] w-full overflow-hidden bg-cream-200">
          <img src={destination.cover_image_url} alt={destination.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1180px] px-4 pb-7 sm:px-6 lg:px-8">
            <h1 className="font-display text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
              {destination.name}
            </h1>
            {destination.tag && (
              <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">
                {destination.tag}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1180px] px-4 py-[clamp(24px,4vw,44px)] sm:px-6 lg:px-8">
        <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">{destination.name}</span>
        </nav>

        {!destination.cover_image_url && (
          <h1 className="font-display text-[clamp(28px,4.5vw,44px)] font-extrabold tracking-[-0.02em] text-ink">
            {destination.name}
          </h1>
        )}

        {(destination.description ?? destination.blurb) && (
          <p className="mt-4 max-w-[70ch] text-[15.5px] leading-[1.65] text-muted">
            {destination.description ?? destination.blurb}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted-2">
          {destination.best_season && (
            <span className="flex items-center gap-1.5"><Sun className="h-4 w-4 text-accent" /> Best season: {destination.best_season}</span>
          )}
          {destination.getting_there_summary && (
            <span className="flex items-center gap-1.5"><Navigation2 className="h-4 w-4 text-accent" /> {destination.getting_there_summary}</span>
          )}
        </div>

        <h2 className="mt-10 font-display text-[22px] font-extrabold text-ink">Spots in {destination.name}</h2>

        {loadingSpots ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : spots && spots.length > 0 ? (
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[16px]">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                to={`/spots/${spot.slug}`}
                className="group flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(26,26,26,0.16)]"
              >
                {spot.thumbnail_url && (
                  <div className="aspect-[16/10] overflow-hidden bg-cream-200">
                    <img
                      src={spot.thumbnail_url}
                      alt={spot.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  {spot.spot_type && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-accent">{spot.spot_type}</span>
                  )}
                  <h3 className="mt-1 font-display text-[16px] font-bold text-ink">{spot.title}</h3>
                  {spot.tagline && <p className="mt-1 text-[13px] text-muted-2">{spot.tagline}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">No spots added for this destination yet.</p>
        )}
      </div>
    </>
  );
}

