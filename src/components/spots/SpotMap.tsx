import { useEffect } from "react";
import { Link } from "react-router-dom";
import { APIProvider, AdvancedMarker, InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import OptimizedImage from "@/components/common/OptimizedImage";
import LogoPin from "@/components/spots/LogoPin";
import { hasCoords, type MapSpot } from "@/hooks/useMapSpots";
import { GOOGLE_MAPS_KEY as API_KEY, MAP_ID, RENDERING_TYPE, SEOUL } from "@/lib/maps";

interface Props {
  spots: MapSpot[];
  activeId?: number | null;
  onSelect?: (id: number | null) => void;
  /** Homepage preview: no controls, scroll-wheel doesn't hijack the page. */
  simple?: boolean;
  className?: string;
}

/** Spots as pins on a Google map. Spots without coordinates simply aren't on it. */
export default function SpotMap({ spots, activeId = null, onSelect, simple = false, className = "" }: Props) {
  const placed = spots.filter(hasCoords);

  if (!API_KEY) return null;

  const active = placed.find((s) => s.id === activeId) ?? null;

  return (
    <div className={`overflow-hidden rounded-[20px] ${className}`}>
      <APIProvider apiKey={API_KEY} language="en" region="KR">
        <Map
          mapId={MAP_ID}
          renderingType={RENDERING_TYPE}
          defaultCenter={SEOUL}
          defaultZoom={11}
          gestureHandling={simple ? "cooperative" : "greedy"}
          disableDefaultUI={simple}
          clickableIcons={false}
          onClick={() => onSelect?.(null)}
          className="h-full w-full"
        >
          <FitToSpots spots={placed} />
          {placed.map((s) => {
            const on = s.id === activeId;
            return (
              <AdvancedMarker
                key={s.id}
                position={{ lat: s.latitude, lng: s.longitude }}
                title={s.title}
                zIndex={on ? 10 : 1}
                onClick={() => onSelect?.(on ? null : s.id)}
              >
                <LogoPin active={on} />
              </AdvancedMarker>
            );
          })}
          {active && (
            <InfoWindow
              position={{ lat: active.latitude, lng: active.longitude }}
              pixelOffset={[0, -56]}
              headerDisabled
              onCloseClick={() => onSelect?.(null)}
            >
              <SpotPopup spot={active} />
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

/** Frames every pin once the spots (or the filter) change. */
function FitToSpots({ spots }: { spots: Array<MapSpot & { latitude: number; longitude: number }> }) {
  const map = useMap();
  const key = spots.map((s) => s.id).join(",");

  useEffect(() => {
    if (!map || spots.length === 0) return;
    if (spots.length === 1) {
      map.setCenter({ lat: spots[0].latitude, lng: spots[0].longitude });
      map.setZoom(14);
      return;
    }
    const lats = spots.map((s) => s.latitude);
    const lngs = spots.map((s) => s.longitude);
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      48,
    );
    // Re-frame only when the set of pins changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

function SpotPopup({ spot }: { spot: MapSpot }) {
  const image = spot.thumbnail_url ?? (Array.isArray(spot.images) ? (spot.images as string[])[0] : undefined);
  return (
    <Link to={`/spots/${spot.slug}`} className="flex w-[220px] gap-2.5 text-left">
      {image && (
        <OptimizedImage src={image} alt={spot.title} preset="thumbnail" className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <div className="line-clamp-2 text-[13px] font-bold leading-tight text-ink">{spot.title}</div>
        <div className="mt-1 text-[11.5px] text-muted-2">{spot.area ?? spot.location}</div>
        <div className="mt-1 text-[11.5px] font-semibold text-accent">View →</div>
      </div>
    </Link>
  );
}
