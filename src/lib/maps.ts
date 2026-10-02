// Google Maps settings shared by the site map and the admin location picker.

const RAW_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();

/**
 * Real browser keys start with "AIza"; anything else is a placeholder, and
 * Google would still draw a degraded map with it, so treat it as no key.
 */
export const GOOGLE_MAPS_KEY = RAW_KEY?.startsWith("AIza") ? RAW_KEY : undefined;

/** Pages lay themselves out without a map when there's no key. */
export const MAPS_ENABLED = !!GOOGLE_MAPS_KEY;

/**
 * Advanced markers need a Map ID, and the map's look comes from the cloud
 * style attached to it: "koreabylocal-mono" (light, monochrome — so the pink
 * pins carry the colour), in GCP project gen-lang-client-0072618778 → Google
 * Maps Platform → Map Management. Map IDs aren't secret; they ship in the page.
 */
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || "846254e4f3eaedcd989c8771";

export const SEOUL = { lat: 37.5665, lng: 126.978 };
