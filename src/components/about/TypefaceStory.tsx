import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

// The story and rules of KBL Dongne, the brand's own Latin typeface. Copy and
// numbers follow the KBL design-system artifact (Typeface, Typography and
// tokens.json); keep them in sync with it rather than editing them here alone.

type PartKind = "circle" | "person" | "earth" | "heaven";

const PARTS: { kind: PartKind; jamo: string; name: string; role: string }[] = [
  { kind: "circle", jamo: "ㅇ", name: "Circle", role: "Every bowl: O and o, and the rounds of b d p q a g e c. A near-perfect circle, with 10–12 units of overshoot." },
  { kind: "person", jamo: "ㅣ", name: "Person", role: "Every vertical stem — 84 units thick in Regular, 150 in Bold." },
  { kind: "earth", jamo: "ㅡ", name: "Earth", role: "Every crossbar, a touch thinner than the stem (74 / 124) so the two carry the same visual weight." },
  { kind: "heaven", jamo: "·", name: "Heaven", role: "The dots on i and j, the period, colon, ! and ?, the middle dot and the ellipsis — all perfect circles, slightly wider than a stem." },
];

const DETAILS: { lead: string; text: string }[] = [
  { lead: "a = ㅇ + ㅣ", text: "The single-storey a is a circle with a pillar beside it, just like 아 or 이." },
  { lead: "t is drawn like ㅏ", text: "Its crossbar reaches further to the right." },
  { lead: "A V W M", text: "Their points end in tiny flats, so they stay crisp at small sizes." },
  { lead: "c e s r f j", text: "Curved ends are cut toward the center of the circle." },
];

const CHARSET = [
  "167 glyphs · Regular 400 and Bold 700",
  "A–Z, a–z and tabular 0–9",
  "Western European accents, À–Ü / à–ü and Ñ ñ",
  "McCune–Reischauer Ŏ ŏ Ŭ ŭ, so old maps and books (Hangŭl, Pusan) set as written",
  "The won sign ₩ and arrows → ←",
  "About 20 kerning classes (AV, LT, To, Yo, P.)",
];

const SCALE: { name: string; spec: string; use: string; sample: string; className: string }[] = [
  { name: "display-xl", spec: "72 / 72 · Bold · −0.02em", use: "Hero headline, one per page", sample: "Korea by Local", className: "font-display text-[clamp(44px,7vw,72px)] font-bold leading-none tracking-[-0.02em]" },
  { name: "display", spec: "48 / 52 · Bold · −0.015em", use: "Page titles", sample: "Annyeong, Seoul!", className: "font-display text-[clamp(34px,5vw,48px)] font-bold leading-[1.08] tracking-[-0.015em]" },
  { name: "heading", spec: "28 / 34 · Bold · −0.01em", use: "Section headings", sample: "Is tipping required in Korea?", className: "font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em]" },
  { name: "title", spec: "20 / 26 · Bold", use: "Tour and card titles", sample: "Night at the Palace — the most beautiful walk in Seoul", className: "font-display text-[20px] font-bold leading-[26px]" },
  { name: "body-lg", spec: "19 / 30 · Regular", use: "Lead paragraphs and intros", sample: "Discover authentic Korean travel experiences curated by locals.", className: "text-[19px] leading-[30px]" },
  { name: "body", spec: "16 / 26 · Regular", use: "Running text in guides and tour pages", sample: "Born in Seoul, love my city! Tours, transfers, K-goods, and more.", className: "text-[16px] leading-[26px]" },
  { name: "label", spec: "13 / 16 · Bold · +0.08em · caps", use: "Navigation, buttons, eyebrows, tags", sample: "Ask a Local", className: "text-[13px] font-bold uppercase leading-4 tracking-[0.08em]" },
  { name: "caption", spec: "13 / 18 · Regular", use: "Metadata under titles", sample: "2.5 hours · Anguk Station Exit 1 · ₩45,000", className: "text-[13px] leading-[18px] text-muted" },
];

