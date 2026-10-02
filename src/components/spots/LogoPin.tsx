/**
 * Map pin drawn from the logo's pink mark: the "LO" with the smile under it,
 * in white on a #FF33CD drop. Anchored at its tip (bottom centre), which is
 * where an AdvancedMarker puts custom content by default.
 */
export default function LogoPin({ active = false }: { active?: boolean }) {
  const size = active ? 1.3 : 1;
  return (
    <svg
      viewBox="0 0 40 52"
      width={40 * size}
      height={52 * size}
      aria-hidden
      className="block transition-[width,height] duration-200"
      style={{ filter: `drop-shadow(0 ${active ? 6 : 3}px ${active ? 8 : 4}px rgba(18, 24, 74, ${active ? 0.45 : 0.3}))` }}
    >
      <path
        d="M20 50.5c-1-2.6-6.4-9.9-11.4-16.1A18 18 0 1 1 31.4 34.4C26.4 40.6 21 47.9 20 50.5z"
        fill="#FF33CD"
        stroke="#fff"
        strokeWidth={active ? 2.6 : 2}
      />
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <path d="M12.6 9.5v13.6h5.4" strokeWidth="3.4" strokeLinejoin="round" />
        <circle cx="25.6" cy="16.6" r="5.6" strokeWidth="3.4" />
        <path d="M12.4 27.6c4.6 4.4 10.6 4.4 15.2 0" strokeWidth="3" />
      </g>
    </svg>
  );
}
