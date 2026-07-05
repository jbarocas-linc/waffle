import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Eye, Settings2, Share2, Sparkles } from "lucide-react";
import type { DraftProposal, GridRecord, Tile } from "../types";
import { store } from "../lib/store";
import { curatedBg } from "../lib/palette";
import { appOrigin } from "../lib/format";
import { EditorGrid } from "../editor/EditorGrid";
import { TileEditor } from "../editor/TileEditor";
import { SharePanel } from "../editor/SharePanel";
import { EditLinkModal } from "../editor/EditLinkModal";
import { DraftGridForm, proposalStartCell } from "../editor/DraftGrid";
import { BulkUploadButton } from "../editor/BulkUpload";
import { ArrangeGrid } from "../editor/ArrangeGrid";
import { GridViewer } from "../viewer/GridViewer";
import { WaffleMark, WaffleWordmark } from "../components/WaffleLogo";

export default function EditorPage() {
  const { editToken } = useParams<{ editToken: string }>();
  const location = useLocation();
  const [grid, setGrid] = useState<GridRecord | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [showArrange, setShowArrange] = useState(false);
  const [bulkWarning, setBulkWarning] = useState("");
  const [labelsOn, setLabelsOn] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(
    Boolean((location.state as { justCreated?: boolean } | null)?.justCreated),
  );

  useEffect(() => {
    if (!editToken) return;
    store
      .getByEditToken(editToken)
      .then((rec) => {
        setGrid(rec);
        if (rec) setLabelsOn(Boolean(rec.rowLabels?.some(Boolean) || rec.colLabels?.some(Boolean)));
      })
      .catch(() => setGrid(null));
  }, [editToken]);

  // Autosave: debounced on every change, quiet "Saved" indicator.
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const skipNextSave = useRef(true);
  useEffect(() => {
    if (!grid || !editToken) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const { id, viewId, editToken: _t, createdAt, updatedAt, ...fields } = grid;
      store
        .update(editToken, fields)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [grid, editToken]);

  if (grid === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-ink/10" />
      </div>
    );
  }

  if (grid === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="font-display text-3xl font-semibold">Grid not found</h1>
        <p className="max-w-[42ch] text-ink/60">
          This edit link doesn't match a grid. Double-check the URL — it's the only key to editing.
        </p>
        <Link to="/" className="text-accent-deep underline underline-offset-4">
          Back to Waffle
        </Link>
      </div>
    );
  }

  const patch = (p: Partial<GridRecord>) => setGrid((g) => (g ? { ...g, ...p } : g));

  const setCellTile = (index: number, tile: Tile | null) => {
    const cells = [...grid.cells];
    cells[index] = tile;
    patch({ cells });
  };

  // Bulk upload: fill the next available empty cells in row-major order, then
  // drop straight into the rearrange view.
  const handleBulkUploaded = (tiles: Tile[]) => {
    const cells = [...grid.cells];
    let ti = 0;
    for (let i = 0; i < cells.length && ti < tiles.length; i++) {
      if (!cells[i]) cells[i] = tiles[ti++];
    }
    patch({ cells });
    const leftover = tiles.length - ti;
    setBulkWarning(
      leftover > 0
        ? `${leftover} photo${leftover === 1 ? "" : "s"} didn't fit — the grid is full.`
        : "",
    );
    setShowArrange(true);
  };

  const setLabel = (axis: "row" | "col", index: number, value: string) => {
    const key = axis === "row" ? "rowLabels" : "colLabels";
    const current = grid[key] ?? Array(grid.size).fill("");
    const next = [...current];
    next[index] = value;
    patch({ [key]: next });
  };

  const toggleLabels = (on: boolean) => {
    setLabelsOn(on);
    if (!on) patch({ rowLabels: null, colLabels: null });
    else
      patch({
        rowLabels: grid.rowLabels ?? Array(grid.size).fill(""),
        colLabels: grid.colLabels ?? Array(grid.size).fill(""),
      });
  };

  const acceptDraft = (p: DraftProposal) => {
    const cells: (Tile | null)[] = grid.cells.map((existing, i) => {
      const draft = p.cells[i];
      if (existing) return existing; // never overwrite real content
      return draft && (draft.title || draft.brief)
        ? { type: "text", title: draft.title, body: draft.brief, bg: curatedBg(i) }
        : null;
    });
    patch({
      cells,
      rowLabels: p.rowLabels ?? grid.rowLabels,
      colLabels: p.colLabels ?? grid.colLabels,
      startCell: proposalStartCell(p, grid.size),
    });
    if (p.rowLabels || p.colLabels) setLabelsOn(true);
    setShowDraft(false);
    setShowSettings(false);
  };

  const filledCount = grid.cells.filter(Boolean).length;
  const mostlyEmpty = filledCount <= Math.floor((grid.size * grid.size) / 3);
  const cellLabel = (i: number) =>
    `Row ${Math.floor(i / grid.size) + 1}, Col ${(i % grid.size) + 1}`;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 hover:opacity-80">
            <WaffleMark size={28} />
            <WaffleWordmark className="text-base" />
          </Link>
          <input
            value={grid.title}
            onChange={(e) => patch({ title: e.target.value })}
            aria-label="Grid title"
            className="min-h-[44px] w-full min-w-0 flex-1 rounded-lg bg-transparent px-2 font-display text-lg font-semibold outline-none focus:bg-white"
          />
          <span
            className={`hidden shrink-0 text-xs sm:block ${
              saveState === "error" ? "font-medium text-accent-deep" : "text-ink/40"
            }`}
            aria-live="polite"
          >
            {saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save" : "Saved"}
          </span>
          <button
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Grid settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <Settings2 size={19} />
          </button>
          <button
            onClick={() => setPreview(true)}
            aria-label="Preview grid"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <Eye size={19} />
          </button>
          <button
            onClick={() => {
              if (!grid.published) patch({ published: true });
              setShowShare(true);
            }}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-ink transition-[filter] hover:brightness-95"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
        {showSettings && (
          <div className="border-t border-ink/10 bg-white/70">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={labelsOn}
                  onChange={(e) => toggleLabels(e.target.checked)}
                  className="h-5 w-5 accent-[#A9690F]"
                />
                Row & column labels
              </label>
              <label className="flex min-w-64 flex-1 items-center gap-2 text-sm font-medium">
                Description
                <input
                  value={grid.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value || null })}
                  placeholder="Shown on the intro screen"
                  className="min-h-[40px] flex-1 rounded-lg border border-ink/15 bg-white px-3 text-sm font-normal outline-none focus:border-accent"
                />
              </label>
              {mostlyEmpty && (
                <button
                  onClick={() => setShowDraft(true)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm font-medium hover:bg-ink/5"
                >
                  <Sparkles size={15} className="text-accent" />
                  Draft my grid
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mx-auto mb-6 max-w-lg">
          <BulkUploadButton gridId={grid.id} onUploaded={handleBulkUploaded} />
          {bulkWarning && (
            <p className="mt-2 text-center text-sm text-accent-deep">{bulkWarning}</p>
          )}
        </div>
        <p className="mb-5 text-center text-sm text-ink/50">
          Tap a cell to fill it. Star a filled cell to make it the starting tile.
        </p>
        <EditorGrid
          grid={grid}
          labelsOn={labelsOn}
          onCellClick={setEditingCell}
          onSetStart={(i) => patch({ startCell: i })}
          onLabelChange={setLabel}
        />
      </main>

      {showArrange && (
        <ArrangeGrid
          cells={grid.cells}
          size={grid.size}
          onChange={(cells) => patch({ cells })}
          onDone={() => setShowArrange(false)}
        />
      )}

      {editingCell !== null && (
        <TileEditor
          key={editingCell}
          tile={grid.cells[editingCell]}
          gridId={grid.id}
          cellLabel={cellLabel(editingCell)}
          onSave={(tile) => {
            setCellTile(editingCell, tile);
            setEditingCell(null);
          }}
          onClose={() => setEditingCell(null)}
        />
      )}

      {showDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <button aria-label="Close draft form" className="absolute inset-0" onClick={() => setShowDraft(false)} />
          <div className="relative max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-paper p-6 shadow-2xl">
            <DraftGridForm size={grid.size} onAccept={acceptDraft} onCancel={() => setShowDraft(false)} />
          </div>
        </div>
      )}

      {showShare && <SharePanel grid={grid} onClose={() => setShowShare(false)} />}

      {showLinkModal && (
        <EditLinkModal
          editUrl={`${appOrigin()}/edit/${grid.editToken}`}
          onDismiss={() => setShowLinkModal(false)}
        />
      )}

      {preview && (
        <div className="fixed inset-0 z-50">
          <GridViewer grid={grid} onExit={() => setPreview(false)} />
        </div>
      )}
    </div>
  );
}
