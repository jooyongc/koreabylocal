export interface SpotType {
  value: string;
  label: string;
}

export const SPOT_TYPES: SpotType[] = [
  { value: "eats", label: "Eats" },
  { value: "cafes", label: "Cafés" },
  { value: "culture", label: "Culture" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shops", label: "Shops" },
  { value: "outdoors", label: "Outdoors" },
  { value: "walks", label: "Walks" },
];
