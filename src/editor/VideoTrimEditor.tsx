import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, X } from "lucide-react";
import { MAX_VIDEO_SECONDS, generateFilmstrip, getVideoDuration, trimAndCompressVideo } from "../lib/video";

/**
 * Loads the local video file directly into a <video> element — no upload
 * needed to trim. The user drags a fixed-width 10s window along a filmstrip
 * timeline; on confirm, only that window is cut and re-encoded client-side
 * via ffmpeg.wasm (loaded here, not before), then handed back as a Blob for
 * the caller to upload.
 */
export function VideoTrimEditor({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (clip: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [windowStart, setWindowStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const objectUrl = useRef<string>("");
  if (!objectUrl.current) objectUrl.current = URL.createObjectURL(file);
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  const windowLen = duration !== null ? Math.min(MAX_VIDEO_SECONDS, duration) : MAX_VIDEO_SECONDS;

  useEffect(() => {
    getVideoDuration(file)
      .then(setDuration)
      .catch(() => setError("Couldn't read that video — try a different file."));
    generateFilmstrip(file).then(setFrames).catch(() => {
      /* filmstrip is a nice-to-have; the scrubber still works without it */
    });
  }, [file]);

  // Loop preview playback within [windowStart, windowStart + windowLen).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (v.currentTime >= windowStart + windowLen) v.currentTime = windowStart;
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [windowStart, windowLen]);

  const seekToWindowStart = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const clampStart = (t: number) => Math.max(0, Math.min(t, (duration ?? windowLen) - windowLen));

  const positionFromClientX = (clientX: number): number => {
    const track = trackRef.current;
    if (!track || duration === null) return windowStart;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clampStart(ratio * duration);
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (duration === null) return;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const next = positionFromClientX(e.clientX);
    setWindowStart(next);
    seekToWindowStart(next);
  };
  const onTrackPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const next = positionFromClientX(e.clientX);
    setWindowStart(next);
    seekToWindowStart(next);
  };
  const endDrag = () => setDragging(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < windowStart || v.currentTime >= windowStart + windowLen) {
        v.currentTime = windowStart;
      }
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const confirm = async () => {
    setProcessing(true);
    setProgress(0);
    setError("");
    try {
      const clip = await trimAndCompressVideo(
        file,
        { startSec: windowStart, durationSec: windowLen, maxDim: 1280 },
        setProgress,
      );
      onConfirm(clip);
    } catch {
      setError("Couldn't process that clip — try a different video or a shorter selection.");
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-paper p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Trim to {MAX_VIDEO_SECONDS} seconds</h2>
          <button
            onClick={onCancel}
            aria-label="Cancel trim"
            disabled={processing}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          This video is longer than {MAX_VIDEO_SECONDS} seconds. Drag the window below to pick which{" "}
          {MAX_VIDEO_SECONDS} seconds to use.
        </p>

        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src={objectUrl.current}
            className="h-full w-full object-contain"
            playsInline
            muted
            onLoadedMetadata={() => seekToWindowStart(windowStart)}
          />
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
        </div>

        {duration !== null ? (
          <div
            ref={trackRef}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative mt-4 h-14 touch-none select-none overflow-hidden rounded-lg bg-ink/10"
          >
            {frames.length > 0 && (
              <div className="absolute inset-0 flex">
                {frames.map((src, i) => (
                  <img key={i} src={src} alt="" draggable={false} className="h-full flex-1 object-cover opacity-70" />
                ))}
              </div>
            )}
            <div
              className="absolute inset-y-0 cursor-grab rounded-md border-2 border-accent bg-accent/25 active:cursor-grabbing"
              style={{
                left: `${(windowStart / duration) * 100}%`,
                width: `${(windowLen / duration) * 100}%`,
              }}
            />
          </div>
        ) : (
          <div className="mt-4 flex h-14 items-center justify-center text-sm text-ink/50">
            Reading video…
          </div>
        )}

        {error && <p className="mt-3 text-sm text-accent-deep">{error}</p>}

        {processing && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-ink/50">Processing… {progress}%</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => void confirm()}
            disabled={duration === null || processing}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-accent font-bold text-ink transition-[filter] hover:brightness-95 disabled:opacity-50"
          >
            {processing && <Loader2 size={18} className="animate-spin" />}
            {processing ? "Processing…" : "Use this clip"}
          </button>
          <button
            onClick={onCancel}
            disabled={processing}
            className="min-h-[48px] rounded-full border border-ink/20 px-6 font-medium transition-colors hover:bg-ink/5 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
