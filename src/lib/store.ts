import type { CreateGridInput, GridPatch, GridRecord, PublicGrid } from "../types";
import { newMediaKey } from "./ids";
import { demoGrid } from "../data/demoGrid";

export interface GridStore {
  getByViewId(viewId: string): Promise<PublicGrid | null>;
  getByEditToken(editToken: string): Promise<GridRecord | null>;
  create(input: CreateGridInput): Promise<GridRecord>;
  update(editToken: string, patch: GridPatch): Promise<void>;
  uploadMedia(gridId: string, file: File): Promise<string>;
}

// ---------------------------------------------------------------------------
// Grids talk to /api/grids (Supabase behind a thin server layer, so edit
// tokens never leak on the view path). Media uploads go straight to Supabase
// Storage from the browser using the anon key — there is no local fallback,
// so misconfigured Supabase env vars surface as a real error, not a silent
// downgrade to a 4 MB localStorage limit.
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

// HTML detection also checks the extension: some iOS flows mistag .html
// attachments as text/plain, and the 2 MB HTML cap must still apply to them.
const isHtmlFile = (f: File) => f.type === "text/html" || /\.html?$/i.test(f.name);

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
  async uploadMedia(gridId, file) {
    const rule = UPLOAD_LIMITS.find((r) => r.test(file))!;
    if (file.size > rule.max) throw new Error(`Too large — ${rule.label.toLowerCase()}.`);
    const { url, anonKey } = requireSupabaseEnv();
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, anonKey);
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const key = `${gridId}/${newMediaKey()}.${ext}`;
    // Serve mistagged .html uploads as text/html so embed iframes execute
    // them instead of showing source text.
    const contentType = isHtmlFile(file) ? "text/html" : file.type || "application/octet-stream";
    const { error } = await sb.storage.from("media").upload(key, file, { contentType });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return sb.storage.from("media").getPublicUrl(key).data.publicUrl;
  },
};
