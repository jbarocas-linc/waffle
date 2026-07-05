import { X } from "lucide-react";
import type { GridRecord } from "../types";
import { appOrigin } from "../lib/format";
import { CopyButton } from "../components/CopyButton";
import { WaffleMark } from "../components/WaffleLogo";

export function SharePanel({ grid, onClose }: { grid: GridRecord; onClose: () => void }) {
  const viewUrl = `${appOrigin()}/g/${grid.viewId}`;
  const editUrl = `${appOrigin()}/edit/${grid.editToken}`;
  const embedSnippet = `<div style="position:relative;width:100%;max-width:480px;aspect-ratio:9/16;margin:auto">
  <iframe src="${viewUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" allow="fullscreen" loading="lazy"></iframe>
</div>`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <button aria-label="Close share panel" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WaffleMark size={28} />
            <h2 className="font-display text-2xl font-semibold">Share</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X size={20} />
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">View link</h3>
          <p className="mt-1 text-sm text-ink/60">
            For Zoom chat, iMessage, email — anyone with this link can view.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-h-[44px] flex-1 truncate rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-xs leading-relaxed">
              {viewUrl}
            </code>
            <CopyButton text={viewUrl} />
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Embed (Thinkific)</h3>
          <p className="mt-1 text-sm text-ink/60">
            In Thinkific, add a Multimedia/HTML block and paste this.
          </p>
          <div className="mt-2">
            <pre className="max-h-32 overflow-auto rounded-xl border border-ink/10 bg-white p-3 text-[10px] leading-relaxed">
              {embedSnippet}
            </pre>
            <div className="mt-2">
              <CopyButton text={embedSnippet} label="Copy embed code" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border-2 border-accent/30 bg-accent/5 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent-deep">Edit link</h3>
          <p className="mt-1 text-sm text-ink/70">
            Anyone with this link can edit. Save it — it's the only way back.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-h-[44px] flex-1 truncate rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-xs leading-relaxed">
              {editUrl}
            </code>
            <CopyButton text={editUrl} />
          </div>
        </section>
      </div>
    </div>
  );
}
