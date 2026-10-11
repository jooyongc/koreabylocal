import type { Tables, TablesInsert } from "@/types/database";

/** A hotel card on /where-to-stay. See where-to-stay-kit/docs/04_APIS_AND_DATA.md. */
export type StayRow = Tables<"stays">;
export type StayInsert = TablesInsert<"stays">;

export const STAY_OTAS = ["Expedia", "Hotels.com", "Booking.com", "Trip.com", "Agoda"] as const;
export type StayOta = (typeof STAY_OTAS)[number];

/** One affiliate link for a hotel. `stays.offers` holds one per OTA. */
export interface StayOffer {
  ota: StayOta;
  url: string;
}

/**
 * The JSON the Reels routine writes next to each Reel (stay.json) and an admin
 * pastes into /admin/stays. Same keys as the table, minus server-managed ones.
 */
export interface StayImport {
  slug: string;
  label: string;
  name: string;
  city: string;
  area?: string | null;
  ota: StayOta; // the OTA the photos and rating came from — the card's main button
  affiliate_url: string;
  offers?: StayOffer[]; // every OTA we have a link for; the photo OTA is put first if missing
  rating?: number | null;
  review_count?: number | null;
  facts_checked_on: string; // YYYY-MM-DD
  highlights: string[];
  thumb_url?: string | null;
  reel_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
}
