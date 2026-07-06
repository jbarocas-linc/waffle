import type { FFmpeg } from "@ffmpeg/ffmpeg";

/** Videos at or under this length upload as-is — no trim editor needed. */
export const MAX_VIDEO_SECONDS = 10;

export function getVideoDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that video — try a different file."));
    };
    video.src = url;
  });
}

// ffmpeg.wasm is a large runtime (~25–30MB core) — only ever imported when a
// long video actually needs trimming, never on initial page load.
let ffmpegPromise: Promise<FFmpeg> | null = null;

async function loadFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })().catch((err) => {
      ffmpegPromise = null; // allow retry on next call instead of caching a failure forever
      throw err;
    });
  }
  return ffmpegPromise;
}

/**
 * Cuts [startSec, startSec + durationSec) out of `file`, scales to `maxDim`
 * on the long edge, and re-encodes as H.264/AAC mp4 — broadly playable
 * (including Safari, which WebM/VP9 isn't) at roughly 2–4MB for a 10s clip.
 */
export async function trimAndCompressVideo(
  file: File,
  opts: { startSec: number; durationSec: number; maxDim?: number },
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await loadFfmpeg();
  const maxDim = opts.maxDim ?? 1280;

  const inExt = file.name.match(/\.\w+$/)?.[0] || ".mp4";
  const inName = `in${inExt}`;
  const outName = "out.mp4";

  const onFfmpegProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(99, Math.max(0, Math.round(progress * 100))));
  };
  ffmpeg.on("progress", onFfmpegProgress);

  try {
    await ffmpeg.writeFile(inName, await fetchFile(file));
    await ffmpeg.exec([
      "-ss", String(opts.startSec),
      "-i", inName,
      "-t", String(opts.durationSec),
      "-vf", `scale='min(${maxDim},iw)':-2`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
      outName,
    ]);
    const data = await ffmpeg.readFile(outName);
    onProgress?.(100);
    // Re-wrap: ffmpeg.wasm's typings allow a SharedArrayBuffer-backed view,
    // which Blob's constructor type doesn't accept — copy into a plain one.
    return new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onFfmpegProgress);
    await ffmpeg.deleteFile(inName).catch(() => {});
    await ffmpeg.deleteFile(outName).catch(() => {});
  }
}

/** Evenly-spaced thumbnail frames for the trim editor's filmstrip. */
export async function generateFilmstrip(file: File, count = 10): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Couldn't read that video."));
    });
    const duration = video.duration;
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d")!;
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = Math.min(duration - 0.05, (duration * i) / count);
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.6));
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = t;
      });
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}
