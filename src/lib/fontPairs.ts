// Site-wide font pairs (from the renewal design's fontPair feature).
// Each pair sets a display face, a serif accent, and a UI/body face.
// Korean falls back to Pretendard, registered by the jsDelivr CSS as "Pretendard Variable".
export interface FontPair {
  key: string;
  label: string;
  vibe: string;
  display: string; // CSS font-family value (quoted)
  serif: string;
  body: string;
  /** Google Fonts `family=` params to load on demand (empty = already in index.html). */
  google: string[];
}

export const FONT_PAIRS: FontPair[] = [
  { key: "dongne", label: "KBL Dongne × Pretendard", vibe: "Our own typeface — Korea by Local's brand font", display: "'KBL Dongne'", serif: "'Newsreader'", body: "'KBL Dongne'", google: [] },
  { key: "modern", label: "Bricolage × Pretendard", vibe: "Modern editorial grotesque", display: "'Bricolage Grotesque'", serif: "'Newsreader'", body: "'Pretendard Variable'", google: ["Bricolage+Grotesque:opsz,wght@12..96,400..800"] },
  { key: "editorial", label: "Instrument Serif × Pretendard", vibe: "High-end magazine, literary", display: "'Instrument Serif'", serif: "'Instrument Serif'", body: "'Pretendard Variable'", google: ["Instrument+Serif:ital@0;1"] },
  { key: "contemporary", label: "Space Grotesk × Newsreader", vibe: "Techy, design-forward", display: "'Space Grotesk'", serif: "'Newsreader'", body: "'Space Grotesk'", google: ["Space+Grotesk:wght@400..700"] },
  { key: "kpop", label: "Unbounded × Pretendard", vibe: "Bold, K-culture energy", display: "'Unbounded'", serif: "'Newsreader'", body: "'Pretendard Variable'", google: ["Unbounded:wght@400..800"] },
  { key: "classic", label: "Archivo × Newsreader", vibe: "Clean, neutral, trustworthy", display: "'Archivo'", serif: "'Newsreader'", body: "'Archivo'", google: ["Archivo:wght@400..800"] },
  { key: "reader", label: "Bricolage × Lora", vibe: "Modern heads, serif reading body", display: "'Bricolage Grotesque'", serif: "'Lora'", body: "'Lora'", google: ["Bricolage+Grotesque:opsz,wght@12..96,400..800", "Lora:ital,wght@0,400..600;1,400..600"] },
  { key: "literary", label: "Spectral", vibe: "Literary, long-read magazine", display: "'Spectral'", serif: "'Spectral'", body: "'Spectral'", google: ["Spectral:ital,wght@0,300..700;1,400"] },
  { key: "highcontrast", label: "DM Serif × Pretendard", vibe: "High-contrast editorial display", display: "'DM Serif Display'", serif: "'Newsreader'", body: "'Pretendard Variable'", google: ["DM+Serif+Display:ital@0;1"] },
];

export const DEFAULT_FONT_PAIR = "dongne";

function ensureFontLink(pair: FontPair) {
  if (!pair.google.length || typeof document === "undefined") return;
  const id = `kbl-font-${pair.key}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${pair.google.map((f) => `family=${f}`).join("&")}&display=swap`;
  document.head.appendChild(link);
}

/** Load every pair's webfonts (used by the admin picker so previews are accurate). */
export function preloadAllFontPairs() {
  FONT_PAIRS.forEach((p) => ensureFontLink(p));
}

/** Apply a font pair globally by overriding the theme CSS variables on :root. */
export function applyFontPair(key: string) {
  if (typeof document === "undefined") return;
  const pair = FONT_PAIRS.find((p) => p.key === key) ?? FONT_PAIRS[0];
  ensureFontLink(pair);
  const r = document.documentElement;
  r.style.setProperty("--font-display", `${pair.display}, "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`);
  r.style.setProperty("--font-serif", `${pair.serif}, Georgia, "Times New Roman", serif`);
  r.style.setProperty("--font-sans", `${pair.body}, "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`);
}
