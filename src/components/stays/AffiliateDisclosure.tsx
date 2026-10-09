/**
 * Shown ABOVE the first affiliate link on the page — the same rule
 * supabase/functions/_shared/affiliate.ts applies to articles:
 *   1. disclosure before any affiliate link (bottom-of-page does not meet FTC)
 *   2. say that we earn a commission AND that the reader's price is unchanged
 *   3. name whose links these are
 */
export default function AffiliateDisclosure({ programs }: { programs: string[] }) {
  const names = Array.from(new Set(programs));
  const list =
    names.length === 0
      ? "travel booking sites"
      : names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

  return (
    <div className="rounded-xl border-l-[3px] border-ink bg-[#f6f7fb] px-4 py-3 text-[13.5px] leading-[1.6] text-[#4b5563]">
      <em>
        The “Check rate” buttons on this page link to {list}. If you book through those links, we may earn a
        commission. It doesn’t change the price you pay.
      </em>
    </div>
  );
}
