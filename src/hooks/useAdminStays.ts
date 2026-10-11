import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StayInsert, StayRow } from "@/types/stays";

/** All stays, active or not, for /admin/stays (RLS lets admins see inactive rows). */
export function useAdminStays() {
  return useQuery({
    queryKey: ["admin-stays"],
    queryFn: async (): Promise<StayRow[]> => {
      const { data, error } = await supabase
        .from("stays")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-stays"] });
    qc.invalidateQueries({ queryKey: ["stays"] });
  };
}

/**
 * Upsert on slug: pasting the same stay.json twice updates instead of duplicating.
 * Rows are sent in groups with the same keys: in one bulk upsert a key that some
 * rows leave out (thumb_url, reel_url, offers) would be written as null for them.
 */
export function useUpsertStays() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (rows: StayInsert[]) => {
      const groups = new Map<string, StayInsert[]>();
      for (const row of rows) {
        const shape = Object.keys(row).sort().join(",");
        groups.set(shape, [...(groups.get(shape) ?? []), row]);
      }
      let saved = 0;
      for (const group of groups.values()) {
        const { data, error } = await supabase.from("stays").upsert(group, { onConflict: "slug" }).select("slug");
        if (error) throw error;
        saved += data?.length ?? 0;
      }
      return saved;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateStay() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<StayInsert> }) => {
      const { error } = await supabase.from("stays").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteStay() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("stays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
