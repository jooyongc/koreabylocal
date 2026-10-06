import pin from "@/assets/map-pin.png";
import pinActive from "@/assets/map-pin-active.png";

/**
 * The brand map pins, exactly as designed (scaled to 3x; imported so their
 * URLs are content-hashed):
 *  - map-pin.png — pink drop, "LO" symbol in a white circle. The default:
 *    it carries the only colour on the monochrome map.
 *  - map-pin-active.png — the inverse, white drop with a pink circle. Shown
 *    for the spot whose card is hovered or whose pin was clicked.
 * The tip is the image's bottom centre, where an AdvancedMarker anchors.
 */
export default function LogoPin({ active = false }: { active?: boolean }) {
  return (
    <img
      src={active ? pinActive : pin}
      width={33}
      height={54}
      alt=""
      draggable={false}
      className="block transition-transform duration-200"
      style={{
        transform: active ? "scale(1.2)" : undefined,
        transformOrigin: "bottom center",
        filter: `drop-shadow(0 ${active ? 6 : 3}px ${active ? 7 : 4}px rgba(18, 24, 74, ${active ? 0.45 : 0.3}))`,
      }}
    />
  );
}
