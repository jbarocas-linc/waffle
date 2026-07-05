import waffleMarkSrc from "../assets/waffle-mark.png";
import waffleLogoSrc from "../assets/waffle-logo.png";

/**
 * The brand assets, both cropped from the source lockup PNG
 * (src/assets/waffle-logo-original.png) with its flat cream background
 * keyed to transparent so they drop cleanly onto light or dark surfaces.
 *
 * - WaffleMark: icon only — square, for compact spots (nav/header, favicons,
 *   the dark viewer intro screen).
 * - WaffleLogo: the full icon + wordmark lockup — for spacious brand
 *   moments (landing hero).
 *
 * Both are real (2000px-source) raster images, not SVG, so they render
 * crisply at any size up to that source resolution — far beyond anything
 * used in this app.
 */
export function WaffleMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={waffleMarkSrc}
      alt="Waffle"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function WaffleLogo({ width = 220, className = "" }: { width?: number; className?: string }) {
  return (
    <img
      src={waffleLogoSrc}
      alt="Waffle"
      width={width}
      className={className}
      style={{ width, height: "auto" }}
    />
  );
}

/** The lowercase text wordmark, for pairing with WaffleMark in tight nav rows. */
export function WaffleWordmark({ className = "" }: { className?: string }) {
  return <span className={`font-logo font-bold lowercase text-accent ${className}`}>waffle</span>;
}
