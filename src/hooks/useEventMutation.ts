import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EventFormData } from "@/types/admin";

function linesToArray(text: string): string[] | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines : null;
}

function toRow(data: EventFormData) {
  return {
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description || null,
    cover_image_url: data.cover_image_url || null,
    preview_images: data.preview_images,
    event_date: data.event_date,
    time_label: data.time_label || null,
    location: data.location || null,
    price_usd: data.price_usd,
    price_krw: data.price_krw,
    capacity: data.capacity,
    perks: linesToArray(data.perks),
    audience_note: data.audience_note || null,
    is_active: data.is_active,
  };
}

async function createEvent(data: EventFormData) {
  const { error } = await supabase.from("events").insert(toRow(data));
  if (error) throw error;
}

async function updateEvent(id: number, data: EventFormData) {
  const { error } = await supabase.from("events").update(toRow(data)).eq("id", id);
  if (error) throw error;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventFormData }) => updateEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });
}
