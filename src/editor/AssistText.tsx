import { useState } from "react";
import { Sparkles, X } from "lucide-react";

/**
 * "Help with text" — draft from a rough note or tighten what's in the field.
 * Suggestions never overwrite silently; the creator chooses Use / Try again /
 * Dismiss.
 */
export function AssistText({
  currentText,
  context,
  onUse,
}: {
  currentText: string;
  context: string;
  onUse: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"draft" | "tighten" | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (m: "draft" | "tighten") => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/assist-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, text: m === "draft" ? note : currentText, context }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (typeof data.text !== "string") throw new Error("bad shape");
      setResult(data.text);
    } catch {
      setError("Couldn't help right now — you can write it yourself.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setMode(null);
    setResult(null);
    setNote("");
    setError("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent-deep hover:text-ink"
      >
        <Sparkles size={13} />
        Help with text
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles size={14} className="text-accent" />
          Help with text
        </span>
        <button
          type="button"
          aria-label="Close text help"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/10"
        >
          <X size={14} />
        </button>
      </div>

      {result !== null ? (
        <div className="mt-2">
          <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-[13px] leading-relaxed">
            {result}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onUse(result);
                setOpen(false);
                reset();
              }}
              className="min-h-[36px] rounded-full bg-accent px-4 text-xs font-bold text-ink hover:brightness-95"
            >
              Use
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(mode!)}
              className="min-h-[36px] rounded-full border border-ink/20 px-4 text-xs font-medium hover:bg-ink/5 disabled:opacity-50"
            >
              {busy ? "Thinking…" : "Try again"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="min-h-[36px] px-2 text-xs text-ink/55 hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : mode === "draft" ? (
        <div className="mt-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Rough note — e.g., 'pause 3 sec after questions, more kids answer'"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          {error && <p className="mt-1 text-xs text-accent-deep">{error}</p>}
          <button
            type="button"
            disabled={busy || !note.trim()}
            onClick={() => void run("draft")}
            className="mt-2 min-h-[36px] rounded-full bg-accent px-4 text-xs font-bold text-ink hover:brightness-95 disabled:opacity-50"
          >
            {busy ? "Drafting…" : "Draft it"}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMode("draft")}
            className="min-h-[40px] rounded-lg border border-ink/15 bg-white px-3 text-left text-[13px] hover:border-accent"
          >
            <span className="font-medium">Draft from a note</span> — type a rough idea, get clean copy
          </button>
          <button
            type="button"
            disabled={busy || !currentText.trim()}
            onClick={() => {
              setMode("tighten");
              void run("tighten");
            }}
            className="min-h-[40px] rounded-lg border border-ink/15 bg-white px-3 text-left text-[13px] hover:border-accent disabled:opacity-40"
          >
            <span className="font-medium">Tighten this</span> — shorter and clearer
          </button>
          {error && <p className="text-xs text-accent-deep">{error}</p>}
        </div>
      )}
    </div>
  );
}
