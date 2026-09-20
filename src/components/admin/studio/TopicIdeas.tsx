import { useState } from "react";
import { Lightbulb, Loader2, Sparkles, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface DuplicateVerdict {
  probability: number;
  of_title: string | null;
  of_slug: string | null;
}

interface Topic {
  title: string;
  keywords: string[];
  intent: string;
  category: string;
  rationale: string;
  /** Set when an existing post already covers this topic. null means it is clear. */
  duplicate?: DuplicateVerdict | null;
}

export default function TopicIdeas({ onPick }: { onPick: (title: string, keywords: string[]) => void }) {
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  // False when the overlap check could not run, so the UI can say "unchecked"
  // rather than let a blank card read as "no overlap".
  const [checked, setChecked] = useState(true);

  async function suggest() {
    if (busy) return;
    setBusy(true);
    const t = toast.loading("Finding AEO/SEO/GEO topics…");
    try {
      const { data, error } = await supabase.functions.invoke("suggest-topics", {
        body: { focus: focus.trim(), count: 6 },
      });
      if (error) {
        let msg = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) msg = (await ctx.json())?.error ?? msg;
        } catch { /* keep */ }
        toast.error(msg, { id: t });
      } else {
        const next = (data?.topics as Topic[]) ?? [];
        const overlapping = next.filter((tp) => tp.duplicate).length;
        setTopics(next);
        setChecked(data?.duplicates_checked !== false);
        toast.success(
          overlapping > 0 ? `${next.length} topic ideas · ${overlapping} overlap existing posts` : `${next.length} topic ideas`,
          { id: t },
        );
      }
    } catch (e) {
      toast.error(String((e as Error).message), { id: t });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-6 lg:px-8 lg:pt-10">
      <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-[22px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-display text-[17px] font-bold text-white">
              <Lightbulb className="h-[18px] w-[18px] text-gold" /> Topic ideas
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] text-white/60">
                AEO SEO GEO
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-white/50">
              Let Claude propose answer-engine-friendly topics, then check each one against every post you have.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Focus (optional): e.g. Busan, K-pop, winter"
              className="w-[230px] rounded-[11px] border border-white/[0.12] bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={suggest}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-accent px-4 py-2.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Suggest topics
            </button>
          </div>
        </div>

        {topics.length > 0 && !checked && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/45">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Overlap check unavailable — these ideas have not been compared against your existing posts.
          </p>
        )}

        {topics.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((tp, i) => (
              <div
                key={i}
                className={`flex flex-col rounded-[14px] border p-4 ${
                  tp.duplicate ? "border-gold/25 bg-gold/[0.04]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-purple/[0.22] px-2 py-0.5 text-[10px] font-bold text-[#c7b8ff]">{tp.category}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">{tp.intent}</span>
                </div>
                <div className="font-display text-[15px] font-bold leading-snug text-white">{tp.title}</div>
                <p className="mt-1.5 text-[12px] leading-snug text-white/55">{tp.rationale}</p>

                {tp.duplicate && <DuplicateNote verdict={tp.duplicate} />}

                <div className="mt-2 flex flex-wrap gap-1">
                  {(tp.keywords ?? []).slice(0, 5).map((kw) => (
                    <span key={kw} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10.5px] text-white/60">{kw}</span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onPick(tp.title, tp.keywords ?? [])}
                  className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold transition-opacity hover:opacity-90 ${
                    tp.duplicate ? "bg-white/10 text-white/80" : "bg-accent text-white"
                  }`}
                >
                  {tp.duplicate ? "Use anyway" : "Use this"} <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Why an idea was flagged, with a way to go read the post it collides with.
 * The probability is shown rather than hidden — this is a suggestion the editor
 * overrules, not a verdict, and a borderline 45% should read differently from
 * a flat 95%.
 */
function DuplicateNote({ verdict }: { verdict: DuplicateVerdict }) {
  const pct = Math.round(verdict.probability * 100);
  const body = (
    <>
      <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
      <span className="leading-snug">
        <span className="font-bold">Overlaps an existing post</span>
        <span className="text-gold/70"> · {pct}% match</span>
        {verdict.of_title && (
          <>
            <br />
            <span className="text-white/70">{verdict.of_title}</span>
            {verdict.of_slug && <ExternalLink className="ml-1 inline h-3 w-3 align-[-1px] text-white/45" />}
          </>
        )}
      </span>
    </>
  );

  const className = "mt-2.5 flex items-start gap-1.5 rounded-lg border border-gold/25 bg-gold/[0.08] px-2.5 py-2 text-[11.5px] text-gold";

  // Attribution is a second judgement and can fail on its own, leaving a
  // probability with no post to point at.
  return verdict.of_slug ? (
    <a
      href={`/guidebook/${verdict.of_slug}`}
      target="_blank"
      rel="noreferrer"
      className={`${className} transition-colors hover:border-gold/40 hover:bg-gold/[0.13]`}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
