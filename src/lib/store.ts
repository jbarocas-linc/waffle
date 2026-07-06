import type { CreateGridInput, GridPatch, GridRecord, PublicGrid } from "../types";
import { newMediaKey } from "./ids";
import { demoGrid } from "../data/demoGrid";
import { compressImage } from "./imageCompression";
import { isHtmlFile } from "./format";
import { publicStorageUrl, uploadToSupabaseStorage } from "./uploadTransport";

export interface GridStore {
  getByViewId(viewId: string): Promise<PublicGrid | null>;
  getByEditToken(editToken: string): Promise<GridRecord | null>;
  create(input: CreateGridInput): Promise<GridRecord>;
  update(editToken: string, patch: GridPatch): Promise<void>;
  /** Compresses images automatically; uploads the file as-is otherwise. */
  uploadMedia(gridId: string, file: File, onProgress?: (pct: number) => void): Promise<string>;
  /** For pre-processed payloads (e.g. a trimmed video clip) — skips compression. */
  uploadProcessedClip(
    gridId: string,
    originalFile: File,
    clip: Blob,
    onProgress?: (pct: number) => void,
  ): Promise<string>;
}

// ---------------------------------------------------------------------------
// Grids talk to /api/grids (Supabase behind a thin server layer, so edit
// tokens never leak on the view path). Media uploads go straight to Supabase
// Storage from the browser via XHR (for real progress events) using the anon
// key — there is no local fallback and no server hop for file bytes, so
// misconfigured Supabase env vars surface as a real error, not a silent
// downgrade, and large uploads never touch Vercel's ~4.5MB function body cap.
// ---------------------------------------------------------------------------

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

/** Only GET lookups treat a 404 as "not found" rather than a real error. */
async function jsonFetchOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

const UPLOAD_LIMITS: { test: (f: File) => boolean; max: number; label: string }[] = [
  { test: (f) => f.type.startsWith("video/"), max: 100 * 1024 * 1024, label: "Video up to 100 MB" },
  { test: (f) => f.type === "application/pdf", max: 25 * 1024 * 1024, label: "PDFs up to 25 MB" },
  { test: isHtmlFile, max: 2 * 1024 * 1024, label: "HTML up to 2 MB" },
  { test: () => true, max: 10 * 1024 * 1024, label: "Images and GIFs up to 10 MB" },
];

function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase isn't configured for this deployment (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). " +
        "Set both in your Vercel project's environment variables and redeploy.",
    );
  }
  return { url, anonKey };
}

async function uploadBlob(
  gridId: string,
  originalFile: File,
  payload: Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const { url, anonKey } = requireSupabaseEnv();
  const ext = originalFile.name.split(".").pop()?.toLowerCase() || "bin";
  const key = `${gridId}/${newMediaKey()}.${ext}`;
  const contentType = isHtmlFile(originalFile)
    ? "text/html"
    : payload.type || originalFile.type || "application/octet-stream";
  await uploadToSupabaseStorage(url, anonKey, "media", key, payload, contentType, onProgress);
  return publicStorageUrl(url, "media", key);
}

export const store: GridStore = {
  async getByViewId(viewId) {
    if (viewId === demoGrid.viewId) return demoGrid;
    return jsonFetchOrNull<PublicGrid>(`/api/grids?viewId=${encodeURIComponent(viewId)}`);
  },
  async getByEditToken(editToken) {
    return jsonFetchOrNull<GridRecord>(`/api/grids?editToken=${encodeURIComponent(editToken)}`);
  },
  async create(input) {
    return jsonFetch<GridRecord>("/api/grids", { method: "POST", body: JSON.stringify(input) });
  },
  async update(editToken, patch) {
    await jsonFetch("/api/grids", { method: "PATCH", body: JSON.stringify({ editToken, patch }) });
  },
  async uploadMedia(gridId, file, onProgress) {
    let payload: Blob = file;
    if (file.type.startsWith("image/") && file.type !== "image/gif") {
      payload = await compressImage(file);
    }
    const rule = UPLOAD_LIMITS.find((r) => r.test(file))!;
    if (payload.size > rule.max) throw new Error(`Too large — ${rule.label.toLowerCase()}.`);
    return uploadBlob(gridId, file, payload, onProgress);
  },
  async uploadProcessedClip(gridId, originalFile, clip, onProgress) {
    if (clip.size > 100 * 1024 * 1024) throw new Error("Too large — video up to 100 MB.");
    return uploadBlob(gridId, originalFile, clip, onProgress);
  },
};
