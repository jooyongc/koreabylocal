import { useState } from "react";
import {
  Download,
  Calendar,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { format } from "date-fns";
import { useMagazines } from "@/hooks/useMagazines";
import { useMagazineDownload } from "@/hooks/useMagazineMutation";
import { useAuthStore } from "@/stores/useAuthStore";
import EmailDownloadModal from "@/components/magazine/EmailDownloadModal";
import { Skeleton } from "@/components/common/Skeleton";
import type { DigitalMagazine } from "@/types";
import toast from "react-hot-toast";

export default function MagazinePage() {
  const { data: magazines, isLoading } = useMagazines();
  const user = useAuthStore((s) => s.user);
  const downloadMutation = useMagazineDownload();

  const [modalMagazine, setModalMagazine] = useState<DigitalMagazine | null>(
    null,
  );

  const handleDownloadClick = (magazine: DigitalMagazine) => {
    if (user) {
      // Logged in — download directly
      triggerDownload(user.email, magazine);
    } else {
      // Not logged in — show email modal
      setModalMagazine(magazine);
    }
  };

  const triggerDownload = async (email: string, magazine: DigitalMagazine) => {
    try {
      const result = await downloadMutation.mutateAsync({
        email,
        magazineId: magazine.id,
      });

      if (result.file_url) {
        window.open(result.file_url, "_blank");
        toast.success("Download started! Check your email for a copy.");
      } else {
        toast.success("Download link sent to your email!");
      }

      setModalMagazine(null);
    } catch {
      toast.error("Failed to process download. Please try again.");
    }
  };

  const handleModalSubmit = async (email: string) => {
    if (!modalMagazine) return;
    await triggerDownload(email, modalMagazine);
  };

  return (
    <>
      <PageSEO
        title="Digital Magazine | Korea By Local"
        description="Download free Korean Local Travel Contents digital magazines. Monthly issues covering authentic Korean travel, culture, and local experiences."
        path="/shop/magazine"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-ink to-coral py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
            <BookOpen className="h-4 w-4" />
            Free Digital Magazine
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Korean Local Travel Contents
          </h1>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Monthly digital magazine featuring authentic Korean travel stories,
            local guides, and cultural insights — all for free.
          </p>
        </div>
      </section>

      {/* Magazine Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary md:text-3xl">
              All Issues
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {magazines?.length ?? 0} issues available
            </p>
            <div className="mt-3 h-px w-24 bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {magazines?.map((mag) => (
              <MagazineCard
                key={mag.id}
                magazine={mag}
                onDownload={handleDownloadClick}
              />
            ))}
          </div>
        )}

        {!isLoading && magazines?.length === 0 && (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              No magazines available yet. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h3 className="text-xl font-bold text-primary">
            Never miss an issue
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            New issues are published monthly. Follow us to stay updated on the
            latest Korean travel content.
          </p>
          <a
            href="/ask-a-local"
            className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Contact us for more info
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      {/* Email Modal */}
      <EmailDownloadModal
        open={!!modalMagazine}
        onClose={() => setModalMagazine(null)}
        onSubmit={handleModalSubmit}
        magazineTitle={modalMagazine?.title ?? ""}
        isLoading={downloadMutation.isPending}
      />
    </>
  );
}

/* ── Magazine Card ─────────────────────────────────────────── */

function MagazineCard({
  magazine,
  onDownload,
}: {
  magazine: DigitalMagazine;
  onDownload: (mag: DigitalMagazine) => void;
}) {
  const issueLabel = magazine.issue_date
    ? format(new Date(magazine.issue_date), "MMMM yyyy")
    : "";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-primary/20 hover:shadow-lg">
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        {magazine.cover_image_url ? (
          <img
            src={magazine.cover_image_url}
            alt={magazine.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <BookOpen className="mb-3 h-12 w-12 text-primary/30" />
            <p className="text-sm font-semibold text-primary/60">
              Korea By Local
            </p>
            <p className="mt-1 text-xs text-primary/40">Digital Magazine</p>
            {issueLabel && (
              <p className="mt-3 text-lg font-bold text-primary/50">
                {issueLabel}
              </p>
            )}
          </div>
        )}

        {/* Free badge */}
        <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
          FREE
        </div>

        {/* Download count */}
        {magazine.download_count > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <Download className="h-3 w-3" />
            {magazine.download_count.toLocaleString()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {magazine.title}
        </h3>

        {issueLabel && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {issueLabel}
          </div>
        )}

        {magazine.description && (
          <p className="mt-2 text-xs leading-relaxed text-text-secondary line-clamp-2">
            {magazine.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <button
            onClick={() => onDownload(magazine)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Free Download
          </button>
        </div>
      </div>
    </div>
  );
}
