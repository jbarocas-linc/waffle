import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import type { DraftProposal, GridSize, Tile } from "../types";
import { store } from "../lib/store";
import { curatedBg } from "../lib/palette";
import { DraftGridForm, proposalStartCell } from "../editor/DraftGrid";
import { WaffleMark } from "../components/WaffleLogo";

export default function NewGrid() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState<GridSize>(3);
  const [mode, setMode] = useState<"form" | "ai">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (
    cells?: (Tile | null)[],
    labels?: { rows: string[] | null; cols: string[] | null },
    startCell?: number,
  ) => {
    if (!title.trim()) {
      setError("Give your grid a title first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const rec = await store.create({
        title: title.trim(),
        description: description.trim() || null,
        size,
        cells,
        rowLabels: labels?.rows ?? null,
        colLabels: labels?.cols ?? null,
        startCell,
      });
      navigate(`/edit/${rec.editToken}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the grid. Try again.");
      setBusy(false);
    }
  };

  const acceptDraft = (p: DraftProposal) => {
    const cells: (Tile | null)[] = p.cells.map((c, i) =>
      c && (c.title || c.brief)
        ? { type: "text", title: c.title, body: c.brief, bg: curatedBg(i) }
        : null,
    );
    void create(
      cells,
      { rows: p.rowLabels ?? null, cols: p.colLabels ?? null },
      proposalStartCell(p, size),
    );
  };

  return (
    <div className="mx-auto min-h-full max-w-xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink">
        <WaffleMark size={20} />← Waffle
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold">New grid</h1>

      {mode === "ai" ? (
        <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
          <DraftGridForm size={size} onAccept={acceptDraft} onCancel={() => setMode("form")} />
        </div>
      ) : (
        <div className="mt-8">
          <label className="block font-medium">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Wait Time: The 3-Second Upgrade"
              className="mt-2 min-h-[52px] w-full rounded-xl border border-ink/15 bg-white px-4 outline-none focus:border-accent"
            />
          </label>
          <label className="mt-5 block font-medium">
            One-line description <span className="font-normal text-ink/50">(optional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown on the intro screen and in link previews"
              className="mt-2 min-h-[52px] w-full rounded-xl border border-ink/15 bg-white px-4 outline-none focus:border-accent"
            />
          </label>

          <p className="mt-8 font-medium">Size</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {([2, 3, 4] as GridSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-colors ${
                  size === s ? "border-accent bg-accent/5" : "border-ink/10 bg-white hover:border-ink/25"
                }`}
              >
                <span
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${s}, 8px)` }}
                  aria-hidden
                >
                  {Array.from({ length: s * s }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-[2px] ${size === s ? "bg-accent" : "bg-ink/25"}`}
                    />
                  ))}
                </span>
                <span className="text-sm font-bold">
                  {s}×{s}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-accent-deep">{error}</p>}

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={() => void create()}
              disabled={busy}
              className="min-h-[52px] rounded-full bg-accent px-8 text-lg font-bold text-ink transition-[filter] hover:brightness-95 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Start blank"}
            </button>
            <button
              onClick={() => {
                if (!title.trim()) {
                  setError("Give your grid a title first.");
                  return;
                }
                setError("");
                setMode("ai");
              }}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink/20 px-8 font-medium transition-colors hover:bg-ink/5"
            >
              <Sparkles size={18} className="text-accent" />
              Draft my grid with AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
