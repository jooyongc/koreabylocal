import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { RelatedItem, RelatedPicks as Picks } from "@/types";

/**
 * What to read, visit and buy next, worked out per article when it was
 * published rather than by matching categories.
 *
 * Order is deliberate — guides, then spots, then products. A reader who just
 * finished an article is looking for more of the thing they came for, and
 * leading with something to buy is how a guidebook stops being trusted.
 *
 * Empty groups are simply absent: nothing here pads itself out to look full.
 */

// Products are judged and stored, but not shown: the shop is currently
// switched off — /product/:slug, /shop/*, /cart and /checkout all redirect to
// /ebook — so every product link would bounce the reader somewhere they did not
// ask to go. Add the row back here when there is a product page to land on.
const GROUPS: { key: keyof Pick<Picks, "posts" | "spots">; heading: string; href: (slug: string) => string }[] = [
  { key: "posts", heading: "Read next", href: (s) => `/guidebook/${s}` },
  { key: "spots", heading: "Where to go", href: (s) => `/spots/${s}` },
];

function Card({ item, href }: { item: RelatedItem; href: string }) {
  return (
    <Link
      to={href}
      className="group flex items-center justify-between gap-3 rounded-[14px] border border-ink/10 bg-white px-4 py-3.5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(26,26,26,0.10)]"
    >
      <span className="text-[14px] font-semibold leading-snug text-ink">{item.title}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-3 transition-colors group-hover:text-accent" />
    </Link>
  );
}

export default function RelatedPicks({ picks }: { picks: Picks }) {
  const groups = GROUPS.filter((g) => picks[g.key].length > 0);
  if (groups.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <div key={g.key}>
            <h2 className="font-display text-[clamp(18px,2.2vw,22px)] font-extrabold tracking-[-0.01em] text-ink">
              {g.heading}
            </h2>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {picks[g.key].map((item) => (
                <Card key={item.slug} item={item} href={g.href(item.slug)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
