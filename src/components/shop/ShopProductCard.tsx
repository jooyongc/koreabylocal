export interface ShopProduct {
  title: string;
  partner: string;
  price: string;
  img: string;
  tag: string;
  /** External affiliate partner URL. */
  href?: string;
}

/**
 * Affiliate product card: square image + tag badge, title, partner name and
 * price, linking out to the partner. Rendered as an external anchor with
 * rel="sponsored" since these point to affiliate partners.
 */
export default function ShopProductCard({ title, partner, price, img, tag, href = "#" }: ShopProduct) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex flex-col overflow-hidden rounded-[18px] bg-white text-left shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(26,26,26,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-200">
        <div
          role="img"
          aria-label={title}
          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${img})` }}
        />
        <span className="absolute left-3 top-3 rounded-[7px] bg-paper px-2.5 py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-ink">
          {tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[15.5px] font-bold leading-[1.25] text-ink">
          {title}
        </h3>
        <div className="mt-1.5 text-[12px] text-muted-2">{partner}</div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-[18px] font-extrabold text-ink">
            {price}
          </span>
          <span className="text-[12px] font-bold text-accent">
            View on partner →
          </span>
        </div>
      </div>
    </a>
  );
}
