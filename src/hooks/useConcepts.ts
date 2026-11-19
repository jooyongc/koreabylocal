import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type { BlogPost } from "@/types";
import {
  AFFILIATE_EXPERIENCE_COLUMNS,
  type AffiliateExperienceRow,
} from "@/components/experiences/AffiliateExperienceCard";

export type ExperienceRow = Tables<"experiences">;
export type RegionRow = Tables<"regions">;

export function useExperiences(opts?: { region?: string; category?: string; limit?: number }) {
  return useQuery({
    queryKey: ["experiences", opts ?? {}],
    queryFn: async (): Promise<ExperienceRow[]> => {
      let q = supabase
        .from("experiences")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (opts?.region) q = q.eq("region", opts.region);
      if (opts?.category) q = q.eq("category", opts.category);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Active partner experiences that have a booking link — the only ones worth showing as affiliate cards. */
export function useAffiliateExperiences(opts?: { region?: string; category?: string; limit?: number }) {
  return useQuery({
    queryKey: ["affiliate-experiences", opts ?? {}],
    queryFn: async (): Promise<AffiliateExperienceRow[]> => {
      let q = supabase
        .from("experiences")
        .select(AFFILIATE_EXPERIENCE_COLUMNS)
        .eq("is_active", true)
        .not("affiliate_url", "is", null)
        .order("sort_order", { ascending: true });
      if (opts?.region) q = q.eq("region", opts.region);
      if (opts?.category) q = q.eq("category", opts.category);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AffiliateExperienceRow[];
    },
  });
}

export type HeroPostRow = Pick<Tables<"blog_posts">, "slug" | "title" | "excerpt" | "category" | "hero_image_url"> & {
  /** Pinned by an admin ("featured"), rather than just recent. */
  featured: boolean;
};

const HERO_POST_COLUMNS = "slug, title, excerpt, category, hero_image_url";

/**
 * The posts the homepage Hero rotates through: the one an admin pinned as
 * featured first (if any), then the latest published posts, `count` in all.
 */
export function useHeroPosts(count = 5) {
  return useQuery({
    queryKey: ["hero-posts", count],
    queryFn: async (): Promise<HeroPostRow[]> => {
      const published = () => supabase.from("blog_posts").select(HERO_POST_COLUMNS).eq("status", "published");
      const [pinned, latest] = await Promise.all([
        published().eq("featured", true).order("published_at", { ascending: false }).limit(1).maybeSingle(),
        published().order("published_at", { ascending: false }).limit(count),
      ]);
      if (pinned.error) throw pinned.error;
      if (latest.error) throw latest.error;

      const rows: HeroPostRow[] = pinned.data ? [{ ...pinned.data, featured: true }] : [];
      for (const p of latest.data ?? []) {
        if (rows.length >= count) break;
        if (!rows.some((r) => r.slug === p.slug)) rows.push({ ...p, featured: false });
      }
      return rows;
    },
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async (): Promise<RegionRow[]> => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegion(key: string | undefined) {
  return useQuery({
    queryKey: ["region", key],
    enabled: !!key,
    queryFn: async (): Promise<RegionRow | null> => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        // Called with a URL key ("seoul") or a spot's region name ("Seoul").
        .ilike("key", key!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Newest published guides that name a region in their title or excerpt. */
export function useRegionGuides(name: string | undefined) {
  return useQuery({
    queryKey: ["region-guides", name],
    enabled: !!name,
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title")
        .eq("status", "published")
        .or(`title.ilike.%${name}%,excerpt.ilike.%${name}%`)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data as BlogPost[]) ?? [];
    },
  });
}
