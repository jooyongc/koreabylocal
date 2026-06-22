import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";
import { FONT_PAIRS, applyFontPair, preloadAllFontPairs } from "@/lib/fontPairs";
import { useFontPairSetting } from "@/hooks/useSiteFont";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: current } = useFontPairSetting();
  const [selected, setSelected] = useState<string>("modern");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    preloadAllFontPairs();
  }, []);
  useEffect(() => {
    if (current) setSelected(current);
  }, [current]);

  const choose = async (key: string) => {
    setSelected(key);
    applyFontPair(key); // live preview across the whole site
    setSaving(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "font_pair", value: key }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("Could not save font setting");
      return;
    }
    qc.invalidateQueries({ queryKey: ["site-settings", "font_pair"] });
    toast.success("Site font updated");
  };

  return (
    <>
      <PageSEO title="Site Settings | Korea By Local Admin" description="Admin settings" path="/admin/settings" noindex />
      <div className="mx-auto max-w-[1100px] px-4 py-[clamp(24px,3.5vw,40px)] sm:px-6">
        <h1 className="font-display text-[clamp(24px,3vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
          Site Settings
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">Configure global site options.</p>

        {/* Typography */}
        <section className="mt-8">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Typography</div>
          <h2 className="mt-1.5 font-display text-[22px] font-bold text-ink">Site font</h2>
          <p className="mt-1 max-w-[60ch] text-[13.5px] text-muted">
            Pick a pairing to apply it live across the whole site. Each sets a display face, a
            serif accent and a UI/body face.
          </p>

          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
            {FONT_PAIRS.map((f) => {
              const active = selected === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => choose(f.key)}
                  className={`rounded-[20px] border-2 bg-white p-[26px] text-left shadow-[0_8px_26px_rgba(16,15,44,0.07)] transition-colors ${
                    active ? "border-accent" : "border-transparent hover:border-ink/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="font-sans text-[11.5px] font-bold tracking-[0.04em] text-muted-2">
                      {f.label}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-[7px] text-[12px] font-bold ${
                        active ? "bg-accent text-white" : "bg-ink/5 text-ink"
                      }`}
                    >
                      {saving === f.key ? "Saving…" : active ? (<><Check className="h-3.5 w-3.5" /> Applied</>) : "Apply"}
                    </span>
                  </div>
                  <div className="mt-1 font-sans text-[12px] text-muted-3">{f.vibe}</div>
                  <div
                    className="mb-1.5 mt-4 text-[clamp(28px,3.4vw,38px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink"
                    style={{ fontFamily: `${f.display}, sans-serif` }}
                  >
                    Korea, by locals.
                  </div>
                  <div
                    className="mb-3 text-[19px] italic text-muted"
                    style={{ fontFamily: `${f.serif}, serif` }}
                  >
                    More than travel — it’s connection.
                  </div>
                  <p
                    className="text-[14px] leading-[1.6] text-[#3a3730]"
                    style={{ fontFamily: `${f.body}, sans-serif` }}
                  >
                    A lifelong Seoulite walks you through two days of the city she actually loves.
                    현지인이 직접 쓴 가이드.
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
