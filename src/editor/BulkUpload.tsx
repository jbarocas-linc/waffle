import { useRef, useState } from "react";
import { Images } from "lucide-react";
import type { Tile } from "../types";
import { store } from "../lib/store";
import { MAX_VIDEO_SECONDS, getVideoDuration } from "../lib/video";

// Extension check as well as MIME: some iOS flows mistag .html attachments
// as plain text (see the embed tile's accept fix), and camera videos can
// arrive with vendor MIME types.
const isHtmlFile = (f: File) => /\.html?$/i.test(f.name) || f.type === "text/html";

/** Map a selected file to the tile it should become. null = unsupported. */
function tileFor(file: File, url: string): Tile | null {
  if (isHtmlFile(file)) return { type: "embed", source: "upload", src: url, label: file.name };
  if (file.type === "image/gif") return { type: "gif", source: "upload", url };
  if (file.type.startsWith("video/")) return { type: "video", source: "upload", url };
  if (file.type.startsWith("image/"))
    return { type: "image", src: url, alt: file.name.replace(/\.[^.]+$/, "") };
  return null;
}

/**
 * Prominent entry point for filling many cells at once: pick any mix of
 * photos, GIFs, videos, and HTML interactives in one pass. Each file becomes
 * the matching tile type, in selection order; files that fail (over the size
 * limit, unsupported, or a video over the 10s cap — trimming belongs in the
 * per-tile editor, not a queue of bulk trim dialogs) are skipped with a named
 * inline error while the rest still land. Assignment to cells (next empty,
 * row-major) is the caller's job so the grid state stays in one place.
 */
export function BulkUploadButton({
  gridId,
  onUploaded,
}: {
  gridId: string;
  onUploaded: (tiles: Tile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrors([]);
    const tiles: Tile[] = [];
    const failed: string[] = [];
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const label = (pct: number) =>
        setProgress(`Uploading ${i + 1} of ${list.length}${pct > 0 ? ` — ${pct}%` : ""}…`);
      label(0);

      // Classify before uploading so unsupported files never hit storage.
      if (!tileFor(file, "")) {
        failed.push(`${file.name}: unsupported file type — skipped.`);
        continue;
      }

      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > MAX_VIDEO_SECONDS) {
            failed.push(
              `${file.name}: longer than ${MAX_VIDEO_SECONDS}s — add it individually to trim it.`,
            );
            continue;
          }
        } catch {
          failed.push(`${file.name}: couldn't read that video — skipped.`);
          continue;
        }
      }

      try {
        const url = await store.uploadMedia(gridId, file, label);
        tiles.push(tileFor(file, url)!);
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed."}`);
      }
    }
    setBusy(false);
    setProgress("");
    setErrors(failed);
    if (tiles.length > 0) onUploaded(tiles);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent/10 px-6 font-bold text-accent-deep transition-colors hover:bg-accent/20 disabled:opacity-50"
      >
        <Images size={20} />
        {busy ? progress || "Uploading…" : "Bulk upload media"}
      </button>
      <p className="mt-1.5 text-center text-xs text-ink/45">
        Photos, GIFs, videos (≤{MAX_VIDEO_SECONDS}s), or HTML interactives — any mix, one pass.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.html,.htm,text/html,text/plain"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-center text-sm text-accent-deep">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
