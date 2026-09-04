import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Sun, Navigation2, Loader2, MessageCircle, BookOpen } from "lucide-react";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import { useRegion } from "@/hooks/useConcepts";
import { supabase } from "@/lib/supabase";
import TypeFilter from "@/components/home/TypeFilter";
import SpotGrid from "@/components/home/SpotGrid";
import type { BlogPost } from "@/types";

export default function DestinationPage() {
  const { region: regionKey } = useParams<{ region: string }>();
  const { data: region, isLoading } = useRegion(regionKey);

  const { data: relatedGuides } = useQuery({
    queryKey: ["region-guides", region?.name],
    enabled: !!region?.name,
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title")
        .eq("status", "published")
        .or(`title.ilike.%${region!.name}%,excerpt.ilike.%${region!.name}%`)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data as BlogPost[]) ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Destination not found</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-accent">← Back to Explore</Link>
      </div>
    );
  }

  const gettingThereGuide = relatedGuides?.find((p) =>
    /getting there|transport|ktx|how to get/i.test(p.title),
  );
  const guidebookArticles = (relatedGuides ?? [])
    .filter((p) => p.id !== gettingThereGuide?.id)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: region.name,
    description: region.description ?? region.blurb ?? undefined,
    image: region.cover_image_url ?? undefined,
    url: `${SITE_URL}/destinations/${region.key}`,
  };

  return (
    <>
      <PageSEO
        title={`${region.name} Travel Guide — Local's Picks | Korea by Local`}
        description={(region.description ?? region.blurb ?? `Explore ${region.name} with Korea By Local.`).slice(0, 160)}
        path={`/destinations/${region.key}`}
        ogImage={region.cover_image_url ?? undefined}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <div className="relative flex min-h-[280px] items-end overflow-hidden bg-ink sm:min-h-[340px]">
        {region.cover_image_url && (
          <img src={region.cover_image_url} alt={region.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-8 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-[13px] text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{region.name}</span>
          </nav>
          <h1 className="font-display text-[clamp(32px,5.5vw,58px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
            {region.name}
          </h1>
          {region.tag && (
            <span className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">
              {region.tag}
            </span>
          )}
          {region.blurb && (
            <p className="mt-3 line-clamp-2 max-w-[60ch] text-[15px] leading-[1.55] text-white/80">
              {region.blurb}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[13.5px] text-white/80">
            {region.getting_there_summary && (
              <span className="flex items-center gap-1.5"><Navigation2 className="h-4 w-4 text-accent" /> {region.getting_there_summary}</span>
            )}
            {region.best_season && (
              <span className="flex items-center gap-1.5"><Sun className="h-4 w-4 text-accent" /> Best season: {region.best_season}</span>
            )}
          </div>
        </div>
      </div>

      <TypeFilter />
      <SpotGrid area={region.key} />

      {/* Related content */}
      {(gettingThereGuide || guidebookArticles.length > 0) && (
        <div className="mx-auto max-w-[1180px] px-4 py-[clamp(20px,3vw,32px)] sm:px-6 lg:px-8">
          {gettingThereGuide && (
            <Link
              to={`/guidebook/${gettingThereGuide.slug}`}
              className="mb-4 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-4 transition-colors hover:border-accent"
            >
              <Navigation2 className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">Getting there</div>
                <div className="text-[14.5px] font-semibold text-ink">{gettingThereGuide.title}</div>
              </div>
            </Link>
          )}

          {guidebookArticles.length > 0 && (
            <div>
              <h2 className="font-display text-[19px] font-extrabold text-ink">Guidebook articles</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {guidebookArticles.map((post) => (
                  <Link
                    key={post.id}
                    to={`/guidebook/${post.slug}`}
                    className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-white p-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 pb-[clamp(32px,5vw,56px)] sm:px-6 md:grid-cols-2 lg:px-8">
        <Link
          to="/about"
          className="flex items-center gap-3 rounded-2xl bg-ink p-5 text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <div className="text-[14.5px] font-bold">Need help exploring {region.name}?</div>
            <div className="text-[12.5px] text-white/70">Chat with a local →</div>
          </div>
        </Link>
        <Link
          to="/ebook"
          className="flex items-center gap-3 rounded-2xl bg-accent-light p-5 text-accent-dark transition-colors hover:bg-accent-light/70"
        >
          <BookOpen className="h-5 w-5 shrink-0" />
          <div>
            <div className="text-[14.5px] font-bold">Want the full {region.name} guide?</div>
            <div className="text-[12.5px]">It's in the e-book →</div>
          </div>
        </Link>
      </div>
    </>
  );
}
