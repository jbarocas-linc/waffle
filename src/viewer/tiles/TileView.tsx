import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Play, Volume2, VolumeX } from "lucide-react";
import type { Tile } from "../../types";
import { bgStyle, humanBytes, parseVideoUrl, textOn } from "../../lib/format";
import { DEFAULT_OVERLAY_STYLE, textStyleCss, textWrapperCss } from "../../lib/textStyle";

export function TileView({ tile, active }: { tile: Tile; active: boolean }) {
  switch (tile.type) {
    case "text":
      return <TextTile tile={tile} />;
    case "image":
      return <ImageTile tile={tile} />;
    case "video":
      return <VideoTile tile={tile} active={active} />;
    case "gif":
      return <GifTile tile={tile} />;
    case "link":
      return <LinkTile tile={tile} />;
    case "file":
      return <FileTile tile={tile} />;
    case "embed":
      return <EmbedTile tile={tile} active={active} />;
  }
}

/**
 * Interactive iframes swallow touch events. These slim strips along each edge
 * belong to the grid's gesture system, so the viewer can always swipe away.
 */
export function EdgeGrabZones() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute inset-y-0 left-0 w-6 cursor-grab" />
      <div className="pointer-events-auto absolute inset-y-0 right-0 w-6 cursor-grab" />
      <div className="pointer-events-auto absolute inset-x-0 top-0 h-6 cursor-grab" />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 h-6 cursor-grab" />
    </div>
  );
}

function CaptionScrim({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/75 via-black/40 to-transparent px-6 pb-8 pt-14">
      <p className="text-base font-medium leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {text}
      </p>
    </div>
  );
}

// --- text -------------------------------------------------------------------

