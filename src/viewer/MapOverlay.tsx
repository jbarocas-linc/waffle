import { AnimatePresence, motion } from "framer-motion";
import type { PublicGrid } from "../types";

/**
 * The waffle map: informational only, never tappable. Fades in when a gesture
 * begins and out ~800ms after the tile settles (timing owned by Stage).
 */
export function MapOverlay({
  grid,
  current,
  visible,
}: {
  grid: PublicGrid;
  current: number;
  visible: boolean;
}) {
  const size = grid.size;
  const hasCols = grid.colLabels?.some(Boolean);
  const hasRows = grid.rowLabels?.some(Boolean);

  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 -translate-x-1/2 md:bottom-6 md:left-6 md:translate-x-0">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="rounded-xl bg-black/40 p-2.5 backdrop-blur-sm"
          >
            {hasCols && (
              <div
                className="mb-1 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${size}, 14px)`, marginLeft: hasRows ? 58 : 0 }}
              >
                {Array.from({ length: size }, (_, i) => (
                  <span
                    key={i}
                    className="overflow-hidden whitespace-nowrap text-center text-[7px] font-medium uppercase tracking-wide text-white/60"
                  >
                    {grid.colLabels?.[i]?.slice(0, 4) ?? ""}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1">
              {hasRows && (
                <div className="grid gap-1" style={{ gridTemplateRows: `repeat(${size}, 14px)` }}>
                  {Array.from({ length: size }, (_, i) => (
                    <span className="flex w-[54px] items-center justify-end overflow-hidden whitespace-nowrap text-right text-[7px] font-medium uppercase tracking-wide text-white/60" key={i}>
                      {grid.rowLabels?.[i] ?? ""}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${size}, 14px)` }}
              >
                {grid.cells.map((tile, i) => (
                  <div
                    key={i}
                    className={`h-3.5 w-3.5 rounded-[3px] transition-colors ${
                      i === current ? "bg-white" : tile ? "bg-white/30" : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
