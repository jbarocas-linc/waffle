import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PublicGrid } from "../types";
import { store } from "../lib/store";
import { GridViewer } from "../viewer/GridViewer";

export default function ViewerPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const [grid, setGrid] = useState<PublicGrid | null | undefined>(undefined);

  useEffect(() => {
    if (!viewId) return;
    store
      .getByViewId(viewId)
      .then(setGrid)
      .catch(() => setGrid(null));
  }, [viewId]);

  useEffect(() => {
    if (grid) document.title = `${grid.title} — Waffle`;
  }, [grid]);

  if (grid === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141210]">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-white/15" />
      </div>
    );
  }

  if (grid === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#141210] px-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-paper">Grid not found</h1>
        <p className="max-w-[40ch] text-white/60">
          This link doesn't point to a grid — it may have been mistyped.
        </p>
        <Link to="/" className="mt-2 text-accent-deep underline underline-offset-4">
          Go to Waffle
        </Link>
      </div>
    );
  }

  return <GridViewer grid={grid} />;
}