function TextTile({ tile }: { tile: Extract<Tile, { type: "text" }> }) {
  const color = textOn(tile.bg);
  const isImage = tile.bg.kind === "image";
  return (
    <div className="relative flex h-full w-full items-center" style={bgStyle(tile.bg)}>
      {isImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${tile.bg.kind === "image" ? tile.bg.dim ?? 0.4 : 0})` }}
        />
      )}
      <div className="relative z-[2] w-full px-8 pb-16 pt-10" style={{ color }}>
        {tile.title && (
          <h2 className="mb-5 font-display text-4xl font-semibold leading-[1.08] [text-wrap:balance]">
            {tile.title}
          </h2>
        )}
        {tile.style ? (
          <p
            className="inline-block max-w-[36ch] whitespace-pre-wrap"
            style={{ ...textStyleCss(tile.style), ...textWrapperCss(tile.style) }}
          >
            {tile.body}
          </p>
        ) : (
          <p className="max-w-[36ch] whitespace-pre-wrap text-lg leading-relaxed opacity-95">
            {tile.body}
          </p>
        )}
      </div>
    </div>
  );
}

// --- image ------------------------------------------------------------------

function ImageTile({ tile }: { tile: Extract<Tile, { type: "image" }> }) {
  const overlayStyle = tile.overlayStyle ?? DEFAULT_OVERLAY_STYLE;
  return (
    // Letterbox/pillarbox: contain the full image, black bars fill the rest.
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <img
        src={tile.src}
        alt={tile.alt ?? tile.caption ?? ""}
        className="h-full w-full object-contain"
        draggable={false}
      />
      {tile.overlayText && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center px-8">
          <p
            className="max-w-[85%] [text-wrap:balance]"
            style={{ ...textStyleCss(overlayStyle), ...textWrapperCss(overlayStyle) }}
          >
            {tile.overlayText}
          </p>
        </div>
      )}
      <CaptionScrim text={tile.caption} />
    </div>
  );
}

// --- video ------------------------------------------------------------------

function VideoTile({ tile, active }: { tile: Extract<Tile, { type: "video" }>; active: boolean }) {
  const parsed = tile.source === "upload" ? null : parseVideoUrl(tile.url);

  if (tile.source === "upload" || !parsed) {
    return <UploadVideoTile tile={tile} active={active} />;
  }
  return <EmbedVideoTile parsed={parsed} caption={tile.caption} active={active} />;
}

function UploadVideoTile({
  tile,
  active,
}: {
  tile: Extract<Tile, { type: "video" }>;
  active: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Uploaded clips are always ≤10s (trimmed/compressed at upload time), so
  // they play like a GIF: loop, muted by default, tap to unmute. autoPlay
  // only fires on first mount, so swiping back to an already-mounted tile
  // needs an explicit resume here.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  return (
    // Same letterbox treatment as image tiles: contained media, black bars.
    <div className="relative h-full w-full bg-black">
      <video
        ref={ref}
        src={tile.url}
        className="h-full w-full object-contain"
        playsInline
        autoPlay
        loop
        muted={muted}
        preload="metadata"
        onClick={() => setMuted((m) => !m)}
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-4 right-4 z-[6] flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <CaptionScrim text={tile.caption} />
    </div>
  );
}

function EmbedVideoTile({
  parsed,
  caption,
  active,
}: {
  parsed: { provider: "youtube" | "vimeo"; id: string };
  caption?: string;
  active: boolean;
}) {
  // Mount the iframe on first activation (neighbors show a lightweight
  // thumbnail); once mounted, keep it and pause via postMessage on exit.
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  useEffect(() => {
    if (active || !ref.current?.contentWindow) return;
    const win = ref.current.contentWindow;
    if (parsed.provider === "youtube") {
      win.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    } else {
      win.postMessage(JSON.stringify({ method: "pause" }), "*");
    }
  }, [active, parsed.provider]);

  const src =
    parsed.provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${parsed.id}?enablejsapi=1&playsinline=1&rel=0`
      : `https://player.vimeo.com/video/${parsed.id}?playsinline=1`;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-ink">
      {mounted ? (
        <iframe
          ref={ref}
          src={src}
          title="Video"
          className="aspect-video w-full border-0"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center bg-black">
          {parsed.provider === "youtube" && (
            <img
              src={`https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              draggable={false}
            />
          )}
          <div className="relative z-[2] flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="ml-1 text-white" size={28} fill="currentColor" />
          </div>
        </div>
      )}
      <EdgeGrabZones />
      <CaptionScrim text={caption} />
    </div>
  );
}

// --- gif --------------------------------------------------------------------

function GifTile({ tile }: { tile: Extract<Tile, { type: "gif" }> }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <img
        src={tile.url}
        alt={tile.caption ?? ""}
        className="h-full w-full object-contain"
        draggable={false}
      />
      <CaptionScrim text={tile.caption} />
    </div>
  );
}

// --- link -------------------------------------------------------------------

function LinkTile({ tile }: { tile: Extract<Tile, { type: "link" }> }) {
  let host = "";
  try {
    host = new URL(tile.url).hostname.replace(/^www\./, "");
  } catch {
    /* leave blank */
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#EDE4D3] px-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-paper shadow-xl">
        {tile.thumbnail && (
          <img src={tile.thumbnail} alt="" className="h-44 w-full object-cover" draggable={false} />
        )}
        <div className="p-6">
          {host && (
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/50">{host}</p>
          )}
          <h3 className="font-display text-2xl font-semibold leading-tight text-ink">{tile.title}</h3>
          {tile.description && (
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{tile.description}</p>
          )}
          <a
            href={tile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-bold text-ink transition-[filter] hover:brightness-95"
          >
            {tile.buttonLabel || "Open"}
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

// --- file -------------------------------------------------------------------

function FileTile({ tile }: { tile: Extract<Tile, { type: "file" }> }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#EDE4D3] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <FileText size={30} />
        </div>
        <p className="break-all text-sm font-medium text-ink/70">{tile.filename}</p>
        {tile.sizeBytes ? (
          <p className="mt-1 text-xs text-ink/45">{humanBytes(tile.sizeBytes)}</p>
        ) : null}
        <a
          href={tile.src}
          target="_blank"
          rel="noopener noreferrer"
          download={tile.filename}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-ink transition-[filter] hover:brightness-95"
        >
          <Download size={18} />
          {tile.label || "Download"}
        </a>
      </div>
    </div>
  );
}

// --- embed ------------------------------------------------------------------

function EmbedTile({ tile, active }: { tile: Extract<Tile, { type: "embed" }>; active: boolean }) {
  // Lazy-mount on first activation. Sandboxed: scripts only, never
  // same-origin — creator HTML can never touch the app's DOM.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  return (
    <div className="relative h-full w-full bg-ink">
      {mounted &&
        (tile.source === "upload" && tile.src ? (
          <iframe
            src={tile.src}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
            title={tile.label || "Interactive content"}
          />
        ) : (
          <iframe
            srcDoc={tile.html}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
            title={tile.label || "Interactive content"}
          />
        ))}
      <EdgeGrabZones />
      {tile.label && (
        <div className="pointer-events-none absolute left-4 top-4 z-[6] rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">
          {tile.label}
        </div>
      )}
    </div>
  );
}
