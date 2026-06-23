import { useState, useCallback, useRef } from "react";
import { Search, Upload, X, Loader2, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/uploadImage";

interface ImageResult {
  url: string;
  thumb: string;
  alt: string;
  credit: string;
  source: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /** Search orientation; thumbnails usually want a wide image too. */
  orientation?: "landscape" | "portrait" | "squarish";
  initialQuery?: string;
  title?: string;
}

type Tab = "search" | "upload";

export default function ImagePicker({ open, onClose, onSelect, orientation = "landscape", initialQuery = "", title = "Insert image" }: Props) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async () => {
    const term = query.trim();
    if (!term || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-images", {
        body: { query: term, orientation },
      });
      if (error) {
        let msg = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) msg = (await ctx.json())?.error ?? msg;
        } catch { /* keep */ }
        toast.error(msg);
      } else {
        setResults((data?.images as ImageResult[]) ?? []);
        if (!data?.images?.length) toast("No images found", { icon: "🔍" });
      }
    } catch (e) {
      toast.error(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }, [query, busy, orientation]);

  const pick = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleFile = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadImage(file, "product-images");
        pick(url);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <ImageIcon className="h-4.5 w-4.5 text-primary" /> {title}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 px-5 pt-3">
          {([["search", "Search", Search], ["upload", "Upload", Upload]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === key ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "search" ? (
            <>
              <div className="mb-4 flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }}
                  placeholder="Search Unsplash & Pexels — e.g. Gyeongbokgung, hanok, street food"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
                </button>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {results.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pick(img.url)}
                      title={img.credit}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img src={img.thumb} alt={img.alt} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {img.credit}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-sm text-gray-400">
                  {busy ? "Searching…" : "Search for a relevant photo to insert."}
                </div>
              )}
            </>
          ) : (
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 transition-colors hover:border-primary/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
            >
              {uploading ? <Loader2 className="mb-3 h-9 w-9 animate-spin text-gray-400" /> : <Upload className="mb-3 h-9 w-9 text-gray-400" />}
              <p className="text-sm font-medium text-gray-600">{uploading ? "Uploading…" : "Click or drop an image to upload"}</p>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG, WebP</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files)}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
