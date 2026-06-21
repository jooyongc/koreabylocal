import { ShoppingBag } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import SectionHeading from "@/components/home/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import AffiliateBanner from "@/components/shop/AffiliateBanner";
import ShopProductCard, {
  type ShopProduct,
} from "@/components/shop/ShopProductCard";

// TODO(db): replace with live affiliate products. hrefs point to partners.
const SHOP_PRODUCTS: ShopProduct[] = [
  { title: "Korea by Local — Print Magazine, Issue 04", partner: "via Local Press", price: "$24", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&q=80", tag: "Editorial" },
  { title: "Seoul Neighbourhoods Risograph Map", partner: "via Studio Hanok", price: "$32", img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&q=80", tag: "Print" },
  { title: "Hanji Postcard Set (12)", partner: "via Insadong Makers", price: "$18", img: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=700&q=80", tag: "Paper" },
  { title: "Obangsaek Pattern Tote", partner: "via Seoul Goods Co.", price: "$28", img: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=700&q=80", tag: "Wear" },
  { title: "Korean Tea Sampler Box", partner: "via Boseong Farm", price: "$36", img: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=700&q=80", tag: "Taste" },
  { title: "Celadon Espresso Cup", partner: "via Icheon Ceramics", price: "$44", img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&q=80", tag: "Home" },
];

export default function ShopPage() {
  const heroRef = useReveal<HTMLElement>();
  const gridRef = useReveal<HTMLElement>();

  return (
    <>
      <PageSEO
        title="The Shop | Korea By Local"
        description="Magazines, prints and goods from independent Korean makers we love — curated by locals. Affiliate partners; the price is the same for you."
        path="/shop"
      />

      {/* Hero */}
      <section
        ref={heroRef}
        className="reveal mx-auto max-w-[1180px] px-4 pb-[clamp(14px,2vw,22px)] pt-[clamp(30px,4.5vw,56px)] text-center sm:px-6 lg:px-8"
      >
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <ShoppingBag className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          상점 · K-Goods
        </div>
        <h1 className="mt-2.5 font-display text-[clamp(32px,5.5vw,62px)] font-extrabold leading-[1] tracking-[-0.03em] text-ink">
          The <span className="font-serif-accent font-medium italic">Shop</span>
        </h1>
        <p className="mx-auto mt-3.5 max-w-[44ch] font-serif-accent text-[clamp(16px,2vw,22px)] italic text-muted">
          Magazines, prints and goods from Korean makers we love.
        </p>
      </section>

      {/* Disclosure + product grid */}
      <section
        ref={gridRef}
        className="reveal mx-auto max-w-[1180px] px-4 pb-[clamp(40px,6vw,80px)] sm:px-6 lg:px-8"
      >
        <AffiliateBanner />
        <SectionHeading eyebrow="Curated · 6 picks" title="Goods from Korean makers" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[18px]">
          {SHOP_PRODUCTS.map((product) => (
            <ShopProductCard key={product.title} {...product} />
          ))}
        </div>
      </section>
    </>
  );
}
