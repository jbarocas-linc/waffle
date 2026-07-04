import type { CreateGridInput, GridPatch, GridRecord, PublicGrid } from "../types";
import { defaultStartCell } from "../types";
import { newEditToken, newId, newMediaKey, newViewId } from "./ids";
import { fileToDataURL } from "./format";
import { demoGrid } from "../data/demoGrid";

export interface GridStore {
  getByViewId(viewId: string): Promise<PublicGrid | null>;
  getByEditToken(editToken: string): Promise<GridRecord | null>;
  create(input: CreateGridInput): Promise<GridRecord>;
  update(editToken: string, patch: GridPatch): Promise<void>;
  uploadMedia(gridId: string, file: File): Promise<string>;
}

// ---------------------------------------------------------------------------
// Local adapter — grids live in localStorage. Zero-setup development mode.
// ---------------------------------------------------------------------------

const LS_KEY = "waffle:grids:v1";

function loadAll(): Record<string, GridRecord> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, GridRecord>) {
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

function buildRecord(input: CreateGridInput): GridRecord {
  const now = new Date().toISOString();
  const total = input.size * input.size;
  return {
    id: newId(),
    viewId: newViewId(),
    editToken: newEditToken(),
    title: input.title,
    description: input.description ?? null,
    size: input.size,
    startCell: input.startCell ?? defaultStartCell(input.size),
    rowLabels: input.rowLabels ?? null,
    colLabels: input.colLabels ?? null,
    cells: input.cells ?? Array(total).fill(null),
    coverUrl: null,
    published: false,
    createdAt: now,
    updatedAt: now,
  };
}

const localStore: GridStore = {
  async getByViewId(viewId) {
    if (viewId === demoGrid.viewId) return demoGrid;
    const rec = Object.values(loadAll()).find((g) => g.viewId === viewId);
    if (!rec) return null;
    const { editToken: _omit, ...pub } = rec;
    return pub;
  },
  async getByEditToken(editToken) {
    return Object.values(loadAll()).find((g) => g.editToken === editToken) ?? null;
  },
  async create(input) {
    const rec = buildRecord(input);
    const all = loadAll();
    all[rec.id] = rec;
    saveAll(all);
    return rec;
  },
  async update(editToken, patch) {
    const all = loadAll();
    const rec = Object.values(all).find((g) => g.editToken === editToken);
    if (!rec) throw new Error("Grid not found");
    Object.assign(rec, patch, { updatedAt: new Date().toISOString() });
    saveAll(all);
  },
  async uploadMedia(_gridId, file) {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error("Local mode supports uploads up to 4 MB. Connect Supabase for larger files.");
    }
    return fileToDataURL(file);
  },
};

// ---------------------------------------------------------------------------
// API adapter — talks to /api/grids (Supabase behind a thin server layer, so
// edit tokens never leak on the view path). Uploads go straight to Storage.
// ---------------------------------------------------------------------------

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (res.status === 404) return null as T;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

const UPLOAD_LIMITS: { test: (f: File) => boolean; max: number; label: string }[] = [
  { test: (f) => f.type.startsWith("video/"), max: 100 * 1024 * 1024, label: "Video up to 100 MB" },
  { test: (f) => f.type === "application/pdf", max: 25 * 1024 * 1024, label: "PDFs up to 25 MB" },
  { test: (f) => f.type === "text/html", max: 2 * 1024 * 1024, label: "HTML up to 2 MB" },
  { test: () => true, max: 10 * 1024 * 1024, label: "Images and GIFs up to 10 MB" },
];

const apiStore: GridStore = {
  async getByViewId(viewId) {
    if (viewId === demoGrid.viewId) return demoGrid;
    return jsonFetch<PublicGrid | null>(`/api/grids?viewId=${encodeURIComponent(viewId)}`);
  },
  async getByEditToken(editToken) {
    return jsonFetch<GridRecord | null>(`/api/grids?editToken=${encodeURIComponent(editToken)}`);
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
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const key = `${gridId}/${newMediaKey()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(key, file, { contentType: file.type });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return sb.storage.from("media").getPublicUrl(key).data.publicUrl;
  },
};

export const store: GridStore =
  import.meta.env.VITE_DATA_BACKEND === "api" ? apiStore : localStore;

export const isApiBackend = import.meta.env.VITE_DATA_BACKEND === "api";
