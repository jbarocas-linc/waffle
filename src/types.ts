export type Background =
  | { kind: "color"; value: string }
  | { kind: "gradient"; from: string; to: string; angle?: number }
  | { kind: "image"; src: string; dim?: number }; // dim = darken overlay 0–1

/** Creator-controlled styling for text on tiles (body text and image overlays). */
export interface TextStyle {
  size: "sm" | "md" | "lg" | "xl";
  weight: "normal" | "bold";
  italic: boolean;
  align: "left" | "center" | "right";
  color: string;
  bg: "none" | "scrim" | "solid"; // legibility layer behind the text
  bgColor?: string; // used when bg === "solid"
  tracking: "normal" | "wide" | "wider";
}

export type Tile =
  | { type: "text"; title?: string; body: string; bg: Background; style?: TextStyle }
  | {
      type: "image";
      src: string;
      caption?: string;
      overlayText?: string;
      overlayStyle?: TextStyle;
      alt?: string;
    }
  | { type: "video"; source: "youtube" | "vimeo" | "upload"; url: string; caption?: string }
  | { type: "gif"; source: "upload" | "url"; url: string; caption?: string }
  | { type: "link"; url: string; title: string; description?: string; thumbnail?: string; buttonLabel?: string }
  | { type: "file"; src: string; filename: string; label: string; sizeBytes?: number }
  | { type: "embed"; source: "upload" | "snippet"; html?: string; src?: string; label?: string };

export type TileType = Tile["type"];

export type GridSize = 2 | 3 | 4;

export interface GridRecord {
  id: string;
  viewId: string;
  editToken: string;
  title: string;
  description: string | null;
  size: GridSize;
  startCell: number;
  rowLabels: (string | null)[] | null;
  colLabels: (string | null)[] | null;
  cells: (Tile | null)[];
  coverUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the viewer path is allowed to see — never includes the edit token. */
export type PublicGrid = Omit<GridRecord, "editToken">;

export interface CreateGridInput {
  title: string;
  description?: string | null;
  size: GridSize;
  cells?: (Tile | null)[];
  rowLabels?: (string | null)[] | null;
  colLabels?: (string | null)[] | null;
  startCell?: number;
}

export type GridPatch = Partial<
  Pick<
    GridRecord,
    "title" | "description" | "startCell" | "rowLabels" | "colLabels" | "cells" | "published" | "coverUrl"
  >
>;

/** AI "Draft my grid" proposal shape returned by /api/draft-grid */
export interface DraftProposal {
  rowLabels: string[] | null;
  colLabels: string[] | null;
  startCell: number;
  cells: ({ title: string; brief: string } | null)[];
}

/** Default start = center for odd sizes; inner cell closest to center for even. */
export function defaultStartCell(size: GridSize): number {
  if (size % 2 === 1) return Math.floor((size * size) / 2);
  return (size / 2) * size + size / 2;
}
