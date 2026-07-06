import { useState } from "react";
import {
  ArrowLeft,
  Code2,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Play,
  Type,
  X,
} from "lucide-react";
import type { Tile, TileType } from "../types";
import { parseVideoUrl } from "../lib/format";
import { TILE_COLORS } from "../lib/palette";
import { DEFAULT_OVERLAY_STYLE, defaultBodyStyle } from "../lib/textStyle";
import { MAX_VIDEO_SECONDS } from "../lib/video";
import { BackgroundPicker } from "./BackgroundPicker";
import { UploadField } from "./UploadField";
import { AssistText } from "./AssistText";
import { TextStyleEditor } from "./TextStyleEditor";
import { TileView } from "../viewer/tiles/TileView";

const TYPES: { type: TileType; label: string; Icon: typeof Type }[] = [
  { type: "text", label: "Text", Icon: Type },
  { type: "image", label: "Image", Icon: ImageIcon },
  { type: "video", label: "Video", Icon: Play },
  { type: "gif", label: "GIF", Icon: Film },
  { type: "link", label: "Link", Icon: Link2 },
  { type: "file", label: "File", Icon: FileText },
  { type: "embed", label: "Embed", Icon: Code2 },
];

function blankTile(type: TileType): Tile {
  switch (type) {
    case "text":
      return { type, title: "", body: "", bg: { kind: "color", value: TILE_COLORS[0] } };
    case "image":
      return { type, src: "", caption: "" };
    case "video":
      return { type, source: "youtube", url: "" };
    case "gif":
      return { type, source: "url", url: "" };
    case "link":
      return { type, url: "", title: "", buttonLabel: "Open" };
    case "file":
      return { type, src: "", filename: "", label: "Download PDF" };
    case "embed":
      return { type, source: "upload" };
  }
}

function tileHasContent(t: Tile): boolean {
  switch (t.type) {
    case "text":
      return Boolean(t.title || t.body);
    case "image":
      return Boolean(t.src);
    case "video":
    case "gif":
      return Boolean(t.url);
    case "link":
      return Boolean(t.url || t.title);
    case "file":
      return Boolean(t.src);
    case "embed":
      return Boolean(t.html || t.src);
  }
}

