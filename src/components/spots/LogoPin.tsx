const PINK = "#FC33D4"; // the round symbol's pink

/**
 * Map pin made from the brand's round symbol — white "LO" and smile on a pink
 * disc (public/map-pin-symbol.png, scaled from the 16384 px original) — with a
 * thin white ring to lift it off the grey map and a pink tail whose tip marks
 * the spot. The tip is the bottom centre, where an AdvancedMarker anchors
 * custom content.
 */
export default function LogoPin({ active = false }: { active?: boolean }) {
  return (
    <div
      className="flex flex-col items-center transition-transform duration-200"
      style={{
        transform: active ? "scale(1.25)" : undefined,
        transformOrigin: "bottom center",
        filter: `drop-shadow(0 ${active ? 6 : 3}px ${active ? 8 : 4}px rgba(18, 24, 74, ${active ? 0.4 : 0.28}))`,
      }}
    >
      <img
        src="/map-pin-symbol.png"
        width={44}
        height={44}
        alt=""
        draggable={false}
        className="block rounded-full"
        style={{ boxShadow: "0 0 0 2.5px #fff" }}
      />
      {/* Tucked under the disc so the pink joins it over the white ring. */}
      <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden className="-mt-[3px] block">
        <path d="M0 0h14L7 10z" fill={PINK} />
      </svg>
    </div>
  );
}
