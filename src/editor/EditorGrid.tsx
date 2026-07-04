import { Code2, FileText, Film, Link2, Play, Plus, Star, Type } from "lucide-react";
import type { GridRecord, Tile } from "../types";
import { bgStyle, parseVideoUrl, textOn } from "../lib/format";

export function MiniTile({ tile }: { tile: Tile }) {
  switch (tile.type) {
    case "text":
      return (
        <div
          className="flex h-full w-full items-end p-2"
          style={{ ...bgStyle(tile.bg), color: textOn(tile.bg) }}
        >
          <span className="line-clamp-3 text-left text-[10px] font-bold leading-tight">
            {tile.title || tile.body}
          </span>
        </div>
      );
    case "image":
      return (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <img src={tile.src} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
        </div>
      );
    case "video": {
      const parsed = tile.source !== "upload" ? parseVideoUrl(tile.url) : null;
      return (
        <div className="relative flex h-full w-full items-center justify-center bg-ink">
          {parsed?.provider === "youtube" && (
            <img
              src={`https://i.ytimg.com/vi/${parsed.id}/mqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              draggable={false}
            />
          )}
          <Play size={18} className="relative z-[2] text-white" fill="currentColor" />
        </div>
      );
    }
    case "gif":
      return (
        <div className="relative flex h-full w-full items-center justify-center bg-black">
          <img src={tile.url} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
          <Film size={14} className="absolute bottom-1.5 right-1.5 text-white drop-shadow" />
        </div>
      );
    case "link":
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#EDE4D3] p-2">
          <Link2 size={16} className="text-accent" />
          <span className="line-clamp-2 text-center text-[9px] font-medium leading-tight">
            {tile.title}
          </span>
        </div>
      );
    case "file":
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#EDE4D3] p-2">
          <FileText size={16} className="text-accent" />
          <span className="line-clamp-2 break-all text-center text-[9px] leading-tight">
            {tile.filename}
          </span>
        </div>
      );
    case "embed":
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-ink p-2">
          <Code2 size={16} className="text-paper" />
          <span className="line-clamp-2 text-center text-[9px] leading-tight text-paper/70">
            {tile.label || "Interactive"}
          </span>
        </div>
      );
  }
}

export function EditorGrid({
  grid,
  labelsOn,
  onCellClick,
  onSetStart,
  onLabelChange,
}: {
  grid: GridRecord;
  labelsOn: boolean;
  onCellClick: (index: number) => void;
  onSetStart: (index: number) => void;
  onLabelChange: (axis: "row" | "col", index: number, value: string) => void;
}) {
  const size = grid.size;
  const labelInput =
    "min-h-[36px] w-full rounded-lg border border-ink/10 bg-white px-2 text-center text-xs outline-none focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-lg">
      {labelsOn && (
        <div
          className="mb-2 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            marginLeft: labelsOn ? "4.5rem" : 0,
          }}
        >
          {Array.from({ length: size }, (_, i) => (
            <input
              key={i}
              value={grid.colLabels?.[i] ?? ""}
              onChange={(e) => onLabelChange("col", i, e.target.value)}
              placeholder={`Column ${i + 1}`}
              aria-label={`Column ${i + 1} label`}
              className={labelInput}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {labelsOn && (
          <div
            className="grid w-16 shrink-0 gap-2"
            style={{ gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: size }, (_, i) => (
              <input
                key={i}
                value={grid.rowLabels?.[i] ?? ""}
                onChange={(e) => onLabelChange("row", i, e.target.value)}
                placeholder={`Row ${i + 1}`}
                aria-label={`Row ${i + 1} label`}
                className={`${labelInput} self-center`}
              />
            ))}
          </div>
        )}
        <div
          className="grid flex-1 gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.cells.map((tile, i) => (
            <div key={i} className="group relative">
              <button
                onClick={() => onCellClick(i)}
                aria-label={tile ? `Edit tile ${i + 1}` : `Add a tile at position ${i + 1}`}
                className={`block aspect-[3/4] w-full overflow-hidden rounded-xl border transition-shadow hover:shadow-md ${
                  tile ? "border-ink/10" : "border-dashed border-ink/20 bg-white hover:border-accent"
                }`}
              >
                {tile ? (
                  <MiniTile tile={tile} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink/30">
                    <Plus size={22} />
                  </span>
                )}
              </button>
              {i === grid.startCell && (
                <span className="pointer-events-none absolute left-1.5 top-1.5 z-[2] inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink shadow">
                  <Star size={9} fill="currentColor" />
                  START
                </span>
              )}
              {tile && i !== grid.startCell && (
                <button
                  onClick={() => onSetStart(i)}
                  aria-label={`Make tile ${i + 1} the starting tile`}
                  title="Start here"
                  className="absolute right-1.5 top-1.5 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-60 backdrop-blur-sm transition-opacity hover:!opacity-100 md:opacity-0 md:group-hover:opacity-80"
                >
                  <Star size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
