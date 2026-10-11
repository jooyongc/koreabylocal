// Number, date and domain helpers shared by the analytics page.

export const nf = new Intl.NumberFormat("en-US");
const cf = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 / 12.9K — compact from ten thousand up, exact below. */
export const fmtNum = (n: number) => (Math.abs(n) >= 10_000 ? cf.format(n) : nf.format(Math.round(n)));
export const fmtCompact = (n: number) => (Math.abs(n) >= 1000 ? cf.format(n) : nf.format(Math.round(n)));

export const fmtPct = (ratio: number, digits = 1) =>
  Number.isFinite(ratio) ? `${(ratio * 100).toFixed(digits)}%` : "—";

export function fmtDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** a / b, or 0 when there is nothing to divide by. */
export const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "2026-10-11" or "20261011" → "Oct 11". */
export function fmtDay(date: string, withYear = false) {
  const d = date.replaceAll("-", "");
  const label = `${MONTHS[Number(d.slice(4, 6)) - 1]} ${Number(d.slice(6, 8))}`;
  return withYear ? `${label}, ${d.slice(0, 4)}` : label;
}

export function fmtRange(start: string, end: string) {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmtDay(start, !sameYear)} – ${fmtDay(end, true)}`;
}

export const toIsoDate = (d: string) => (d.includes("-") ? d : `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);

