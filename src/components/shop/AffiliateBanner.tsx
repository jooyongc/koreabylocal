import { Link2 } from "lucide-react";

/**
 * Purple-tinted affiliate disclosure banner shown above the shop grid.
 * Discloses that products link to independent Korean makers via affiliate
 * partnerships.
 */
export default function AffiliateBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-purple/20 bg-purple/[0.07] px-[18px] py-[13px] text-[13px] leading-relaxed text-muted">
      <Link2
        className="mt-[1px] h-4 w-4 shrink-0 text-purple"
        strokeWidth={2}
        aria-hidden="true"
      />
      <p>
        <strong className="font-semibold text-ink">Affiliate partners.</strong>{" "}
        We curate goods from independent Korean makers and earn a small
        commission — the price is the same for you, and it funds the magazine.
      </p>
    </div>
  );
}
