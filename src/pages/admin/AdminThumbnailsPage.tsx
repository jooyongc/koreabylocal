import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ImageIcon, Loader2, Play, RefreshCw, Check, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { buildThumbnail, saveThumbnail } from "@/lib/generateThumbnail";

/**
 * Regenerates card thumbnails in bulk.
 *
 * Drawing happens here rather than on the server because the renderer is a
 * canvas: one implementation, used both by this tool and when a post is saved,
 * so a backfilled thumbnail and a freshly published one look identical.
 *
 * Runs one article at a time on purpose. Each one costs a stock-photo search
 * and an upload, and a burst of parallel requests is the quickest way to get
 * rate-limited by Unsplash half way through a batch.
 */

interface Row {
  id: number;
  slug: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
}

type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; url: string }
  | { kind: "failed"; message: string };

export default function AdminThumbnailsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [states, setStates] = useState<Record<number, State>>({});
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, category, thumbnail_url")
        .order("published_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data ?? []) as Row[]);
    })();
    return () => { cancelled.current = true; };
  }, []);

  const legacy = useMemo(
    () => (rows ?? []).filter((r) => (r.thumbnail_url ?? "").includes("imweb")),
    [rows],
  );

  async function generate(row: Row) {
    setStates((s) => ({ ...s, [row.id]: { kind: "working" } }));
    try {
      const { url } = await buildThumbnail(row);
      await saveThumbnail(row.id, url);
      setStates((s) => ({ ...s, [row.id]: { kind: "done", url } }));
      setRows((rs) => (rs ?? []).map((r) => (r.id === row.id ? { ...r, thumbnail_url: url } : r)));
    } catch (e) {
      setStates((s) => ({ ...s, [row.id]: { kind: "failed", message: (e as Error).message } }));
    }
  }

  async function generateAll(targets: Row[]) {
    if (running || targets.length === 0) return;
    cancelled.current = false;
    setRunning(true);
    let ok = 0;
    for (const row of targets) {
      if (cancelled.current) break;
      await generate(row);
      ok++;
    }
    setRunning(false);
    toast.success(`Regenerated ${ok} thumbnail${ok === 1 ? "" : "s"}`);
  }

  return (
    <>
      <Helmet>
        <title>Thumbnails | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Thumbnails</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Rebuilds the card image from a stock photo, the article title and its category colour.
            The imported thumbnails have a headline burned into them, so a fresh photo is fetched
            rather than drawing over the old artwork.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={running || legacy.length === 0}
            onClick={() => generateAll(legacy)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Regenerate the {legacy.length} imported thumbnail{legacy.length === 1 ? "" : "s"}
          </button>
          {running && (
            <button
              type="button"
              onClick={() => { cancelled.current = true; }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Stop after this one
            </button>
          )}
          <span className="text-xs text-gray-500">
            One at a time — each needs a photo search and an upload.
          </span>
        </div>

        {rows === null ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const state = states[row.id] ?? { kind: "idle" };
              return (
                <div key={row.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="relative aspect-[16/10] bg-gray-100">
                    {row.thumbnail_url ? (
                      <img src={row.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    {/* White, not the category colour: the thumbnail behind it is
                        already that colour, so a tinted badge disappeared into it. */}
                    <span className="absolute left-2 top-2 rounded bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase text-ink backdrop-blur-[2px]">
                      {row.category}
                    </span>
                    {state.kind === "working" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <Link
                      to={`/admin/blog/${row.id}/edit`}
                      className="line-clamp-2 text-[13.5px] font-semibold text-primary hover:underline"
                    >
                      {row.title}
                    </Link>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {state.kind === "failed" ? (
                        <span className="flex items-center gap-1 text-[11px] text-red-600" title={state.message}>
                          <AlertTriangle className="h-3 w-3 shrink-0" /> {state.message.slice(0, 40)}
                        </span>
                      ) : state.kind === "done" ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <Check className="h-3 w-3" /> Regenerated
                        </span>
                      ) : (row.thumbnail_url ?? "").includes("imweb") ? (
                        <span className="text-[11px] text-amber-600">Imported — headline burned in</span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Generated</span>
                      )}

                      <button
                        type="button"
                        disabled={running || state.kind === "working"}
                        onClick={() => generate(row)}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" /> Rebuild
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
