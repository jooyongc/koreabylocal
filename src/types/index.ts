export type { Database, Tables, TablesInsert, TablesUpdate, Json } from "./database";

import type { Tables } from "./database";

// Convenient row-type aliases
export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductOption = Tables<"product_options">;
export type ProductOptionValue = Tables<"product_option_values">;
export type BlogPost = Tables<"blog_posts">;
export type FeaturedCollection = Tables<"featured_collections">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type DigitalMagazine = Tables<"digital_magazines">;
export type Inquiry = Tables<"inquiries">;
export type SiteSetting = Tables<"site_settings">;

/** What the edge function stores in inquiries.ai_triage. Suggestions, not facts. */
export interface AiTriage {
  category: string | null;
  category_confidence: number | null;
  urgent: boolean;
  related: { slug: string; title: string; score: number }[];
  model: string;
  at: string;
}

/**
 * Narrows the jsonb column. Rows predate the feature, the judgement can be
 * skipped, and the shape could change, so anything unrecognised reads as null
 * rather than crashing an admin screen.
 */
export function readTriage(value: unknown): AiTriage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const t = value as Record<string, unknown>;
  if (typeof t.urgent !== "boolean") return null;
  return {
    category: typeof t.category === "string" ? t.category : null,
    category_confidence: typeof t.category_confidence === "number" ? t.category_confidence : null,
    urgent: t.urgent,
    related: Array.isArray(t.related)
      ? t.related.flatMap((r) => {
          const row = r as Record<string, unknown>;
          return typeof row?.slug === "string" && typeof row?.title === "string"
            ? [{ slug: row.slug, title: row.title, score: typeof row.score === "number" ? row.score : 0 }]
            : [];
        })
      : [],
    model: typeof t.model === "string" ? t.model : "",
    at: typeof t.at === "string" ? t.at : "",
  };
}

// Status union types
export type ProductStatus = "active" | "hidden" | "sold_out";
export type BlogCategory =
  // legacy taxonomy — kept so older blog_posts rows still type-check
  | "NEWS" | "LOCALS" | "KOREAN" | "K-CULTURE"
  // Guidebook (v3) taxonomy
  | "HOW-TO" | "LOCAL-LIFE" | "FESTIVAL" | "FOOD" | "TRANSPORT";
export type BlogStatus = "published" | "draft";
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial_refund";
export type UserRole = "customer" | "admin";
export type ProductBadge = "NEW" | "BEST" | "HOT" | "MD" | "SALE";
export type InquiryCategory = "General" | "Tour Inquiry" | "Transportation" | "Custom Request" | "Other";
export type InquiryStatus = "pending" | "replied";
