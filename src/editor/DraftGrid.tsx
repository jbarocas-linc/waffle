import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { DraftProposal, GridSize } from "../types";
import { defaultStartCell } from "../types";

/**
 * "Draft my grid" — collects topic/audience, asks /api/draft-grid for a
 * proposal, renders it fully editable, and only ever applies on Accept.
 */
export function DraftGridForm({
  size,
  onAccept,
  onCancel,
}: {
  size: GridSize;
  onAccept: (proposal: DraftProposal) => void;
  onCancel: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<DraftProposal | null>(null);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/draft-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, notes, size }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: DraftProposal = await res.json();
      if (!Array.isArray(data.cells) || data.cells.length !== size * size) {
        throw new Error("bad shape");
      }
      setProposal(data);
    } catch {
      setError("Couldn't draft right now — you can fill this in yourself.");
    } finally {
      setBusy(false);
    }
  };

  const patchCell = (i: number, field: "title" | "brief", value: string) => {
    setProposal((p) => {
      if (!p) return p;
      const cells = [...p.cells];
      const cur = cells[i] ?? { title: "", brief: "" };
      cells[i] = { ...cur, [field]: value };
      return { ...p, cells };
    });
  };

  if (proposal) {
    return (
      <div>
        <h3 className="font-display text-xl font-semibold">Here's a draft — edit anything</h3>
        <p className="mt-1 text-sm text-ink/60">
          Columns move big picture → detail; rows step up in complexity. Nothing is applied until you
          accept.
        </p>
        {(proposal.colLabels || proposal.rowLabels) && (
          <p className="mt-2 text-xs text-ink/50">
            Suggested labels: {proposal.colLabels?.join(" / ")}
            {proposal.rowLabels ? ` × ${proposal.rowLabels.join(" / ")}` : ""}
          </p>
        )}
        <div
          className="mt-4 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {proposal.cells.map((cellDraft, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2 ${
                i === proposal.startCell ? "border-accent bg-accent/5" : "border-ink/10 bg-white"
              }`}
            >
              <input
                value={cellDraft?.title ?? ""}
                onChange={(e) => patchCell(i, "title", e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-ink/30"
              />
              <textarea
                value={cellDraft?.brief ?? ""}
                onChange={(e) => patchCell(i, "brief", e.target.value)}
                placeholder="Brief"
                rows={3}
                className="mt-1 w-full resize-none bg-transparent text-[11px] leading-snug outline-none placeholder:text-ink/30"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onAccept(proposal)}
            className="min-h-[48px] flex-1 rounded-full bg-accent px-6 font-bold text-ink transition-[filter] hover:brightness-95"
          >
            Accept draft
          </button>
          <button
            onClick={() => setProposal(null)}
            className="min-h-[48px] rounded-full border border-ink/20 px-6 font-medium transition-colors hover:bg-ink/5"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={request}>
      <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Sparkles size={20} className="text-accent" />
        Draft my grid
      </h3>
      <p className="mt-1 text-sm text-ink/60">
        Claude sketches a starting point in text — you review and edit before anything lands.
      </p>
      <label className="mt-4 block text-sm font-medium">
        Topic
        <input
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Wait time in classroom questioning"
          className="mt-1 min-h-[48px] w-full rounded-xl border border-ink/15 bg-white px-4 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Audience
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., K–5 teachers new to the practice"
          className="mt-1 min-h-[48px] w-full rounded-xl border border-ink/15 bg-white px-4 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Anything else? <span className="font-normal text-ink/50">(optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </label>
      {error && <p className="mt-3 text-sm text-accent-deep">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] flex-1 rounded-full bg-accent px-6 font-bold text-ink transition-[filter] hover:brightness-95 disabled:opacity-50"
        >
          {busy ? "Drafting…" : "Draft it"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] rounded-full border border-ink/20 px-6 font-medium transition-colors hover:bg-ink/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function proposalStartCell(p: DraftProposal, size: GridSize): number {
  const s = p.startCell;
  if (Number.isInteger(s) && s >= 0 && s < size * size && p.cells[s]) return s;
  return defaultStartCell(size);
}
