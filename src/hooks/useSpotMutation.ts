import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SpotFormData } from "@/types/admin";

function toRow(data: SpotFormData) {
  return {
    title: data.title,
    slug: data.slug,
    region: data.region || null,
    area: data.area || null,
    spot_type: data.spot_type || null,
    tagline: data.tagline || null,
    description: data.description || null,
    tips: data.tips || null,
    address: data.address || null,
    google_maps_url: data.google_maps_url || null,
    latitude: data.latitude,
    longitude: data.longitude,
    hours: data.hours || null,
    price_range: data.price_range || null,
    phone: data.phone || null,
    website: data.website || null,
    instagram: data.instagram || null,
    thumbnail_url: data.thumbnail_url || null,
    images: data.images,
    related_post_slugs: data.related_post_slugs,
    badge: data.badge || null,
    editor_pick: data.editor_pick,
    is_active: data.is_active,
    sort_order: data.sort_order,
  };
}

async function createSpot(data: SpotFormData) {
  const { data: spot, error } = await supabase
    .from("experiences")
    .insert(toRow(data))
    .select("id")
    .single();
  if (error) throw error;
  return spot;
}

async function updateSpot(id: number, data: SpotFormData) {
  const { error } = await supabase.from("experiences").update(toRow(data)).eq("id", id);
  if (error) throw error;
}

async function deleteSpots(ids: number[]) {
  const { error } = await supabase.from("experiences").delete().in("id", ids);
  if (error) throw error;
}

async function setSpotActive(id: number, is_active: boolean) {
  const { error } = await supabase.from("experiences").update({ is_active }).eq("id", id);
  if (error) throw error;
}

export function useCreateSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSpot,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-spots"] }),
  });
}

export function useUpdateSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SpotFormData }) => updateSpot(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-spots"] });
      qc.invalidateQueries({ queryKey: ["admin-spot"] });
    },
  });
}

export function useDeleteSpots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSpots,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-spots"] }),
  });
}

export function useSetSpotActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => setSpotActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-spots"] }),
  });
}
