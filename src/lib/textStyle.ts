import type { CSSProperties } from "react";
import type { Background, TextStyle } from "../types";
import { textOn } from "./format";

/** Default look for image-tile overlay text — matches the original hardcoded style. */
export const DEFAULT_OVERLAY_STYLE: TextStyle = {
  size: "lg",
  weight: "bold",
  italic: false,
  align: "center",
  color: "#FFFFFF",
  bg: "none",
  tracking: "normal",
};

/** Default look for a text tile's body — auto-contrasts against the tile background. */
export function defaultBodyStyle(bg: Background): TextStyle {
  return {
    size: "md",
    weight: "normal",
    italic: false,
    align: "left",
    color: textOn(bg),
    bg: "none",
    tracking: "normal",
  };
}

/** Curated text colors: white/black pairs + brand-warm accents. */
export const TEXT_COLORS: { value: string; label: string }[] = [
  { value: "#FFFFFF", label: "White" },
  { value: "#F4F1EA", label: "Near-white" },
  { value: "#111111", label: "Black" },
  { value: "#2B211A", label: "Near-black" },
  { value: "#EE9E31", label: "Amber" },
  { value: "#A9690F", label: "Toast" },
  { value: "#D98F58", label: "Crust" },
  { value: "#EFD9B4", label: "Wheat" },
  { value: "#C9D8C5", label: "Sage" },
  { value: "#A9C0CE", label: "Mist" },
];

export const TEXT_BG_COLORS = ["#000000", "#FFFFFF", "#2B211A", "#EE9E31"];

const SIZE_REM: Record<TextStyle["size"], string> = {
  sm: "1.375rem",
  md: "2rem",
  lg: "3rem",
  xl: "4.25rem",
};

const TRACKING_EM: Record<TextStyle["tracking"], string> = {
  normal: "normal",
  wide: "0.04em",
  wider: "0.15em",
};

export function textStyleCss(style: TextStyle): CSSProperties {
  return {
    fontSize: SIZE_REM[style.size],
    fontWeight: style.weight === "bold" ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textAlign: style.align,
    color: style.color,
    letterSpacing: TRACKING_EM[style.tracking],
    lineHeight: 1.15,
    // A soft shadow keeps unbacked text readable over busy media; when a
    // scrim/chip is behind the text, the shadow just muddies it.
    textShadow: style.bg === "none" ? "0 2px 10px rgba(0,0,0,0.35)" : undefined,
  };
}

/** The legibility layer behind the text (nothing / soft scrim / solid chip). */
export function textWrapperCss(style: TextStyle): CSSProperties {
  if (style.bg === "none") return {};
  if (style.bg === "scrim") {
    return {
      backgroundColor: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(3px)",
      WebkitBackdropFilter: "blur(3px)",
      padding: "0.5rem 1.25rem",
      borderRadius: "1rem",
    };
  }
  return {
    backgroundColor: style.bgColor || "#000000",
    padding: "0.5rem 1.25rem",
    borderRadius: "1rem",
  };
}
