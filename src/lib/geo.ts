export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * True for a usable location. (0, 0) — a point in the Atlantic — is what the
 * imweb import wrote for "no location", so it counts as missing.
 */
export function isRealLocation(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && !(a === 0 && b === 0);
}

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Reads coordinates out of a pasted Google Maps link, so the admin doesn't
 * type them by hand. Order matters: `!3d…!4d…` is the place itself, while
 * `@lat,lng` is only where the map view was centred.
 *
 * Short links (maps.app.goo.gl/…) carry no coordinates — they only redirect.
 */
export function parseGoogleMapsLatLng(url: string): LatLng | null {
  let text = url.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // A half-typed "%" sequence — match against the raw text instead.
  }
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|center|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (valid(lat, lng)) return { lat, lng };
    }
  }
  return null;
}
