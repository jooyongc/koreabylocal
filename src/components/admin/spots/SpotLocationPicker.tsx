/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { APIProvider, AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2, MapPin, Search } from "lucide-react";
import { GOOGLE_MAPS_KEY, MAP_ID, RENDERING_TYPE, SEOUL } from "@/lib/maps";
import LogoPin from "@/components/spots/LogoPin";
import { isRealLocation } from "@/lib/geo";
import type { SpotFormData } from "@/types/admin";

/**
 * Pick a spot's location on a map: search for a place (Places API "New"
 * autocomplete) to drop the pin and fill the address and Google Maps link,
 * then click the map or drag the pin to the exact meeting point.
 *
 * Renders nothing without a Maps key — the manual fields below still work.
 */
export default function SpotLocationPicker() {
  if (!GOOGLE_MAPS_KEY) return null;
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} language="en" region="KR">
      <Picker />
    </APIProvider>
  );
}

interface LatLng {
  lat: number;
  lng: number;
}

function Picker() {
  const { watch, setValue } = useFormContext<SpotFormData>();
  const lat = watch("latitude");
  const lng = watch("longitude");
  const position: LatLng | null = isRealLocation(lat, lng) ? { lat: Number(lat), lng: Number(lng) } : null;
  // Bumped when a search result should move the camera; clicks and drags don't.
  const [flyTo, setFlyTo] = useState<{ at: LatLng; n: number } | null>(null);

  const setPosition = (p: LatLng) => {
    // Seven decimals is ~1 cm — plenty, and keeps the inputs readable.
    setValue("latitude", Number(p.lat.toFixed(7)), { shouldDirty: true });
    setValue("longitude", Number(p.lng.toFixed(7)), { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      <PlaceSearch
        onPick={(place) => {
          setPosition(place.location);
          setFlyTo({ at: place.location, n: Date.now() });
          if (place.address) setValue("address", place.address, { shouldDirty: true });
          if (place.mapsUrl) setValue("google_maps_url", place.mapsUrl, { shouldDirty: true });
        }}
      />
      <div className="h-[320px] overflow-hidden rounded-lg border border-gray-200">
        <Map
          mapId={MAP_ID}
          renderingType={RENDERING_TYPE}
          defaultCenter={position ?? SEOUL}
          defaultZoom={position ? 16 : 11}
          gestureHandling="greedy"
          clickableIcons={false}
          onClick={(e) => {
            const p = e.detail.latLng;
            if (p) setPosition(p);
          }}
          className="h-full w-full"
        >
          <FlyTo target={flyTo} />
          {position && (
            <AdvancedMarker
              position={position}
              draggable
              onDragEnd={(e) => {
                const p = e.latLng;
                if (p) setPosition({ lat: p.lat(), lng: p.lng() });
              }}
            >
              <LogoPin active />
            </AdvancedMarker>
          )}
        </Map>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <MapPin className="h-3.5 w-3.5" />
        Search above, then click the map or drag the pin to the exact meeting point.
      </p>
    </div>
  );
}

function FlyTo({ target }: { target: { at: LatLng; n: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    // One jump, not panTo + setZoom: the two animations together left the
    // raster map stuck on a blurred, upscaled frame until something else made
    // it repaint (a page scroll did).
    map.moveCamera({ center: target.at, zoom: 17 });
  }, [map, target]);
  return null;
}

interface PickedPlace {
  location: LatLng;
  address: string | null;
  mapsUrl: string | null;
}

function PlaceSearch({ onPick }: { onPick: (p: PickedPlace) => void }) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One token per search session (typing → pick) — Google bills per session with it.
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    if (!places || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++latest.current;
    const t = setTimeout(async () => {
      try {
        token.current ??= new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: token.current,
          includedRegionCodes: ["kr"],
          language: "en",
        });
        if (id !== latest.current) return; // a newer keystroke already asked
        setSuggestions(suggestions.filter((s) => s.placePrediction));
        setError(null);
      } catch (err) {
        if (id !== latest.current) return;
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Search failed");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [places, query]);

  const pick = async (s: google.maps.places.AutocompleteSuggestion) => {
    const prediction = s.placePrediction;
    if (!prediction) return;
    setPicking(true);
    setOpen(false);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName", "googleMapsURI"] });
      token.current = null; // the session ends with this fetch
      if (!place.location) throw new Error("That place has no location");
      setQuery(place.displayName ?? prediction.text.toString());
      onPick({
        location: { lat: place.location.lat(), lng: place.location.lng() },
        address: place.formattedAddress ?? null,
        mapsUrl: place.googleMapsURI ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that place");
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          // Enter picks the first suggestion instead of submitting the spot form.
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions[0]) pick(suggestions[0]);
          }
        }}
        placeholder="Search a place — e.g. Gwangjang Market, Hongdae Station Exit 9"
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {picking && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => {
            const p = s.placePrediction!;
            return (
              <li key={p.placeId ?? i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="block text-sm font-medium text-gray-800">{p.mainText?.toString() ?? p.text.toString()}</span>
                  {p.secondaryText && <span className="block text-xs text-gray-400">{p.secondaryText.toString()}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
