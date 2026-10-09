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

/** Upsert on slug: pasting the same stay.json twice updates instead of duplicating. */
export function useUpsertStays() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (rows: StayInsert[]) => {
      const { data, error } = await supabase.from("stays").upsert(rows, { onConflict: "slug" }).select("slug");
      if (error) throw error;
      return data?.length ?? 0;
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
