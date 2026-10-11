/**
 * One small line that sits ABOVE the first affiliate link on the page — the
 * same rule supabase/functions/_shared/affiliate.ts applies to articles:
 *   1. disclosure before any affiliate link (bottom-of-page does not meet FTC)
 *   2. say that we earn a commission AND that the reader's price is unchanged
 * The booking buttons already name each site, so the line doesn't list them.
 */
export default function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-[1.5] text-muted-2 ${className}`}>
      We may earn a commission when you book through these links, at no extra cost to you.
    </p>
  );
}
