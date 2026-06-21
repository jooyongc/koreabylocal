import { Link } from "react-router-dom";
import { format } from "date-fns";
import SectionHeading from "./SectionHeading";
import { useBlogList } from "@/hooks/useBlogList";
import { useReveal } from "@/hooks/useReveal";

export default function MagazineStrip() {
  const ref = useReveal<HTMLElement>();
  const { data } = useBlogList({ page: 1, pageSize: 3 });
  const posts = data?.posts ?? [];

  if (posts.length === 0) return null;

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
        {posts.map((p, i) => {
          const big = i === 0;
          return (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className={`group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(16,15,44,0.08)] ${
                big ? "md:row-span-2" : ""
              }`}
            >
              <div className={`relative overflow-hidden ${big ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
                <div
                  role="img"
                  aria-label={p.title}
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${p.thumbnail_url ?? ""})` }}
                />
                <span className="absolute left-3 top-3 rounded-[7px] bg-gold px-2.5 py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink">
                  {p.category}
                </span>
              </div>
              <div className="p-4 text-left">
                <h3
                  className={`font-display font-bold leading-[1.2] text-ink ${
                    big ? "text-[clamp(20px,2.4vw,27px)]" : "text-[17px]"
                  }`}
                >
                  {p.title}
                </h3>
                {p.published_at && (
                  <div className="mt-2.5 text-[12.5px] text-muted-2">
                    {format(new Date(p.published_at), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
