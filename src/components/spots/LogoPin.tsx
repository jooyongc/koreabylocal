import pin from "@/assets/map-pin.png";

/**
 * The brand map pin — a pink drop with the "LO" symbol in a white circle —
 * exactly as designed (src/assets/map-pin.png, scaled to 3x from the
 * 7502x12187 original; imported so its URL is content-hashed). Its tip sits
 * at the bottom centre of the image, which is where an AdvancedMarker anchors
 * custom content.
 */
export default function LogoPin({ active = false }: { active?: boolean }) {
  return (
    <img
      src={pin}
      width={33}
      height={54}
      alt=""
      draggable={false}
      className="block transition-transform duration-200"
      style={{
        transform: active ? "scale(1.25)" : undefined,
        transformOrigin: "bottom center",
        filter: `drop-shadow(0 ${active ? 6 : 3}px ${active ? 7 : 4}px rgba(18, 24, 74, ${active ? 0.4 : 0.3}))`,
      }}
    />
  );
}
