export interface SpotType {
  value: string;
  label: string;
  emoji: string;
}

export const SPOT_TYPES: SpotType[] = [
  { value: "eats", label: "Eats", emoji: "🍜" },
  { value: "cafes", label: "Cafés", emoji: "☕" },
  { value: "culture", label: "Culture", emoji: "🎨" },
  { value: "nightlife", label: "Nightlife", emoji: "🎵" },
  { value: "shops", label: "Shops", emoji: "🛍" },
  { value: "outdoors", label: "Outdoors", emoji: "🌿" },
  { value: "walks", label: "Walks", emoji: "🚶" },
];
