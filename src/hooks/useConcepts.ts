import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type ExperienceRow = Tables<"experiences">;
export type HostRow = Tables<"hosts">;
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

export function useExperience(slug: string | undefined) {
  return useQuery({
    queryKey: ["experience", slug],
    enabled: !!slug,
    queryFn: async (): Promise<ExperienceRow | null> => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useHosts(limit?: number) {
  return useQuery({
    queryKey: ["hosts", limit ?? null],
    queryFn: async (): Promise<HostRow[]> => {
      let q = supabase
        .from("hosts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
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
