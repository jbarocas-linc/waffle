import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { store } from "../lib/store";

export function UploadField({
  accept,
  gridId,
  label,
  onUploaded,
}: {
  accept: string;
  gridId: string;
  label: string;
  onUploaded: (url: string, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await store.uploadMedia(gridId, file);
      onUploaded(url, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handle(e.dataTransfer.files[0]);
        }}
        disabled={busy}
        className={`flex min-h-[64px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-sm font-medium transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-ink/20 hover:border-ink/40"
        } disabled:opacity-50`}
      >
        <Upload size={18} />
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-accent-deep">{error}</p>}
    </div>
  );
}
