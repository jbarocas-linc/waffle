import { useRef, useState } from "react";
import { Images } from "lucide-react";
import type { Tile } from "../types";
import { store } from "../lib/store";

/**
 * Prominent entry point for filling many cells at once: pick several photos in
 * one pass; each becomes a plain image tile. Assignment to cells (next empty,
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
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    const tiles: Tile[] = [];
    let failures = 0;
    for (const file of Array.from(files)) {
      try {
        const src = await store.uploadMedia(gridId, file);
        tiles.push({ type: "image", src, alt: file.name.replace(/\.[^.]+$/, "") });
      } catch {
        failures++;
      }
    }
    setBusy(false);
    if (failures > 0) {
      setError(`${failures} photo${failures === 1 ? "" : "s"} failed to upload.`);
    }
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
        {busy ? "Uploading photos…" : "Bulk upload photos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-center text-sm text-accent-deep">{error}</p>}
    </div>
  );
}
