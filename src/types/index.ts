export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_price?: number;
  images: string[];
  category: string;
  local_id: string;
  rating?: number;
  review_count?: number;
  created_at: string;
}

export interface Local {
  id: string;
  name: string;
  region: string;
  bio: string;
  avatar_url?: string;
  specialties: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  author_id: string;
  tags: string[];
  published_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}
