import type { BlogCategory } from "@/types";

/** The guidebook's categories, in the order the site shows them. */
export const BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "HOW-TO", label: "How-To" },
  { value: "LOCAL-LIFE", label: "Local Life" },
  { value: "K-CULTURE", label: "K-Culture" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
];

/** From the old site's taxonomy. Some posts still carry them, so admin can filter by them. */
export const LEGACY_BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "NEWS", label: "News (old)" },
  { value: "LOCALS", label: "Locals (old)" },
  { value: "KOREAN", label: "Korean (old)" },
];
