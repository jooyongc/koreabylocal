// Number, date and domain helpers shared by the analytics page.

export const nf = new Intl.NumberFormat("ko-KR");
const cf = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 / 1.3만 — compact from ten thousand up, exact below. */
export const fmtNum = (n: number) => (Math.abs(n) >= 10_000 ? cf.format(n) : nf.format(Math.round(n)));
export const fmtCompact = (n: number) => (Math.abs(n) >= 1000 ? cf.format(n) : nf.format(Math.round(n)));

export const fmtPct = (ratio: number, digits = 1) =>
  Number.isFinite(ratio) ? `${(ratio * 100).toFixed(digits)}%` : "—";

export function fmtDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0초";
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}분 ${String(s).padStart(2, "0")}초`;
  return `${Math.floor(m / 60)}시간 ${String(m % 60).padStart(2, "0")}분`;
}

/** a / b, or 0 when there is nothing to divide by. */
export const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

/** "2026-10-11" or "20261011" → "10월 11일" (or "2026년 10월 11일"). */
export function fmtDay(date: string, withYear = false) {
  const d = date.replaceAll("-", "");
  const label = `${Number(d.slice(4, 6))}월 ${Number(d.slice(6, 8))}일`;
  return withYear ? `${d.slice(0, 4)}년 ${label}` : label;
}

/** "2026년 9월 14일 ~ 10월 11일" */
export function fmtRange(start: string, end: string) {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmtDay(start, true)} ~ ${fmtDay(end, !sameYear)}`;
}

export const toIsoDate = (d: string) => (d.includes("-") ? d : `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);

/** Today's date (YYYY-MM-DD) in a time zone — GA4's "today" is the property's. */
export function todayIn(tz: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

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
    case "new": return "신규";
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
  { label: "홈", test: (p) => p === "/" },
  { label: "여행 가이드", test: (p) => p.startsWith("/guidebook") || p.startsWith("/blog") },
  { label: "숙소 (Where to Stay)", test: (p) => p.startsWith("/where-to-stay") },
  { label: "즐길거리", test: (p) => p.startsWith("/things-to-do") || p.startsWith("/spots") || p.startsWith("/experiences") },
  { label: "지역 소개", test: (p) => p.startsWith("/destinations") },
  { label: "Ask a Local", test: (p) => p.startsWith("/ask-a-local") },
  { label: "전자책·상점", test: (p) => /^\/(ebook|shop|product|cart|checkout|order)/.test(p) },
  { label: "투어·이벤트", test: (p) => /^\/(tours|events|transfers|getting-there)/.test(p) },
  { label: "계정·약관", test: (p) => /^\/(login|signup|account|about|privacy|terms|forgot-password|reset-password|unsubscribe|contact)/.test(p) },
];

export function sectionOf(path: string) {
  return SECTIONS.find((s) => s.test(path))?.label ?? "기타";
}

/** GA4 keeps the 404 page's title on the broken URL — that is how broken links show up. */
export const isBrokenTitle = (title: string) => /\b404\b|not found/i.test(title);

/**
 * The old imweb site logged its search state as base64 PHP blobs
 * ("YToxOntz…"). They are not things anyone typed.
 */
export const isJunkSearch = (term: string) => !/\s/.test(term) && term.length >= 24 && /^[A-Za-z0-9+/=]+$/.test(term);

// ── Korean names for what GA4 reports in English ─────────────────────────
// GA4's own name stays available (title attributes) so it can be matched
// against the GA4 console.

const CHANNEL_KO: Record<string, string> = {
  "Organic Search": "검색 (구글·빙 등)",
  "Direct": "직접 방문",
  "Organic Social": "SNS (인스타·페북 등)",
  "Referral": "다른 사이트 링크",
  "Unassigned": "분류 안 됨",
  "Organic Video": "동영상 (유튜브 등)",
  "AI Assistant": "AI 챗봇 (ChatGPT 등)",
  "Email": "이메일",
  "Paid Search": "검색 광고",
  "Paid Social": "SNS 광고",
  "Display": "배너 광고",
  "Affiliates": "제휴 사이트",
  "Organic Shopping": "쇼핑 검색",
  "Cross-network": "구글 통합 광고",
  "SMS": "문자",
  "Mobile Push Notifications": "앱 푸시",
};
export const channelKo = (name: string) => CHANNEL_KO[name] ?? name;

const DEVICE_KO: Record<string, string> = { mobile: "모바일", desktop: "PC", tablet: "태블릿", "smart tv": "스마트 TV" };
export const deviceKo = (d: string) => DEVICE_KO[d.toLowerCase()] ?? d;

export const userTypeKo = (t: string) => (t === "new" ? "처음 온 사람" : t === "returning" ? "다시 온 사람" : t);

let regionNames: Intl.DisplayNames | null = null;
/** "KR" → "대한민국"; falls back to GA4's English name. */
export function countryKo(countryId: string, english: string) {
  try {
    regionNames ??= new Intl.DisplayNames(["ko"], { type: "region" });
    return /^[A-Z]{2}$/.test(countryId) ? regionNames.of(countryId) ?? english : english;
  } catch {
    return english;
  }
}

const EVENT_KO: Record<string, string> = {
  page_view: "페이지 조회",
  session_start: "방문 시작",
  first_visit: "첫 방문",
  user_engagement: "페이지에 머무름",
  scroll: "끝까지 스크롤 (90%)",
  click: "외부 사이트 링크 클릭",
  view_search_results: "사이트 검색",
  form_start: "입력 양식 작성 시작",
  form_submit: "입력 양식 제출",
  affiliate_click: "예약 버튼 클릭 (Where to Stay)",
  view_item: "상품 보기",
  video_start: "영상 재생 시작",
  video_progress: "영상 시청 진행",
  video_complete: "영상 끝까지 시청",
  file_download: "파일 다운로드",
  purchase: "구매",
};
export const eventKo = (name: string) => EVENT_KO[name] ?? null;

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
