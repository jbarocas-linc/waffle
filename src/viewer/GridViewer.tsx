import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PublicGrid } from "../types";
import { Stage } from "./Stage";
import { IntroScreen } from "./IntroScreen";

/**
 * The full viewer experience: intro card, then the stage. On wide screens the
 * grid letterboxes into a centered 9:16-ish card; inside a phone-sized
 * viewport or a Thinkific iframe it fills the container edge to edge.
 */
export function GridViewer({ grid, onExit }: { grid: PublicGrid; onExit?: () => void }) {
  const [started, setStarted] = useState(false);

  return (
    <div className="h-full w-full bg-[#141210]">
      <div className="flex h-full items-center justify-center">
        <div className="relative h-full w-full overflow-hidden lg:aspect-[9/16] lg:h-[94%] lg:w-auto lg:rounded-2xl lg:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <Stage grid={grid} />
          <AnimatePresence>
            {!started && <IntroScreen grid={grid} onStart={() => setStarted(true)} />}
          </AnimatePresence>
          {onExit && (
            <button
              onClick={onExit}
              aria-label="Exit preview"
              className="absolute right-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
