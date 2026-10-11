import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Search, X } from "lucide-react";
import { GLOSSARY } from "./glossary";
import type { Part } from "./summary";

/** "GA4 용어 쉽게 보기": every term on the page, in plain Korean. */
export function GlossaryDrawer({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const needle = q.trim().toLowerCase();
  const terms = GLOSSARY.filter((t) => !needle || `${t.term} ${t.ga} ${t.short} ${t.long}`.toLowerCase().includes(needle));

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="GA4 용어 사전">
      <button type="button" aria-label="닫기" onClick={onClose} className="ga-fade absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
      <div className="ga-slide-in relative flex h-full w-full max-w-[560px] flex-col bg-[#f7f7f5] shadow-2xl">
        <header className="border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent"><BookOpen className="h-3.5 w-3.5" /> GA4 용어 쉽게 보기</p>
              <h2 className="mt-1 text-[17px] font-bold text-primary">이 화면의 숫자, 무슨 뜻일까요?</h2>
              <p className="mt-1 text-[12px] text-gray-500">괄호 안 영어는 GA4 화면에서 같은 항목을 찾을 때 쓰는 이름입니다.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="용어 사전 닫기">
              <X className="h-5 w-5" />
            </button>
          </div>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="용어 찾기 (예: 참여율, 세션, UTM)"
              className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-[12.5px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </header>
        <ul className="flex-1 space-y-3 overflow-y-auto p-5">
          {terms.map((t, i) => (
            <li key={t.key} className="ga-rise rounded-2xl border border-gray-200/80 bg-white p-4" style={{ ["--i" as string]: Math.min(i, 8) }}>
              <h3 className="text-[14px] font-bold text-primary">
                {t.term} <span className="ml-1 text-[11px] font-medium text-gray-400">{t.ga}</span>
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-700">{t.long}</p>
              {t.use && (
                <p className="mt-2 rounded-lg bg-pink-50/70 px-3 py-2 text-[12px] leading-relaxed text-gray-700">
                  <strong className="font-semibold text-pink-800">활용: </strong>{t.use}
                </p>
              )}
            </li>
          ))}
          {terms.length === 0 && <li className="py-8 text-center text-[12px] text-gray-400">찾는 용어가 없습니다.</li>}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

/** The "한눈에 보기" sentences, numbers in bold. */
export function SummaryText({ lines }: { lines: Part[][] }) {
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="ga-rise flex gap-2 text-[13.5px] leading-relaxed text-gray-700" style={{ ["--i" as string]: i }}>
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          <span>
            {line.map((p, k) => (typeof p === "string" ? <span key={k}>{p}</span> : <strong key={k} className="font-semibold text-primary">{p.b}</strong>))}
          </span>
        </li>
      ))}
    </ul>
  );
}
