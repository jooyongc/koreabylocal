export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  koreabylocal: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          faqs: Json | null
          hero_image_url: string | null
          id: number
          images: Json | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          faqs?: Json | null
          hero_image_url?: string | null
          id?: never
          images?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          faqs?: Json | null
          hero_image_url?: string | null
          id?: never
          images?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          parent_id: number | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          id: number
          name: string
          email: string
          subject: string | null
          category: string
          message: string
          attachment_url: string | null
          status: string
          admin_reply: string | null
          replied_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          name: string
          email: string
          subject?: string | null
          category?: string
          message: string
          attachment_url?: string | null
          status?: string
          admin_reply?: string | null
          replied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          name?: string
          email?: string
          subject?: string | null
          category?: string
          message?: string
          attachment_url?: string | null
          status?: string
          admin_reply?: string | null
          replied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_magazines: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          download_count: number
          file_url: string | null
          id: number
          is_active: boolean
          issue_date: string | null
          title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string | null
          id?: never
          is_active?: boolean
          issue_date?: string | null
          title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string | null
          id?: never
          is_active?: boolean
          issue_date?: string | null
          title?: string
        }
        Relationships: []
      }
      featured_collection_products: {
        Row: {
          collection_id: number
          product_id: number
          sort_order: number
        }
        Insert: {
          collection_id: number
          product_id: number
          sort_order?: number
        }
        Update: {
          collection_id?: number
          product_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "featured_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_collections: {
        Row: {
          banner_image_url: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: number
          order_id: number
          product_id: number | null
          product_title: string
          quantity: number
          selected_options: Json | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: never
          order_id: number
          product_id?: number | null
          product_title: string
          quantity?: number
          selected_options?: Json | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: never
          order_id?: number
          product_id?: number | null
          product_title?: string
          quantity?: number
          selected_options?: Json | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          currency: string
          customer_note: string | null
          guest_email: string | null
          guest_name: string | null
          id: number
          order_number: string
          payment_method: string | null
          payment_status: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          currency?: string
          customer_note?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: never
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          currency?: string
          customer_note?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: never
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          id: number
          label: string
          option_id: number
          price_modifier: number
          sort_order: number
        }
        Insert: {
          id?: never
          label: string
          option_id: number
          price_modifier?: number
          sort_order?: number
        }
        Update: {
          id?: never
          label?: string
          option_id?: number
          price_modifier?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          id: number
          is_required: boolean
          name: string
          product_id: number
          sort_order: number
          type: string
        }
        Insert: {
          id?: never
          is_required?: boolean
          name: string
          product_id: number
          sort_order?: number
          type?: string
        }
        Update: {
          id?: never
          is_required?: boolean
          name?: string
          product_id?: number
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[] | null
          category_id: number | null
          compare_price: number | null
          content: string | null
          created_at: string
          currency: string
          description: string | null
          featured_collection_id: number | null
          id: number
          images: Json | null
          price: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          badges?: string[] | null
          category_id?: number | null
          compare_price?: number | null
          content?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured_collection_id?: number | null
          id?: never
          images?: Json | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          badges?: string[] | null
          category_id?: number | null
          compare_price?: number | null
          content?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured_collection_id?: number | null
          id?: never
          images?: Json | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_featured_collection_id_fkey"
            columns: ["featured_collection_id"]
            isOneToOne: false
            referencedRelation: "featured_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      view_logs: {
        Row: {
          id: number
          ip_hash: string
          target_id: number
          target_type: string
          viewed_at: string
        }
        Insert: {
          id?: never
          ip_hash: string
          target_id: number
          target_type: string
          viewed_at?: string
        }
        Update: {
          id?: never
          ip_hash?: string
          target_id?: number
          target_type?: string
          viewed_at?: string
        }
        Relationships: []
      }
      hosts: {
        Row: {
          id: number
          slug: string
          name: string
          city: string | null
          region: string | null
          avatar_url: string | null
          rating: number
          trips_count: number
          languages: string[]
          bio: string | null
          verified: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: never
          slug: string
          name: string
          city?: string | null
          region?: string | null
          avatar_url?: string | null
          rating?: number
          trips_count?: number
          languages?: string[]
          bio?: string | null
          verified?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: never
          slug?: string
          name?: string
          city?: string | null
          region?: string | null
          avatar_url?: string | null
          rating?: number
          trips_count?: number
          languages?: string[]
          bio?: string | null
          verified?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          id: number
          slug: string
          title: string
          location: string | null
          region: string | null
          duration: string | null
          price: number
          compare_price: number | null
          currency: string
          rating: number | null
          reviews_count: number
          badge: string | null
          thumbnail_url: string | null
          images: Json | null
          category: string | null
          host_id: number | null
          affiliate_network: string | null
          affiliate_url: string | null
          instant: boolean
          description: string | null
          highlights: Json | null
          itinerary: Json | null
          included: string[] | null
          excluded: string[] | null
          is_active: boolean
          sort_order: number
          view_count: number
          created_at: string
          updated_at: string
          spot_type: string | null
          area: string | null
          tagline: string | null
          tips: string | null
          address: string | null
          google_maps_url: string | null
          latitude: number | null
          longitude: number | null
          hours: string | null
          price_range: string | null
          phone: string | null
          website: string | null
          instagram: string | null
          editor_pick: boolean
          related_post_slugs: string[]
        }
        Insert: {
          id?: never
          slug: string
          title: string
          location?: string | null
          region?: string | null
          duration?: string | null
          price?: number
          compare_price?: number | null
          currency?: string
          rating?: number | null
          reviews_count?: number
          badge?: string | null
          thumbnail_url?: string | null
          images?: Json | null
          category?: string | null
          host_id?: number | null
          affiliate_network?: string | null
          affiliate_url?: string | null
          instant?: boolean
          description?: string | null
          highlights?: Json | null
          itinerary?: Json | null
          included?: string[] | null
          excluded?: string[] | null
          is_active?: boolean
          sort_order?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          spot_type?: string | null
          area?: string | null
          tagline?: string | null
          tips?: string | null
          address?: string | null
          google_maps_url?: string | null
          latitude?: number | null
          longitude?: number | null
          hours?: string | null
          price_range?: string | null
          phone?: string | null
          website?: string | null
          instagram?: string | null
          editor_pick?: boolean
          related_post_slugs?: string[]
        }
        Update: {
          id?: never
          slug?: string
          title?: string
          location?: string | null
          region?: string | null
          duration?: string | null
          price?: number
          compare_price?: number | null
          currency?: string
          rating?: number | null
          reviews_count?: number
          badge?: string | null
          thumbnail_url?: string | null
          images?: Json | null
          category?: string | null
          host_id?: number | null
          affiliate_network?: string | null
          affiliate_url?: string | null
          instant?: boolean
          description?: string | null
          highlights?: Json | null
          itinerary?: Json | null
          included?: string[] | null
          excluded?: string[] | null
          is_active?: boolean
          sort_order?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          spot_type?: string | null
          area?: string | null
          tagline?: string | null
          tips?: string | null
          address?: string | null
          google_maps_url?: string | null
          latitude?: number | null
          longitude?: number | null
          hours?: string | null
          price_range?: string | null
          phone?: string | null
          website?: string | null
          instagram?: string | null
          editor_pick?: boolean
          related_post_slugs?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "experiences_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          key: string
          name: string
          name_ko: string | null
          tag: string | null
          blurb: string | null
          experiences_count: number
          hosts_count: number
          rating: number | null
          map_top: string | null
          map_left: string | null
          sort_order: number
          is_active: boolean
          cover_image_url: string | null
          description: string | null
          best_season: string | null
          getting_there_summary: string | null
        }
        Insert: {
          key: string
          name: string
          name_ko?: string | null
          tag?: string | null
          blurb?: string | null
          experiences_count?: number
          hosts_count?: number
          rating?: number | null
          map_top?: string | null
          map_left?: string | null
          sort_order?: number
          is_active?: boolean
          cover_image_url?: string | null
          description?: string | null
          best_season?: string | null
          getting_there_summary?: string | null
        }
        Update: {
          key?: string
          name?: string
          name_ko?: string | null
          tag?: string | null
          blurb?: string | null
          experiences_count?: number
          hosts_count?: number
          rating?: number | null
          map_top?: string | null
          map_left?: string | null
          sort_order?: number
          is_active?: boolean
          cover_image_url?: string | null
          description?: string | null
          best_season?: string | null
          getting_there_summary?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          id: number
          email: string
          name: string | null
          language: string
          source: string | null
          lead_magnet: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: never
          email: string
          name?: string | null
          language?: string
          source?: string | null
          lead_magnet?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: never
          email?: string
          name?: string | null
          language?: string
          source?: string | null
          lead_magnet?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      ebooks: {
        Row: {
          id: number
          slug: string
          title: string
          description: string | null
          cover_image_url: string | null
          preview_images: string[]
          file_url: string | null
          price_usd: number
          price_jpy: number | null
          download_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: never
          slug: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          preview_images?: string[]
          file_url?: string | null
          price_usd: number
          price_jpy?: number | null
          download_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: never
          slug?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          preview_images?: string[]
          file_url?: string | null
          price_usd?: number
          price_jpy?: number | null
          download_count?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          id: number
          ebook_id: number | null
          buyer_email: string
          buyer_name: string | null
          payment_provider: string | null
          payment_key: string | null
          amount: number | null
          currency: string
          status: string
          download_token: string | null
          download_count: number
          max_downloads: number
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: never
          ebook_id?: number | null
          buyer_email: string
          buyer_name?: string | null
          payment_provider?: string | null
          payment_key?: string | null
          amount?: number | null
          currency?: string
          status?: string
          download_token?: string | null
          download_count?: number
          max_downloads?: number
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          ebook_id?: number | null
          buyer_email?: string
          buyer_name?: string | null
          payment_provider?: string | null
          payment_key?: string | null
          amount?: number | null
          currency?: string
          status?: string
          download_token?: string | null
          download_count?: number
          max_downloads?: number
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_purchases_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_jobs: {
        Row: {
          id: number
          topic: string
          keywords: string[]
          tone: string
          status: string
          category: string | null
          word_count: number
          links_count: number
          model: string | null
          generated_title: string | null
          generated_body: string | null
          blog_post_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          topic: string
          keywords?: string[]
          tone?: string
          status?: string
          category?: string | null
          word_count?: number
          links_count?: number
          model?: string | null
          generated_title?: string | null
          generated_body?: string | null
          blog_post_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          topic?: string
          keywords?: string[]
          tone?: string
          status?: string
          category?: string | null
          word_count?: number
          links_count?: number
          model?: string | null
          generated_title?: string | null
          generated_body?: string | null
          blog_post_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_jobs_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "koreabylocal">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
