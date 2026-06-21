import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";

// TODO(db): replace with the latest scraped/published magazine posts.
const ARTICLES = [
  { cat: "City Guide", title: "The Seoul locals’ guide to Euljiro’s hidden bars", read: "8 min", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&q=80", big: true },
  { cat: "Food", title: "Where to eat in Busan like a Busanite", read: "6 min", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80", big: false },
  { cat: "Itinerary", title: "Jeju in autumn: a slow four-day route", read: "10 min", img: "https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=800&q=80", big: false },
];

export default function MagazineStrip() {
  const ref = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[1180px] px-4 pt-[clamp(44px,6vw,80px)] sm:px-6 lg:px-8"
    >
      <SectionHeading
        eyebrow="Stories from the ground"
        title="The Local Magazine"
        link={{ label: "Read more", to: "/blog" }}
      />
      <div className="grid gap-[18px] md:grid-cols-2 md:grid-rows-2">
        {ARTICLES.map((a) => (
          <Link
            key={a.title}
            to="/blog"
            className={`group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(16,15,44,0.08)] ${
              a.big ? "md:row-span-2" : ""
            }`}
          >
            <div className={`relative overflow-hidden ${a.big ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
              <div
                role="img"
                aria-label={a.title}
                className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${a.img})` }}
              />
              <span className="absolute left-3 top-3 rounded-[7px] bg-gold px-2.5 py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink">
                {a.cat}
              </span>
            </div>
            <div className="p-4 text-left">
              <h3
                className={`font-display font-bold leading-[1.2] text-ink ${
                  a.big ? "text-[clamp(20px,2.4vw,27px)]" : "text-[17px]"
                }`}
              >
                {a.title}
              </h3>
              <div className="mt-2.5 text-[12.5px] text-muted-2">{a.read} read</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
