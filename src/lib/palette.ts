import type { Background } from "../types";

/** 8 curated tile colors — warm, editorial, all sit well together. */
export const TILE_COLORS = [
  "#F6EEDF", // cream
  "#EFD9B4", // wheat
  "#E7BFA6", // clay
  "#D9CBE3", // lilac
  "#C9D8C5", // sage
  "#A9C0CE", // mist
  "#2E4036", // deep pine
  "#26222F", // deep plum
] as const;

/** 6 curated gradients. */
export const TILE_GRADIENTS: { from: string; to: string; angle: number }[] = [
  { from: "#F6EEDF", to: "#E7BFA6", angle: 160 },
  { from: "#F1D9A7", to: "#DE8B5F", angle: 150 },
  { from: "#D9CBE3", to: "#A9C0CE", angle: 160 },
  { from: "#C9D8C5", to: "#7FA08C", angle: 160 },
  { from: "#2E4036", to: "#1E2A22", angle: 165 },
  { from: "#3C2E45", to: "#26222F", angle: 160 },
];

/** A pleasant default rotation of backgrounds for AI-drafted / new text tiles. */
export function curatedBg(i: number): Background {
  const rotation: Background[] = [
    { kind: "color", value: TILE_COLORS[0] },
    { kind: "gradient", ...TILE_GRADIENTS[1] },
    { kind: "color", value: TILE_COLORS[4] },
    { kind: "color", value: TILE_COLORS[3] },
    { kind: "gradient", ...TILE_GRADIENTS[4] },
    { kind: "color", value: TILE_COLORS[1] },
    { kind: "gradient", ...TILE_GRADIENTS[2] },
    { kind: "color", value: TILE_COLORS[2] },
    { kind: "color", value: TILE_COLORS[6] },
  ];
  return rotation[i % rotation.length];
}
