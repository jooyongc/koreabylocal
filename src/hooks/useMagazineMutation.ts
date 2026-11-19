import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface MagazineFormData {
  title: string;
  description?: string;
  cover_image_url?: string;
  file_url?: string;
  issue_date?: string;
  is_active?: boolean;
}

// The form keeps an empty date as "", which a `date` column rejects.
const toRow = (data: MagazineFormData) => ({ ...data, issue_date: data.issue_date || null });

export function useCreateMagazine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MagazineFormData) => {
      const { error } = await supabase.from("digital_magazines").insert(toRow(data));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-magazines"] });
      qc.invalidateQueries({ queryKey: ["magazines"] });
    },
  });
}

export function useUpdateMagazine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: MagazineFormData;
    }) => {
      const { error } = await supabase
        .from("digital_magazines")
        .update(toRow(data))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-magazines"] });
      qc.invalidateQueries({ queryKey: ["magazines"] });
    },
  });
}

export function useDeleteMagazine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("digital_magazines")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-magazines"] });
      qc.invalidateQueries({ queryKey: ["magazines"] });
    },
  });
}
