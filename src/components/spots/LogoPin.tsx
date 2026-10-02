const PINK = "#FF33CD"; // the logo symbol's pink

/**
 * Map pin made from the official logo symbol (the pink "LO" with the smile,
 * public/map-pin-symbol.png, cut from the brand folder's KoreabyLocal_fabicon
 * .png) on a white tile, with a pink tail whose tip marks the spot. The tip is
 * the bottom centre, which is where an AdvancedMarker anchors custom content.
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
      <div className="rounded-[12px] bg-white p-[3px]" style={{ boxShadow: `0 0 0 2px ${PINK}` }}>
        <img src="/map-pin-symbol.png" width={38} height={38} alt="" draggable={false} className="block rounded-[9px]" />
      </div>
      <svg width="14" height="9" viewBox="0 0 14 9" aria-hidden className="-mt-px block">
        <path d="M0 0h14L7 9z" fill={PINK} />
      </svg>
    </div>
  );
}
