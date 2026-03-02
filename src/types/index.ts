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
export type SiteSetting = Tables<"site_settings">;

// Status union types
export type ProductStatus = "active" | "hidden" | "sold_out";
export type BlogCategory = "NEWS" | "LOCALS" | "KOREAN" | "K-CULTURE";
export type BlogStatus = "published" | "draft";
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial_refund";
export type UserRole = "customer" | "admin";
export type ProductBadge = "NEW" | "BEST" | "HOT" | "MD" | "SALE";