export function TileEditor({
  tile,
  gridId,
  cellLabel,
  onSave,
  onClose,
}: {
  tile: Tile | null;
  gridId: string;
  cellLabel: string;
  onSave: (tile: Tile | null) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Tile | null>(tile);

  const pickType = (type: TileType) => setDraft(blankTile(type));

  const changeType = () => {
    if (draft && tileHasContent(draft)) {
      if (!window.confirm("Changing the tile type discards this tile's content. Continue?")) return;
    }
    setDraft(null);
  };

  const clear = () => {
    if (!window.confirm("Clear this tile? Its content will be removed.")) return;
    onSave(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-stretch md:justify-end">
      <button aria-label="Close tile editor" className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-paper shadow-2xl md:h-full md:max-h-none md:w-[420px] md:rounded-none">
        <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div className="flex items-center gap-2">
            {draft && (
              <button
                onClick={changeType}
                className="flex min-h-[36px] items-center gap-1 rounded-full px-2 text-sm text-ink/60 hover:bg-ink/5 hover:text-ink"
              >
                <ArrowLeft size={16} />
                Type
              </button>
            )}
            <h2 className="font-display text-lg font-semibold">
              {draft ? TYPES.find((t) => t.type === draft.type)?.label : "Pick a tile type"}
              <span className="ml-2 text-sm font-normal text-ink/45">{cellLabel}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!draft ? (
            <div className="grid grid-cols-3 gap-3">
              {TYPES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => pickType(type)}
                  className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <Icon size={22} className="text-accent" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <TileForm draft={draft} setDraft={setDraft} gridId={gridId} />
          )}
        </div>

        {draft && (
          <footer className="flex items-center gap-3 border-t border-ink/10 px-5 py-4">
            <button
              onClick={() => onSave(draft)}
              disabled={!tileHasContent(draft)}
              className="min-h-[48px] flex-1 rounded-full bg-accent font-bold text-ink transition-[filter] hover:brightness-95 disabled:opacity-40"
            >
              Save tile
            </button>
            {tile && (
              <button
                onClick={clear}
                className="min-h-[48px] rounded-full px-4 text-sm font-medium text-accent-deep hover:bg-accent/10"
              >
                Clear tile
              </button>
            )}
            <button
              onClick={onClose}
              className="min-h-[48px] rounded-full px-4 text-sm font-medium text-ink/60 hover:bg-ink/5"
            >
              Cancel
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block text-sm font-medium first:mt-0">
      {label}
      {children}
    </label>
  );
}

const inputCls =
  "mt-1 min-h-[44px] w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none focus:border-accent";

function TileForm({
  draft,
  setDraft,
  gridId,
}: {
  draft: Tile;
  setDraft: (t: Tile) => void;
  gridId: string;
}) {
  switch (draft.type) {
    case "text":
      return (
        <div>
          <Field label="Title (optional)">
            <input
              value={draft.title ?? ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Body">
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={6}
              className={`${inputCls} py-2 leading-relaxed`}
            />
          </Field>
          <AssistText
            currentText={draft.body}
            context="Body copy for a full-screen tile in a swipeable micro-learning grid for teacher professional development. Warm, concise, editorial."
            onUse={(text) => setDraft({ ...draft, body: text })}
          />
          <p className="mt-5 text-sm font-medium">Text style</p>
          <div className="mt-2">
            <TextStyleEditor
              value={draft.style ?? defaultBodyStyle(draft.bg)}
              onChange={(style) => setDraft({ ...draft, style })}
              previewText={draft.body || draft.title || ""}
            />
          </div>
          <p className="mt-5 text-sm font-medium">Background</p>
          <div className="mt-2">
            <BackgroundPicker
              value={draft.bg}
              onChange={(bg) => setDraft({ ...draft, bg })}
              gridId={gridId}
            />
          </div>
        </div>
      );

    case "image":
      return (
        <div>
          {draft.src && (
            <div className="mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-black">
              <img src={draft.src} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <UploadField
            accept="image/*"
            gridId={gridId}
            label={draft.src ? "Replace image" : "Upload an image"}
            onUploaded={(src) => setDraft({ ...draft, src })}
          />
          <Field label="Alt text (what's in the image)">
            <input
              value={draft.alt ?? ""}
              onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Caption (optional)">
            <input
              value={draft.caption ?? ""}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Large overlay text (optional)">
            <input
              value={draft.overlayText ?? ""}
              onChange={(e) => setDraft({ ...draft, overlayText: e.target.value })}
              className={inputCls}
            />
          </Field>
          {Boolean(draft.overlayText?.trim()) && (
            <div className="mt-4">
              <p className="text-sm font-medium">Overlay text style</p>
              <div className="mt-2">
                <TextStyleEditor
                  value={draft.overlayStyle ?? DEFAULT_OVERLAY_STYLE}
                  onChange={(overlayStyle) => setDraft({ ...draft, overlayStyle })}
                  previewText={draft.overlayText ?? ""}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "video": {
      const parsed = draft.source !== "upload" ? parseVideoUrl(draft.url) : null;
      return (
        <div>
          <Field label="Paste a YouTube or Vimeo URL">
            <input
              value={draft.source === "upload" ? "" : draft.url}
              onChange={(e) => {
                const url = e.target.value;
                const p = parseVideoUrl(url);
                setDraft({ ...draft, url, source: p?.provider ?? "youtube" });
              }}
              placeholder="https://www.youtube.com/watch?v=…"
              className={inputCls}
            />
          </Field>
          {parsed?.provider === "youtube" && (
            <img
              src={`https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="mt-3 w-full rounded-xl"
            />
          )}
          {parsed?.provider === "vimeo" && (
            <p className="mt-2 text-sm text-ink/60">✓ Vimeo video detected</p>
          )}
          <p className="my-4 text-center text-xs font-medium uppercase tracking-widest text-ink/40">
            or
          </p>
          <UploadField
            accept="video/*"
            kind="video"
            gridId={gridId}
            label={draft.source === "upload" && draft.url ? "Replace video clip" : "Upload a video clip"}
            onUploaded={(url) => setDraft({ ...draft, url, source: "upload" })}
          />
          <p className="mt-2 text-xs text-ink/50">
            Clips over {MAX_VIDEO_SECONDS} seconds open a trim tool — pick any {MAX_VIDEO_SECONDS}-second
            window to use.
          </p>
          {draft.source === "upload" && draft.url && (
            <p className="mt-2 text-sm text-ink/60">✓ Clip uploaded</p>
          )}
          <Field label="Caption (optional)">
            <input
              value={draft.caption ?? ""}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      );
    }

    case "gif":
      return (
        <div>
          <Field label="Paste a direct GIF URL">
            <input
              value={draft.source === "url" ? draft.url : ""}
              onChange={(e) => setDraft({ ...draft, url: e.target.value, source: "url" })}
              placeholder="https://…/something.gif"
              className={inputCls}
            />
          </Field>
          <p className="my-4 text-center text-xs font-medium uppercase tracking-widest text-ink/40">
            or
          </p>
          <UploadField
            accept="image/gif"
            gridId={gridId}
            label="Upload a GIF"
            onUploaded={(url) => setDraft({ ...draft, url, source: "upload" })}
          />
          {draft.url && (
            <div className="mt-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-black">
              <img src={draft.url} alt="GIF preview" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <Field label="Caption (optional)">
            <input
              value={draft.caption ?? ""}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      );

    case "link":
      return (
        <div>
          <Field label="URL">
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              onBlur={async () => {
                if (!draft.url || draft.title) return;
                try {
                  const res = await fetch(`/api/link-meta?url=${encodeURIComponent(draft.url)}`);
                  if (!res.ok) return;
                  const meta = await res.json();
                  setDraft({
                    ...draft,
                    title: draft.title || meta.title || "",
                    description: draft.description || meta.description || undefined,
                    thumbnail: draft.thumbnail || meta.image || undefined,
                  });
                } catch {
                  /* fields stay manual */
                }
              }}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={`${inputCls} py-2`}
            />
          </Field>
          <Field label="Button label">
            <input
              value={draft.buttonLabel ?? "Open"}
              onChange={(e) => setDraft({ ...draft, buttonLabel: e.target.value })}
              className={inputCls}
            />
          </Field>
          <p className="mt-4 text-sm font-medium">Thumbnail (optional)</p>
          {draft.thumbnail && (
            <img src={draft.thumbnail} alt="" className="my-2 max-h-32 w-full rounded-xl object-cover" />
          )}
          <div className="mt-1">
            <UploadField
              accept="image/*"
              gridId={gridId}
              label={draft.thumbnail ? "Replace thumbnail" : "Upload a thumbnail"}
              onUploaded={(thumbnail) => setDraft({ ...draft, thumbnail })}
            />
          </div>
        </div>
      );

    case "file":
      return (
        <div>
          <UploadField
            accept=".pdf,application/pdf,.doc,.docx,.ppt,.pptx,.zip"
            gridId={gridId}
            label={draft.src ? "Replace file" : "Upload a PDF or file"}
            onUploaded={(src, file) =>
              setDraft({ ...draft, src, filename: file.name, sizeBytes: file.size })
            }
          />
          {draft.filename && <p className="mt-2 text-sm text-ink/60">✓ {draft.filename}</p>}
          <Field label="Button label">
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      );

    case "embed":
      return (
        <div>
          <div className="flex gap-1 rounded-lg bg-ink/5 p-1 text-sm font-medium">
            {(["upload", "snippet"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft({ ...draft, source: s })}
                className={`min-h-[36px] flex-1 rounded-md transition-colors ${
                  draft.source === s ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink"
                }`}
              >
                {s === "upload" ? "Upload HTML file" : "Paste embed code"}
              </button>
            ))}
          </div>
          {draft.source === "upload" ? (
            <div className="mt-3">
              <UploadField
                accept=".html,.htm,text/html,text/plain"
                gridId={gridId}
                label={draft.src ? "Replace HTML file" : "Upload an HTML file"}
                onUploaded={(src) => setDraft({ ...draft, src, html: undefined })}
              />
              <p className="mt-2 text-xs text-ink/50">
                Perfect for interactives built with Claude — export as a single HTML file.
              </p>
            </div>
          ) : (
            <Field label="Embed code">
              <textarea
                value={draft.html ?? ""}
                onChange={(e) => setDraft({ ...draft, html: e.target.value, src: undefined })}
                rows={6}
                placeholder="<iframe …></iframe> or a full HTML snippet"
                className={`${inputCls} py-2 font-mono text-xs`}
              />
            </Field>
          )}
          <Field label="Label (optional)">
            <input
              value={draft.label ?? ""}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className={inputCls}
            />
          </Field>
          {(draft.html || draft.src) && (
            <div className="mt-4">
              <p className="text-sm font-medium">Live preview</p>
              <div className="mt-2 h-64 overflow-hidden rounded-xl border border-ink/10 bg-ink">
                <TileView tile={draft} active />
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-ink/50">Runs in a secure sandbox.</p>
        </div>
      );
  }
}
