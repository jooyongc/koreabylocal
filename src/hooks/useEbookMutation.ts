import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EbookFormData } from "@/types/admin";

async function createEbook(data: EbookFormData) {
  const { error } = await supabase.from("ebooks").insert(data);
  if (error) throw error;
}

async function updateEbook(id: number, data: EbookFormData) {
  const { error } = await supabase.from("ebooks").update(data).eq("id", id);
  if (error) throw error;
}

export function useCreateEbook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEbook,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ebooks"] }),
  });
}

export function useUpdateEbook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EbookFormData }) => updateEbook(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ebooks"] }),
  });
}
