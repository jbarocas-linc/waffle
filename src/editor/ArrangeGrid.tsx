import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import type { GridSize, Tile } from "../types";
import { MiniTile } from "./EditorGrid";

/**
 * Full-grid rearrange view shown after a bulk upload. Drag any filled tile
 * onto any other position to swap. Pointer events + pointer capture make the
 * same code path work for mouse and touch, and a floating ghost follows the
 * pointer so the drag reads as "picking up" a tile.
 */
export function ArrangeGrid({
  cells,
  size,
  onChange,
  onDone,
}: {
  cells: (Tile | null)[];
  size: GridSize;
  onChange: (cells: (Tile | null)[]) => void;
  onDone: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const ghostSize = useRef({ w: 0, h: 0 });

  const targetIndex = (e: React.PointerEvent): number | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cellEl = el?.closest("[data-cell-index]") as HTMLElement | null;
    return cellEl ? Number(cellEl.dataset.cellIndex) : null;
  };

  const onPointerDown = (i: number, e: React.PointerEvent) => {
    if (!cells[i]) return; // empty cells are drop targets, not draggable
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    ghostSize.current = { w: rect.width, h: rect.height };
    setDragIndex(i);
    setGhost({ x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone (or synthetic) — drag still works via bubbling */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null) return;
    setGhost({ x: e.clientX, y: e.clientY });
    setOverIndex(targetIndex(e));
  };

  const endDrag = (e: React.PointerEvent, commit: boolean) => {
    if (dragIndex === null) return;
    if (commit) {
      const dropIndex = targetIndex(e);
      if (dropIndex !== null && dropIndex !== dragIndex) {
        const next = [...cells];
        [next[dragIndex], next[dropIndex]] = [next[dropIndex], next[dragIndex]];
        onChange(next);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
    setGhost(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-paper p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-semibold">Arrange your photos</h2>
        <p className="mt-1 text-sm text-ink/60">Drag any tile onto another spot to swap them.</p>
        <div
          className="mt-5 grid touch-none select-none gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {cells.map((tile, i) => (
            <div
              key={i}
              data-cell-index={i}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => endDrag(e, true)}
              onPointerCancel={(e) => endDrag(e, false)}
              className={`relative aspect-[3/4] touch-none overflow-hidden rounded-xl border transition-all ${
                dragIndex === i ? "scale-95 opacity-40" : ""
              } ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-accent-deep ring-2 ring-accent"
                  : "border-ink/10"
              } ${tile ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {tile ? (
                <>
                  <MiniTile tile={tile} />
                  <div className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white">
                    <GripVertical size={13} />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white text-[10px] font-medium text-ink/30">
                  Empty
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onDone}
          className="mt-6 min-h-[48px] w-full rounded-full bg-accent px-6 font-bold text-ink transition-[filter] hover:brightness-95"
        >
          Done
        </button>
      </div>

      {/* Floating drag ghost */}
      {ghost && dragIndex !== null && cells[dragIndex] && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[60] overflow-hidden rounded-xl opacity-90 shadow-2xl ring-2 ring-accent"
          style={{
            left: ghost.x - ghostSize.current.w / 2,
            top: ghost.y - ghostSize.current.h / 2,
            width: ghostSize.current.w,
            height: ghostSize.current.h,
          }}
        >
          <MiniTile tile={cells[dragIndex]!} />
        </div>
      )}
    </div>
  );
}
