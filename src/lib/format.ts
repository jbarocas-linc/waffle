import type { Background } from "../types";
import type { CSSProperties } from "react";

export function humanBytes(n?: number): string {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export type ParsedVideo = { provider: "youtube" | "vimeo"; id: string } | null;

export function parseVideoUrl(url: string): ParsedVideo {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (yt) return { provider: "youtube", id: yt[1] };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { provider: "vimeo", id: vimeo[1] };
  return null;
}

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const INK = "#1B1815";
const PAPER = "#FAF6EE";

/** Auto-contrast: which text color reads on this background. */
export function textOn(bg: Background): string {
  if (bg.kind === "image") return PAPER; // paired with dim overlay
  const base = bg.kind === "color" ? bg.value : bg.from;
  try {
    return hexLuminance(base) > 0.45 ? INK : PAPER;
  } catch {
    return INK;
  }
}

export function bgStyle(bg: Background): CSSProperties {
  if (bg.kind === "color") return { backgroundColor: bg.value };
  if (bg.kind === "gradient")
    return { backgroundImage: `linear-gradient(${bg.angle ?? 160}deg, ${bg.from}, ${bg.to})` };
  return { backgroundImage: `url(${bg.src})`, backgroundSize: "cover", backgroundPosition: "center" };
}

export function appOrigin(): string {
  return window.location.origin;
}

/**
 * HTML detection by extension as well as MIME: mobile file pickers tag
 * exported/shared .html files inconsistently (iOS flows sometimes mistag
 * them as text/plain; some Android/cloud-storage providers omit a MIME type
 * entirely), which is also why HTML upload inputs don't rely on the
 * `accept` attribute to gate selection — only this check does.
 */
export function isHtmlFile(f: File): boolean {
  return f.type === "text/html" || /\.html?$/i.test(f.name);
}
