import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Sparkles, Check, X, Plus } from "lucide-react";
import toast from "react-hot-toast";

type Tone = "informative" | "editorial";

export default function NewDraftForm() {
  const [topic, setTopic] = useState("Best day trips from Seoul by train");
  const [keywords, setKeywords] = useState<string[]>([
    "seoul day trips",
    "ktx from seoul",
  ]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [tone, setTone] = useState<Tone>("informative");
  const [autoLink, setAutoLink] = useState(true);
  const [genSchema, setGenSchema] = useState(true);

  function addKeyword() {
    const value = keywordDraft.trim();
    if (!value || keywords.includes(value)) {
      setKeywordDraft("");
      return;
    }
    setKeywords((k) => [...k, value]);
    setKeywordDraft("");
  }

  function removeKeyword(value: string) {
    setKeywords((k) => k.filter((kw) => kw !== value));
  }

  function onKeywordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Stub: real Claude generation is wired up later.
    toast("Claude generation is coming soon", { icon: "✶" });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="min-w-[260px] flex-[1_1_280px] rounded-[18px] border border-white/10 bg-white/[0.04] p-[22px]"
    >
      <div className="font-display text-lg font-bold text-white">New AI draft</div>
      <p className="mb-4 mt-1 text-[12.5px] text-white/50">
        Claude writes a sourced, schema-ready article.
      </p>

      {/* Topic */}
      <label
        htmlFor="studio-topic"
        className="mb-[7px] block text-[11px] font-bold uppercase tracking-[0.06em] text-white/40"
      >
        Topic
      </label>
      <input
        id="studio-topic"
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="What should Claude write about?"
        className="w-full rounded-[11px] border border-white/[0.12] bg-white/[0.06] px-3.5 py-3 text-sm text-white placeholder:text-white/35 focus:border-accent focus:outline-none"
      />

      {/* Target keywords */}
      <div className="mb-[7px] mt-4 text-[11px] font-bold uppercase tracking-[0.06em] text-white/40">
        Target keywords
      </div>
      <div className="flex flex-wrap items-center gap-[7px]">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple/[0.22] px-[11px] py-1.5 text-xs text-[#c7b8ff]"
          >
            {kw}
            <button
              type="button"
              onClick={() => removeKeyword(kw)}
              aria-label={`Remove keyword ${kw}`}
              className="rounded-full text-[#c7b8ff]/80 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] pl-2.5 pr-1 text-xs text-white/60 focus-within:ring-1 focus-within:ring-white/40">
          <input
            type="text"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={onKeywordKeyDown}
            onBlur={addKeyword}
            placeholder="add"
            aria-label="Add target keyword"
            size={6}
            className="w-16 bg-transparent py-1.5 text-xs text-white placeholder:text-white/45 focus:outline-none"
          />
          <button
            type="button"
            onClick={addKeyword}
            aria-label="Add keyword"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:text-white focus:outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {/* Tone toggle */}
      <div
        className="mt-4 flex gap-2"
        role="radiogroup"
        aria-label="Article tone"
      >
        {(["informative", "editorial"] as const).map((t) => {
          const active = tone === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTone(t)}
              className={`flex-1 rounded-[9px] py-2 text-center text-[12.5px] capitalize transition-colors ${
                active
                  ? "bg-accent font-bold text-white"
                  : "bg-white/[0.06] font-semibold text-white/60 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Checkboxes */}
      <ToggleCheckbox
        checked={autoLink}
        onChange={setAutoLink}
        label="Auto-insert Experiences + Shop links"
      />
      <ToggleCheckbox
        checked={genSchema}
        onChange={setGenSchema}
        label="Generate FAQ + Article JSON-LD"
      />

      {/* Generate button */}
      <button
        type="submit"
        className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-accent py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Sparkles className="h-[18px] w-[18px]" />
        Generate draft with Claude
      </button>
    </form>
  );
}

function ToggleCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="mt-2.5 flex cursor-pointer select-none items-center gap-[9px] text-[13px] text-white/75 first-of-type:mt-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] text-[11px] text-white transition-colors ${
          checked ? "bg-accent" : "border border-white/25 bg-white/[0.06]"
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}
