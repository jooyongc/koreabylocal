import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export default function ProductSearchModal({ open, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState("");

  const { data: products } = useQuery<Product[]>({
    queryKey: ["product-search-modal", keyword],
    enabled: open && keyword.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("title", `%${keyword}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Product[];
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-primary">Insert Product</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by product name (min 2 chars)..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {keyword.length < 2 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Type at least 2 characters to search
              </p>
            )}

            {keyword.length >= 2 && !products?.length && (
              <p className="py-8 text-center text-sm text-gray-400">No products found</p>
            )}

            {products?.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p);
                  onClose();
                  setKeyword("");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
              >
                {p.thumbnail_url ? (
                  <img
                    src={p.thumbnail_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                    No img
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.price.toLocaleString()} KRW</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
