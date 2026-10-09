import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ExternalLink, ImagePlus, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminStays, useDeleteStay, useUpdateStay, useUpsertStays } from "@/hooks/useAdminStays";
import { parseStayImport } from "@/lib/stayImport";
import { uploadImage } from "@/lib/uploadImage";
import type { StayRow } from "@/types/stays";

/**
 * /admin/stays — hotel cards for /where-to-stay.
 *
 * The Reels routine writes a stay.json next to every Reel. Paste it here and
 * save: it is validated (docs/03_RULES.md) and upserted on slug, so pasting the
 * same file again updates the card instead of duplicating it. Order of work
 * per Reel: card live here FIRST, then publish the Reel, then add reel_url.
 */

const EXAMPLE = `{
  "slug": "l7-myeongdong",
  "label": "L7 Myeongdong",
  "name": "L7 MYEONGDONG by LOTTE HOTELS",
  "city": "Seoul",
  "area": "Myeongdong",
  "ota": "Expedia",
  "affiliate_url": "https://expedia.com/affiliates/seoul-hotels-l7-myeongdong-by-lotte.ZHRjmM1",
  "rating": 9.2,
  "review_count": 1375,
  "facts_checked_on": "2026-10-09",
  "highlights": ["Station at the door", "9.4 for cleanliness", "Rooftop foot spa"],
  "thumb_url": "",
  "reel_url": ""
}`;

function ImportBox() {
  const [text, setText] = useState("");
  const upsert = useUpsertStays();
  const result = useMemo(() => (text.trim() ? parseStayImport(text) : null), [text]);

  const save = () => {
    if (!result || result.errors.length) return;
    upsert.mutate(result.rows, {
      onSuccess: (n) => {
        toast.success(`${n} stay${n === 1 ? "" : "s"} saved`);
        setText("");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">Add from stay.json</h2>
        <button type="button" onClick={() => setText(EXAMPLE)} className="text-xs text-gray-500 underline hover:text-primary">
          Paste example
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder="Paste one stay.json object (or an array of them)"
        className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {result && result.errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-red-600">
          {result.errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
      {result && result.errors.length === 0 && (
        <p className="mt-2 text-xs text-emerald-700">
          Ready: {result.rows.map((r) => `“${r.label}” (${r.city}, ${r.ota})`).join(", ")}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!result || result.errors.length > 0 || upsert.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />
          {upsert.isPending ? "Saving…" : "Save (upsert on slug)"}
        </button>
      </div>
    </div>
  );
}

function StayRowItem({ stay }: { stay: StayRow }) {
  const update = useUpdateStay();
  const del = useDeleteStay();
  const [reel, setReel] = useState(stay.reel_url ?? "");
  const [uploading, setUploading] = useState(false);

  const patch = (p: Parameters<typeof update.mutate>[0]["patch"], ok?: string) =>
    update.mutate(
      { id: stay.id, patch: p },
      {
        onSuccess: () => ok && toast.success(ok),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
      },
    );

  const onThumb = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      patch({ thumb_url: url }, "Thumbnail updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <tr className="align-top hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <label className="relative block h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-100" title="Upload thumbnail">
            {stay.thumb_url ? (
              <img src={stay.thumb_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="m-3.5 h-5 w-5 text-gray-400" />
            )}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => onThumb(e.target.files?.[0])} />
          </label>
          <div>
            <div className="font-medium text-primary">{stay.label}</div>
            <div className="text-xs text-gray-400">{stay.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {stay.city}
        {stay.area ? ` · ${stay.area}` : ""}
      </td>
      <td className="px-4 py-3 text-gray-600">
        <a href={stay.affiliate_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-primary">
          {stay.ota} <ExternalLink className="h-3 w-3" />
        </a>
        <div className="text-xs text-gray-400">
          {stay.rating ?? "—"}/10 · {stay.review_count?.toLocaleString("en-US") ?? "—"} · {stay.facts_checked_on}
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          value={reel}
          onChange={(e) => setReel(e.target.value)}
          onBlur={() => reel !== (stay.reel_url ?? "") && patch({ reel_url: reel || null }, "Reel link saved")}
          placeholder="https://www.instagram.com/reel/…/"
          className="w-56 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          defaultValue={stay.sort_order}
          onBlur={(e) => Number(e.target.value) !== stay.sort_order && patch({ sort_order: Number(e.target.value) || 0 })}
          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs"
          title="Lower shows first; ties are newest first"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => patch({ is_active: !stay.is_active })}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            stay.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {stay.is_active ? "Live" : "Hidden"}
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-400">{format(new Date(stay.created_at), "yyyy-MM-dd")}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <a href={`/where-to-stay#${stay.slug}`} target="_blank" rel="noopener" className="text-gray-500 hover:text-primary" aria-label="View card">
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => {
              if (!window.confirm(`Delete "${stay.label}"? Hiding it (Live → Hidden) keeps the history.`)) return;
              del.mutate(stay.id, { onSuccess: () => toast.success("Deleted") });
            }}
            className="text-gray-500 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function StaysPage() {
  const { data, isLoading } = useAdminStays();
  const stays = data ?? [];

  return (
    <>
      <Helmet>
        <title>Where to Stay | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-6 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Where to Stay</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Hotel cards behind the @koreastaylist profile link. Card first, then publish the Reel.
          </p>
        </div>

        <ImportBox />

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Hotel (label)", "City", "OTA · facts", "Reel", "Order", "Status", "Added", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))}
              {!isLoading && stays.map((s) => <StayRowItem key={s.id} stay={s} />)}
              {!isLoading && stays.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No stays yet — paste a stay.json above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
