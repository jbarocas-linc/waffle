import { useState } from "react";
import { KeyRound } from "lucide-react";
import { CopyButton } from "../components/CopyButton";

/**
 * Shown once, right after creation. There are no accounts — the edit URL is
 * the credential — so this modal can only be dismissed by copying the link.
 */
export function EditLinkModal({ editUrl, onDismiss }: { editUrl: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-5">
      <div className="w-full max-w-md rounded-3xl bg-paper p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-deep">
          <KeyRound size={26} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          Copy your edit link
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
          This is the <strong>only way back</strong> to editing this grid — there are no accounts.
          Keep it somewhere safe (notes, bookmarks, an email to yourself).
        </p>
        <code className="mt-4 block truncate rounded-xl border border-ink/10 bg-white px-3 py-3 text-xs">
          {editUrl}
        </code>
        <div className="mt-4 flex flex-col gap-2">
          <CopyButton
            text={editUrl}
            label="Copy edit link"
            onCopied={() => setCopied(true)}
            className="w-full justify-center !bg-accent font-bold !text-ink hover:brightness-95"
          />
          <button
            onClick={onDismiss}
            disabled={!copied}
            className="min-h-[44px] rounded-full text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 disabled:opacity-35"
          >
            {copied ? "Done — take me to my grid" : "Copy the link to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
