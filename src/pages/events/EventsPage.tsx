import { Link } from "react-router-dom";
import { Loader2, CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import PageSEO from "@/components/common/PageSEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useEvents } from "@/hooks/useEvents";

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();

  return (
    <>
      <PageSEO
        title="Events | Korea By Local"
        description="Limited-time events in Korea — meet locals, join a cultural experience, and book your spot."
        path="/events"
      />

      <div className="mx-auto max-w-[1080px] px-4 py-[clamp(32px,5vw,64px)] sm:px-6 lg:px-8">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-dark">
          Events
        </span>
        <h1 className="mt-3 font-display text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
          Limited-time events
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15.5px] text-muted">
          Small, hands-on experiences with real locals — booked in advance, with limited spots.
        </p>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : !events || events.length === 0 ? (
          <p className="mt-10 text-muted">No events are open for booking right now — check back soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {events.map((event) => {
              const soldOut = event.sold_count >= event.capacity;
              return (
                <Link
                  key={event.id}
                  to={`/events/${event.slug}`}
                  className="group overflow-hidden rounded-[20px] border border-ink/10 bg-white shadow-[0_8px_26px_rgba(26,26,26,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(26,26,26,0.12)]"
                >
                  {event.cover_image_url && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-200">
                      <OptimizedImage
                        src={event.cover_image_url}
                        alt={event.title}
                        preset="card"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {soldOut && (
                        <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          Sold out
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="font-display text-[19px] font-extrabold text-ink">{event.title}</h2>
                    <div className="mt-2 flex flex-col gap-1 text-[13.5px] text-muted-2">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {format(new Date(event.event_date), "EEE, MMM d, yyyy")}
                        {event.time_label ? ` · ${event.time_label}` : ""}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
