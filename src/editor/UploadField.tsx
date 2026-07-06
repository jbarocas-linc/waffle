import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { store } from "../lib/store";
import { MAX_VIDEO_SECONDS, getVideoDuration } from "../lib/video";
import { VideoTrimEditor } from "./VideoTrimEditor";

export function UploadField({
  accept,
  gridId,
  label,
  kind,
  onUploaded,
}: {
  accept: string;
  gridId: string;
  label: string;
  /** "video" gates files over MAX_VIDEO_SECONDS into the trim editor instead of uploading directly. */
  kind?: "video";
  onUploaded: (url: string, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [trimFile, setTrimFile] = useState<File | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setProgress(0);
    setError("");
    try {
      const url = await store.uploadMedia(gridId, file, setProgress);
      onUploaded(url, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setError("");

    if (kind === "video") {
      setBusy(true);
      let duration: number;
      try {
        duration = await getVideoDuration(file);
      } catch (err) {
        setBusy(false);
        setError(err instanceof Error ? err.message : "Couldn't read that video.");
        return;
      }
      setBusy(false);
      if (duration > MAX_VIDEO_SECONDS) {
        setTrimFile(file);
        return;
      }
    }

    void upload(file);
  };

  const confirmTrim = async (clip: Blob) => {
    const original = trimFile!;
    setTrimFile(null);
    setBusy(true);
    setProgress(0);
    setError("");
    try {
      const url = await store.uploadProcessedClip(gridId, original, clip, setProgress);
      onUploaded(url, original);
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
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {busy ? (progress > 0 ? `Uploading… ${progress}%` : "Uploading…") : label}
      </button>
      {busy && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-accent-deep">{error}</p>}

      {trimFile && (
        <VideoTrimEditor
          file={trimFile}
          onCancel={() => setTrimFile(null)}
          onConfirm={(clip) => void confirmTrim(clip)}
        />
      )}
    </div>
  );
}
