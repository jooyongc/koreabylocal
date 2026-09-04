import type { ProductStatus, ProductBadge, BlogCategory, BlogStatus } from "./index";

export type OptionType = "select" | "date" | "text" | "number";

export interface OptionValueFormData {
  id?: number;
  label: string;
  price_modifier: number;
}

export interface OptionGroupFormData {
  id?: number;
  name: string;
  type: OptionType;
  is_required: boolean;
  values: OptionValueFormData[];
}

export interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  price: number;
  compare_price: number | null;
  status: ProductStatus;
  category_id: number | null;
  badges: ProductBadge[];
  images: string[];
  thumbnail_url: string;
  seo_title: string;
  seo_description: string;
  options: OptionGroupFormData[];
  featured_collection_ids: number[];
}

export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  status: BlogStatus;
  author: string;
  thumbnail_url: string;
  published_at: string;
  seo_title: string;
  seo_description: string;
}

export interface SpotFormData {
  title: string;
  slug: string;
  region: string;
  area: string;
  spot_type: string;
  tagline: string;
  description: string;
  tips: string;
  address: string;
  google_maps_url: string;
  latitude: number | null;
  longitude: number | null;
  hours: string;
  price_range: string;
  phone: string;
  website: string;
  instagram: string;
  thumbnail_url: string;
  images: string[];
  related_post_slugs: string[];
  badge: string;
  editor_pick: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface EbookFormData {
  slug: string;
  title: string;
  description: string;
  cover_image_url: string;
  preview_images: string[];
  file_url: string;
  price_usd: number;
  price_jpy: number | null;
  is_active: boolean;
}
