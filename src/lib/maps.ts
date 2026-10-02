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
 * Advanced markers need a Map ID. DEMO_MAP_ID works everywhere; set
 * VITE_GOOGLE_MAPS_MAP_ID to a real one (Cloud console → Map Management) to style the map.
 */
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || "DEMO_MAP_ID";

export const SEOUL = { lat: 37.5665, lng: 126.978 };
