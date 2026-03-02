import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductFormData, OptionGroupFormData } from "@/types/admin";
import type { ProductStatus } from "@/types";

// --- Create ---
async function createProduct(data: ProductFormData) {
  const { options, featured_collection_ids, ...productData } = data;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      ...productData,
      images: data.images as unknown as undefined,
      featured_collection_id: featured_collection_ids[0] ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  await upsertOptions(product.id, [], options);
  await syncCollections(product.id, featured_collection_ids);

  return product;
}

// --- Update ---
async function updateProduct(id: number, data: ProductFormData, existingOptions: OptionGroupFormData[]) {
  const { options, featured_collection_ids, ...productData } = data;

  const { error } = await supabase
    .from("products")
    .update({
      ...productData,
      images: data.images as unknown as undefined,
      featured_collection_id: featured_collection_ids[0] ?? null,
    })
    .eq("id", id);
  if (error) throw error;

  await upsertOptions(id, existingOptions, options);
  await syncCollections(id, featured_collection_ids);
}

// --- Options diff logic ---
async function upsertOptions(
  productId: number,
  existing: OptionGroupFormData[],
  incoming: OptionGroupFormData[]
) {
  const existingIds = new Set(existing.filter((o) => o.id).map((o) => o.id!));
  const incomingIds = new Set(incoming.filter((o) => o.id).map((o) => o.id!));

  // Delete removed options
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("product_option_values").delete().in("option_id", toDelete);
    await supabase.from("product_options").delete().in("id", toDelete);
  }

  for (let i = 0; i < incoming.length; i++) {
    const opt = incoming[i];
    let optionId: number;

    if (opt.id && existingIds.has(opt.id)) {
      // Update existing option
      await supabase
        .from("product_options")
        .update({ name: opt.name, type: opt.type, is_required: opt.is_required, sort_order: i })
        .eq("id", opt.id);
      optionId = opt.id;
    } else {
      // Insert new option
      const { data, error } = await supabase
        .from("product_options")
        .insert({
          product_id: productId,
          name: opt.name,
          type: opt.type,
          is_required: opt.is_required,
          sort_order: i,
        })
        .select("id")
        .single();
      if (error) throw error;
      optionId = data.id;
    }

    // Sync values for select type
    if (opt.type === "select") {
      await syncOptionValues(optionId, opt.values);
    } else {
      // Remove any leftover values for non-select types
      await supabase.from("product_option_values").delete().eq("option_id", optionId);
    }
  }
}

async function syncOptionValues(
  optionId: number,
  values: { id?: number; label: string; price_modifier: number }[]
) {
  // Simple approach: delete all, re-insert
  await supabase.from("product_option_values").delete().eq("option_id", optionId);

  if (values.length > 0) {
    const rows = values.map((v, i) => ({
      option_id: optionId,
      label: v.label,
      price_modifier: v.price_modifier,
      sort_order: i,
    }));
    const { error } = await supabase.from("product_option_values").insert(rows);
    if (error) throw error;
  }
}

// --- Featured collections sync ---
async function syncCollections(productId: number, collectionIds: number[]) {
  await supabase.from("featured_collection_products").delete().eq("product_id", productId);

  if (collectionIds.length > 0) {
    const rows = collectionIds.map((cid, i) => ({
      product_id: productId,
      collection_id: cid,
      sort_order: i,
    }));
    const { error } = await supabase.from("featured_collection_products").insert(rows);
    if (error) throw error;
  }
}

// --- Delete ---
async function deleteProducts(ids: number[]) {
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) throw error;
}

// --- Bulk status update ---
async function bulkUpdateStatus(ids: number[], status: ProductStatus) {
  const { error } = await supabase.from("products").update({ status }).in("id", ids);
  if (error) throw error;
}

// --- Hooks ---
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      existingOptions,
    }: {
      id: number;
      data: ProductFormData;
      existingOptions: OptionGroupFormData[];
    }) => updateProduct(id, data, existingOptions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product"] });
    },
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProducts,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: ProductStatus }) =>
      bulkUpdateStatus(ids, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}