const RULES: { title: string; text: string }[] = [
  { title: "Two weights, clear jobs", text: "Bold (700) for every headline — hero, page titles, section heads, card titles. Regular (400) for reading text and lead paragraphs. Emphasis is Bold only." },
  { title: "No italic", text: "KBL Dongne has no italic, and we switch off faux bold and italic (font-synthesis: none) so the browser never invents one." },
  { title: "Capitals for labels only", text: "Navigation, buttons, tags and eyebrows are set as uppercase labels. A whole paragraph is never set in capitals." },
  { title: "The round middle dot", text: "Separate metadata with · (U+00B7) — the same circle as heaven's dot. 2.5 hours · Anguk Station Exit 1 · ₩45,000" },
  { title: "Figures line up", text: "Figures are tabular by default, so prices and times align in columns. Write won with the ₩ glyph." },
  { title: "13px minimum", text: "Regular never goes below 13px. Anything smaller is a Bold label." },
  { title: "Always the full stack", text: "Set the font through the --font-sans stack, never \"KBL Dongne\" alone: it has no Hangul, so Korean falls through to Pretendard, then Apple SD Gothic Neo, then Noto Sans KR." },
  { title: "Arrows from the font, no emoji", text: "Use the typeface's own → and ←, as in \"Book now →\". We don't use emoji." },
];

// The zip (public/downloads/fonts) bundles all three formats, the specimen and a README.
const PACKAGE = { href: "/downloads/fonts/KBL-Dongne.zip", size: "110 KB" };

const FILES: { format: string; label: string; files: { weight: string; href: string }[] }[] = [
  { format: "OTF", label: "Design tools — Figma, Illustrator, Keynote", files: [{ weight: "Regular", href: "/downloads/fonts/KBLDongne-Regular.otf" }, { weight: "Bold", href: "/downloads/fonts/KBLDongne-Bold.otf" }] },
  { format: "TTF", label: "Office — Word, PowerPoint, Windows (screen-hinted)", files: [{ weight: "Regular", href: "/downloads/fonts/KBLDongne-Regular.ttf" }, { weight: "Bold", href: "/downloads/fonts/KBLDongne-Bold.ttf" }] },
  { format: "WOFF2", label: "Websites", files: [{ weight: "Regular", href: "/fonts/KBLDongne-Regular.woff2" }, { weight: "Bold", href: "/fonts/KBLDongne-Bold.woff2" }] },
];

const INSTALL = [
  "Mac: double-click each .otf file and click Install Font.",
  "Windows: right-click each .ttf file and choose Install.",
  "Figma, Illustrator and Keynote pick it up once it's installed.",
];

// Lines kept under ~40 characters so the snippet fits a phone without wrapping.
const WEB_SNIPPET = `@font-face {
  font-family: "KBL Dongne";
  src: url(KBLDongne-Regular.woff2)
    format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "KBL Dongne";
  src: url(KBLDongne-Bold.woff2)
    format("woff2");
  font-weight: 700;
  font-display: swap;
}
body {
  font-family: "KBL Dongne",
    "Pretendard", "Apple SD Gothic Neo",
    "Noto Sans KR", system-ui,
    sans-serif;
  font-synthesis: none;
}`;

function PartShape({ kind }: { kind: PartKind }) {
  if (kind === "circle") return <span className="block h-11 w-11 rounded-full border-[7px] border-ink" />;
  if (kind === "person") return <span className="block h-11 w-[9px] bg-ink" />;
  if (kind === "earth") return <span className="block h-2 w-11 bg-ink" />;
  return <span className="block h-[13px] w-[13px] rounded-full bg-ink" />;
}

/** The cover motif: the four parts as blocks — a ring cut into a navy slab, ㅣ ㅡ · on a tint, a field of dots. */
function CoverBlocks() {
  return (
    <div aria-hidden className="flex items-end gap-3 sm:gap-4">
      <div className="relative aspect-[192/264] w-[clamp(96px,13vw,176px)] rounded-b-[8px] bg-ink">
        <span className="absolute left-1/2 top-[14%] aspect-square w-[58%] -translate-x-1/2 rounded-full border-[clamp(10px,1.3vw,16px)] border-paper" />
      </div>
      <div className="relative aspect-[128/144] w-[clamp(64px,8.6vw,116px)] rounded-[8px] bg-[#c9cde3]">
        <span className="absolute bottom-[18%] left-[18%] h-[50%] w-[11%] bg-ink" />
        <span className="absolute left-[44%] top-[20%] aspect-square w-[16%] rounded-full bg-ink" />
        <span className="absolute bottom-[18%] left-[42%] h-[9%] w-[40%] bg-ink" />
      </div>
      <div className="relative aspect-[152/192] w-[clamp(76px,10.2vw,138px)] rounded-t-[8px] bg-[#3b4170]">
        <div className="absolute inset-x-[14%] inset-y-[12%] grid grid-cols-3 place-items-center">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="aspect-square w-[42%] rounded-full bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Block({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} id={id} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function SubHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</div>
      <h3 className="mt-1.5 font-display text-[clamp(22px,2.6vw,28px)] font-bold tracking-[-0.01em] text-ink">
        {title}
      </h3>
    </div>
  );
}

