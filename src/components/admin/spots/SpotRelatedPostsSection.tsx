import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { useBlogPostOptions } from "@/hooks/useBlogPostOptions";
import type { SpotFormData } from "@/types/admin";

export default function SpotRelatedPostsSection() {
  const { data: posts } = useBlogPostOptions();
  const { watch, setValue } = useFormContext<SpotFormData>();
  const selected = watch("related_post_slugs") ?? [];
  const [query, setQuery] = useState("");

  const options = (posts ?? []).filter(
    (p) => !selected.includes(p.slug) && p.title.toLowerCase().includes(query.toLowerCase()),
  );

  const add = (slug: string) => setValue("related_post_slugs", [...selected, slug]);
  const remove = (slug: string) => setValue("related_post_slugs", selected.filter((s) => s !== slug));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Related Guidebook Articles</h2>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((slug) => {
            const post = posts?.find((p) => p.slug === slug);
            return (
              <span
                key={slug}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {post?.title ?? slug}
                <button type="button" onClick={() => remove(slug)} aria-label={`Remove ${slug}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search guidebook articles to link..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {query && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-100">
          {options.slice(0, 20).map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => {
                add(p.slug);
                setQuery("");
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              {p.title}
            </button>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">No matching articles</p>
          )}
        </div>
      )}
    </section>
  );
}
