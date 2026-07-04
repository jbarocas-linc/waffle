import { createClient } from "@supabase/supabase-js";

export function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Map a DB row (snake_case) to the app's GridRecord shape. */
export function fromDb(row: Record<string, unknown>, includeEditToken: boolean) {
  const rec: Record<string, unknown> = {
    id: row.id,
    viewId: row.view_id,
    title: row.title,
    description: row.description,
    size: row.size,
    startCell: row.start_cell,
    rowLabels: row.row_labels,
    colLabels: row.col_labels,
    cells: row.cells,
    coverUrl: row.cover_url,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeEditToken) rec.editToken = row.edit_token;
  return rec;
}

const PATCHABLE: Record<string, string> = {
  title: "title",
  description: "description",
  startCell: "start_cell",
  rowLabels: "row_labels",
  colLabels: "col_labels",
  cells: "cells",
  published: "published",
  coverUrl: "cover_url",
};

export function patchToDb(patch: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(PATCHABLE)) {
    if (key in patch) out[col] = patch[key];
  }
  out.updated_at = new Date().toISOString();
  return out;
}
