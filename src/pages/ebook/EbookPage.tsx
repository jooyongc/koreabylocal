import { useState } from "react";
import { Loader2, Download, Check } from "lucide-react";
import toast from "react-hot-toast";
import PageSEO from "@/components/common/PageSEO";
import { useEbooks } from "@/hooks/useEbooks";
import { supabase } from "@/lib/supabase";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function EbookPage() {
  const { data: ebooks, isLoading } = useEbooks();
  const ebook = ebooks?.[0];

  return (
    <>
      <PageSEO
        title="The Korea By Local E-book | Korea By Local"
        description="Our full local guide to Korea, in one downloadable e-book — neighborhoods, spots and tips from real locals."
        path="/ebook"
      />

      {isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : ebook ? (
        <div className="mx-auto max-w-[1080px] px-4 py-[clamp(32px,5vw,64px)] sm:px-6 lg:px-8">
          <div className="grid gap-[clamp(24px,4vw,48px)] lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
            {ebook.cover_image_url && (
              <div className="overflow-hidden rounded-[20px] bg-cream-200 shadow-[0_20px_44px_rgba(26,26,26,0.16)]">
                <img src={ebook.cover_image_url} alt={ebook.title} className="w-full object-cover" />
              </div>
            )}

            <div>
              <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-dark">
                E-book
              </span>
              <h1 className="mt-3 font-display text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                {ebook.title}
              </h1>
              {ebook.description && (
                <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.65] text-muted">{ebook.description}</p>
              )}

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-[28px] font-extrabold text-ink">{money(Number(ebook.price_usd))}</span>
                <span className="text-[13px] text-muted-2">one-time</span>
              </div>

              {ebook.preview_images.length > 0 && (
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {ebook.preview_images.slice(0, 6).map((img, i) => (
                    <img key={i} src={img} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <ul className="mt-6 space-y-1.5 text-[13.5px] text-muted-2">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Curated spots, tips and maps</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Instant digital download</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" /> Free updates as we add more cities</li>
              </ul>

              <EbookLeadForm ebookSlug={ebook.slug} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">E-book coming soon</h1>
          <p className="mt-2 text-muted">Leave your email and we’ll let you know the moment it’s ready.</p>
          <EbookLeadForm ebookSlug="ebook-launch" />
        </div>
      )}
    </>
  );
}

function EbookLeadForm({ ebookSlug }: { ebookSlug: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("subscribers").insert({
      email: email.trim(),
      source: "ebook_download",
      lead_magnet: ebookSlug,
    });
    setSubmitting(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Something went wrong — please try again.");
      return;
    }
    toast.success("Check your inbox — your download link is on the way!");
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="mt-7 flex max-w-[420px] flex-wrap gap-2.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-[13px] border border-ink/12 bg-white px-[18px] py-[14px] text-[15px] text-ink outline-none placeholder:text-muted-3"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 rounded-[13px] bg-accent px-6 py-[14px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Get it
      </button>
    </form>
  );
}