export function addDaysIso(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── change vs the comparison period ──────────────────────────────────────

export type Change =
  | { kind: "none" }              // no comparison period
  | { kind: "new" }               // nothing before — a percentage would be meaningless
  | { kind: "flat" }
  | { kind: "change"; ratio: number };

/**
 * A previous value this small next to the current one says "tracking only
 * just started", not "+19,000%". Below the floor the change reads as "new".
 */
export function change(cur: number, prev: number | null | undefined): Change {
  if (prev == null) return { kind: "none" };
  if (prev <= 0 || (prev < 10 && cur > prev * 5)) return cur > 0 ? { kind: "new" } : { kind: "flat" };
  const r = (cur - prev) / prev;
  if (Math.abs(r) < 0.005) return { kind: "flat" };
  return { kind: "change", ratio: r };
}

export function fmtChange(c: Change) {
  switch (c.kind) {
    case "none": return "";
    case "new": return "new";
    case "flat": return "±0%";
    case "change":
      if (c.ratio >= 3) return `×${(1 + c.ratio).toFixed(1)}`;
      return `${c.ratio > 0 ? "+" : ""}${(c.ratio * 100).toFixed(c.ratio > -0.1 && c.ratio < 0.1 ? 1 : 0)}%`;
  }
}

// ── geography ────────────────────────────────────────────────────────────

/** "KR" → 🇰🇷 */
export function flag(countryId: string) {
  if (!/^[A-Z]{2}$/.test(countryId)) return "🌐";
  return String.fromCodePoint(...[...countryId].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// ── site structure ───────────────────────────────────────────────────────

const SECTIONS: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: "Home", test: (p) => p === "/" },
  { label: "Travel guides", test: (p) => p.startsWith("/guidebook") || p.startsWith("/blog") },
  { label: "Where to Stay", test: (p) => p.startsWith("/where-to-stay") },
  { label: "Things to Do", test: (p) => p.startsWith("/things-to-do") || p.startsWith("/spots") || p.startsWith("/experiences") },
  { label: "Destinations", test: (p) => p.startsWith("/destinations") },
  { label: "Ask a Local", test: (p) => p.startsWith("/ask-a-local") },
  { label: "E-book & shop", test: (p) => /^\/(ebook|shop|product|cart|checkout|order)/.test(p) },
  { label: "Tours & events", test: (p) => /^\/(tours|events|transfers|getting-there)/.test(p) },
  { label: "Account & legal", test: (p) => /^\/(login|signup|account|about|privacy|terms|forgot-password|reset-password|unsubscribe|contact)/.test(p) },
];

export function sectionOf(path: string) {
  return SECTIONS.find((s) => s.test(path))?.label ?? "Other";
}

/** GA4 keeps the 404 page's title on the broken URL — that is how broken links show up. */
export const isBrokenTitle = (title: string) => /\b404\b|not found/i.test(title);

/**
 * The old imweb site logged its search state as base64 PHP blobs
 * ("YToxOntz…"). They are not things anyone typed.
 */
export const isJunkSearch = (term: string) => !/\s/.test(term) && term.length >= 24 && /^[A-Za-z0-9+/=]+$/.test(term);

// ── outbound links ───────────────────────────────────────────────────────

const PARTNERS: Array<{ name: string; test: RegExp }> = [
  { name: "Expedia", test: /(^|\.)expedia\./ },
  { name: "Hotels.com", test: /(^|\.)hotels\.com$/ },
  { name: "Trip.com", test: /(^|\.)trip\.com$/ },
  { name: "Agoda", test: /(^|\.)agoda\./ },
  { name: "Booking.com", test: /(^|\.)booking\.com$/ },
  { name: "Klook", test: /(^|\.)klook\.com$/ },
  { name: "Olive Young", test: /oliveyoung/ },
];

/** The affiliate programme a link domain belongs to, or null for any other site. */
export const partnerOf = (domain: string) => PARTNERS.find((p) => p.test.test(domain.toLowerCase()))?.name ?? null;

// Fixed per programme (never by rank), in palette order so neighbours stay distinguishable.
const PARTNER_ORDER = ["Expedia", "Trip.com", "Agoda", "Hotels.com", "Booking.com", "Klook", "Olive Young"];
export const partnerRank = (name: string) => {
  const i = PARTNER_ORDER.indexOf(name);
  return i >= 0 ? i : PARTNER_ORDER.length;
};
export const partnerColor = (name: string) => SERIES[partnerRank(name)] ?? "#c9c7bf";

// ── colors (validated with the dataviz palette checker, light surface #fff) ──

export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export const COMPARE = "#b9b7ae"; // the comparison period: present, recessive
export const OTHER = "#c9c7bf";
export const INK = "#12184a";
export const GOOD = "#006300";
export const BAD = "#d03b3b";

/** Single-hue blue ramp, light → dark, for magnitude (heatmap, retention). */
export const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
export const RAMP_ZERO = "#f3f4f6";

export function rampColor(t: number) {
  if (!(t > 0)) return RAMP_ZERO;
  return RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
}

/** Text on a ramp cell: ink on the light steps, white on the dark ones. */
export const onRamp = (t: number) => (t > 0 && Math.floor(t * RAMP.length) >= 3 ? "#ffffff" : INK);

// Colors follow the channel, never its rank, so a filter never repaints them.
const CHANNEL_ORDER = [
  "Organic Search", "Direct", "Organic Social", "Referral",
  "Unassigned", "Organic Video", "AI Assistant", "Email",
];
export const channelColor = (name: string) => {
  const i = CHANNEL_ORDER.indexOf(name);
  return i >= 0 ? SERIES[i] : OTHER;
};
export const channelRank = (name: string) => {
  const i = CHANNEL_ORDER.indexOf(name);
  return i >= 0 ? i : CHANNEL_ORDER.length;
};

const DEVICE_ORDER = ["mobile", "desktop", "tablet", "smart tv"];
export const deviceColor = (d: string) => {
  const i = DEVICE_ORDER.indexOf(d.toLowerCase());
  return i >= 0 && i < 3 ? SERIES[i] : OTHER;
};

// ── export ───────────────────────────────────────────────────────────────

export function toCsv(rows: Array<Record<string, unknown>>, columns: Array<{ key: string; label: string; value?: (r: never) => unknown }>) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(c.value ? c.value(r as never) : r[c.key])).join(","));
  return [head, ...body].join("\n");
}

export function download(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿", text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Round a max up to a clean axis top (1, 2, 2.5, 5 × 10ⁿ). */
export function niceMax(max: number) {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}