export default function TypefaceStory() {
  // About renders behind a loader, so the browser's own jump to a shared
  // #typeface / #typeface-download link misses; scroll once the section exists.
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.slice(1);
    if (id === "typeface" || id === "typeface-download") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return (
    <section
      id="typeface"
      className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-[clamp(44px,6vw,84px)] sm:px-6 lg:px-8"
    >
      {/* Cover + story */}
      <Block className="overflow-hidden rounded-[26px] bg-white shadow-[0_12px_40px_rgba(26,26,26,0.07)]">
        <div className="flex flex-wrap items-end justify-between gap-8 px-[clamp(26px,4vw,48px)]">
          <div className="pb-[clamp(26px,4vw,48px)] pt-[clamp(30px,5vw,56px)]">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Our typeface</div>
            <h2 className="mt-3 font-display text-[clamp(52px,8vw,88px)] font-bold leading-[0.94] tracking-[-0.02em] text-ink">
              KBL
              <br />
              Dongne
            </h2>
            <p className="mt-4 text-[14px] text-muted">동네 · dongne — the neighborhood</p>
            <a
              href="#typeface-download"
              className="mt-5 inline-flex items-center border-b-2 border-accent pb-[3px] text-sm font-bold text-ink"
            >
              Download the font →
            </a>
          </div>
          <CoverBlocks />
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 break-keep border-t border-ink/8 px-[clamp(26px,4vw,48px)] py-[clamp(24px,3.4vw,40px)] text-[clamp(16px,1.6vw,18px)] leading-[1.7] text-[#3a3730] md:grid-cols-2">
          <p>
            <strong className="font-bold text-ink">Dongne (동네)</strong> is Korean for neighborhood —
            the alleys locals call home. In other words, local. KBL Dongne is Korea by
            Local's own Latin typeface, and every page of this site is set in it.
          </p>
          <p>
            Hunminjeongeum, the text that introduced Hangul, built its letters from heaven (·),
            earth (ㅡ) and person (ㅣ) plus a few basic shapes such as the circle (ㅇ). KBL Dongne
            builds the Latin alphabet the same way: every letter is assembled from those four parts.
          </p>
        </div>
      </Block>

      {/* The four parts */}
      <Block className="mt-[clamp(36px,5vw,56px)]">
        <SubHeading eyebrow="How it's built" title="Four parts, one alphabet" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map((p) => (
            <div key={p.kind} className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
              <div className="flex h-14 items-center">
                <PartShape kind={p.kind} />
              </div>
              <div className="mt-4 flex items-baseline gap-2 font-display text-[17px] font-bold text-ink">
                {p.name}
                <span className="text-[15px] font-normal text-muted-2">{p.jamo}</span>
              </div>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-muted">{p.role}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 items-center gap-6 rounded-[20px] bg-white p-[clamp(22px,3vw,32px)] shadow-[0_4px_16px_rgba(26,26,26,0.05)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div
            aria-hidden
            className="font-display text-[clamp(84px,12vw,148px)] font-bold leading-none tracking-[-0.01em] text-ink"
          >
            a e i t
          </div>
          <ul className="grid gap-3.5 sm:grid-cols-2">
            {DETAILS.map((d) => (
              <li key={d.lead}>
                <div className="font-display text-[16px] font-bold text-ink">{d.lead}</div>
                <p className="mt-1 text-[14px] leading-[1.55] text-muted">{d.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Block>

      {/* Specimen + character set */}
      <Block className="mt-[clamp(36px,5vw,56px)]">
        <SubHeading eyebrow="Specimen" title="Regular and Bold" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="rounded-[20px] bg-white p-[clamp(22px,3vw,32px)] text-ink shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
            {[400, 700].map((w) => (
              <div key={w} className={`${w === 700 ? "mt-6 border-t border-ink/8 pt-6 font-bold" : ""} break-words text-[clamp(22px,2.6vw,30px)] leading-[1.3]`}>
                <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">
                  {w === 400 ? "Regular · 400" : "Bold · 700"}
                </div>
                <div>ABCDEFGHIJKLM<wbr />NOPQRSTUVWXYZ</div>
                <div>abcdefghijklm<wbr />nopqrstuvwxyz</div>
                <div>0123456789 ₩ $ € & @ # % ? ! · → ←</div>
              </div>
            ))}
            <div className="mt-6 break-words border-t border-ink/8 pt-6 text-[clamp(18px,2vw,22px)] leading-[1.45]">
              <div>ÀÁÂÃÄ ÈÉÊË ÑÒÓÔÕÖ Ŏ ŏ Ŭ ŭ</div>
              <div className="text-muted">Hangŭl · Pusan · Gyeongbokgung · café</div>
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-[clamp(22px,3vw,32px)] shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">Character set</div>
            <ul className="mt-3 flex flex-col gap-2.5 text-[14.5px] leading-[1.5] text-[#3a3730]">
              {CHARSET.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span aria-hidden className="mt-[9px] h-[5px] w-[5px] flex-none rounded-full bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-5 break-keep border-t border-ink/8 pt-5 text-[14px] leading-[1.55] text-muted">
              There is no Hangul in KBL Dongne. In a sentence that mixes in Korean, the Korean is set
              in Pretendard — 현지인이 직접 쓴 가이드.
            </p>
          </div>
        </div>
      </Block>

      {/* Type scale */}
      <Block className="mt-[clamp(36px,5vw,56px)]">
        <SubHeading eyebrow="Type scale" title="Eight styles, all KBL Dongne" />
        <div className="divide-y divide-ink/8 rounded-[20px] bg-white px-[clamp(20px,3vw,32px)] shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
          {SCALE.map((s) => (
            <div key={s.name} className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-baseline md:gap-8">
              <div>
                <div className="text-[13px] font-bold text-ink">{s.name}</div>
                <div className="text-[13px] text-muted-2">{s.spec}</div>
                <div className="text-[13px] text-muted-2">{s.use}</div>
              </div>
              <div className={`min-w-0 break-words text-ink ${s.className}`}>{s.sample}</div>
            </div>
          ))}
        </div>
      </Block>

      {/* Rules */}
      <Block className="mt-[clamp(36px,5vw,56px)]">
        <SubHeading eyebrow="Rules" title="How we set KBL Dongne" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r, i) => (
            <li key={r.title} className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
                {i + 1}
              </div>
              <div className="mt-3.5 font-display text-[16px] font-bold leading-[1.3] text-ink">{r.title}</div>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-muted">{r.text}</p>
            </li>
          ))}
        </ol>
      </Block>

      {/* Download */}
      <Block id="typeface-download" className="mt-[clamp(36px,5vw,56px)] scroll-mt-24">
        <SubHeading eyebrow="Download" title="Use KBL Dongne" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-[20px] bg-white p-[clamp(22px,3vw,32px)] shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
            <p className="text-[15px] leading-[1.6] text-[#3a3730]">
              Regular and Bold in every format, with a README and the full glyph specimen.
            </p>
            <a
              href={PACKAGE.href}
              download
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" strokeWidth={2.2} />
              <span>
                Download KBL Dongne <span className="whitespace-nowrap">(.zip · {PACKAGE.size})</span>
              </span>
            </a>
            <ul className="mt-6 divide-y divide-ink/8 border-t border-ink/8">
              {FILES.map((f) => (
                <li key={f.format} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink">{f.format}</div>
                    <div className="text-[13px] text-muted">{f.label}</div>
                  </div>
                  <div className="flex gap-2">
                    {f.files.map((file) => (
                      <a
                        key={file.href}
                        href={file.href}
                        download
                        aria-label={`Download ${f.format} ${file.weight}`}
                        className="rounded-full border border-ink/15 px-3.5 py-1.5 text-[13px] font-bold text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {file.weight}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-[20px] bg-white p-[clamp(22px,3vw,32px)] shadow-[0_4px_16px_rgba(26,26,26,0.05)]">
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">Install</div>
            <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-[1.55] text-[#3a3730]">
              {INSTALL.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span aria-hidden className="mt-[8px] h-[5px] w-[5px] flex-none rounded-full bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-6 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-2">On a website</div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-[12px] bg-ink p-4 font-mono text-[12px] leading-[1.6] sm:text-[12.5px] text-white/90">
              <code>{WEB_SNIPPET}</code>
            </pre>
            <p className="mt-3 text-[13px] leading-[1.55] text-muted">
              Always set the full stack: KBL Dongne has no Hangul, so Korean falls through to Pretendard.
            </p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted-2">© 2026 Local Contents Lab (Korea By Local)</p>
      </Block>
    </section>
  );
}
