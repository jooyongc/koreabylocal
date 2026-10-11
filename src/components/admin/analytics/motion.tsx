import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "./hooks";

/**
 * Motion for the analytics page: panels rise in, lines draw, bars grow,
 * numbers count up, the live dot breathes. Everything here switches off under
 * prefers-reduced-motion — the numbers simply appear.
 */
export function AnalyticsMotionStyles() {
  return (
    <style>{`
@keyframes ga-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes ga-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ga-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ga-grow-y { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes ga-grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes ga-pop { from { opacity: 0; transform: scale(.4) } to { opacity: 1; transform: scale(1) } }
@keyframes ga-pulse { 0% { transform: scale(1); opacity: .55 } 100% { transform: scale(2.6); opacity: 0 } }
@keyframes ga-slide-in { from { transform: translateX(100%) } to { transform: none } }
@keyframes ga-shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
.ga-rise { animation: ga-rise .55s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--i, 0) * 55ms) }
.ga-fade { animation: ga-fade .5s ease-out both; animation-delay: calc(var(--i, 0) * 40ms) }
.ga-draw { stroke-dasharray: 1; animation: ga-draw 1.1s cubic-bezier(.3,.7,.2,1) both }
.ga-grow-y { transform-box: fill-box; transform-origin: bottom; animation: ga-grow-y .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 14ms) }
.ga-grow-x { transform-origin: left; animation: ga-grow-x .8s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 45ms) }
.ga-pop { transform-box: fill-box; transform-origin: center; animation: ga-pop .45s cubic-bezier(.2,.9,.3,1.3) both; animation-delay: calc(var(--i, 0) * 12ms) }
.ga-pulse { animation: ga-pulse 1.8s ease-out infinite }
.ga-slide-in { animation: ga-slide-in .35s cubic-bezier(.2,.8,.2,1) both }
.ga-shimmer { background: linear-gradient(90deg, #f3f4f6 0%, #e9eaee 50%, #f3f4f6 100%); background-size: 200% 100%; animation: ga-shimmer 1.4s linear infinite }
.ga-tabular { font-variant-numeric: tabular-nums }
@media (prefers-reduced-motion: reduce) {
  .ga-rise, .ga-fade, .ga-draw, .ga-grow-y, .ga-grow-x, .ga-pop, .ga-slide-in { animation: none !important }
  .ga-pulse, .ga-shimmer { animation: none !important }
}
`}</style>
  );
}

/** Counts from the last shown value to the new one (ease-out, ~0.9 s). */
export function CountUp({ value, format, duration = 900 }: { value: number; format: (n: number) => string; duration?: number }) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - k) ** 3;
      setShown(a + (value - a) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration, reduce]);

  return <>{format(reduce ? value : shown)}</>;
}

/** A block that rises in; `i` staggers siblings. */
export function Reveal({ i = 0, className = "", children }: { i?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`ga-rise ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}
