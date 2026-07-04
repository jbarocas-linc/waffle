import type { VercelRequest, VercelResponse } from "@vercel/node";
import { customAlphabet } from "nanoid";
import { fromDb, patchToDb, sbAdmin } from "./_lib/supabase";

const nano = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-");

/**
 * Thin data layer over Supabase. The critical invariant: reads by viewId
 * NEVER include edit_token — possession of the edit URL is the credential.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sb = sbAdmin();

    if (req.method === "GET") {
      const { viewId, editToken } = req.query;
      if (typeof viewId === "string") {
        const { data } = await sb
          .from("grids")
          .select(
            "id,view_id,title,description,size,start_cell,row_labels,col_labels,cells,cover_url,published,created_at,updated_at",
          )
          .eq("view_id", viewId)
          .maybeSingle();
        if (!data) return res.status(404).json({ error: "not found" });
        return res.status(200).json(fromDb(data, false));
      }
      if (typeof editToken === "string") {
        const { data } = await sb.from("grids").select("*").eq("edit_token", editToken).maybeSingle();
        if (!data) return res.status(404).json({ error: "not found" });
        return res.status(200).json(fromDb(data, true));
      }
      return res.status(400).json({ error: "viewId or editToken required" });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const size = Number(body.size);
      if (!body.title || ![2, 3, 4].includes(size)) {
        return res.status(400).json({ error: "title and size (2|3|4) required" });
      }
      const defaultStart = size % 2 === 1 ? Math.floor((size * size) / 2) : (size / 2) * size + size / 2;
      const row = {
        view_id: nano(10),
        edit_token: nano(24),
        title: String(body.title).slice(0, 200),
        description: body.description ? String(body.description).slice(0, 500) : null,
        size,
        start_cell: Number.isInteger(body.startCell) ? body.startCell : defaultStart,
        row_labels: body.rowLabels ?? null,
        col_labels: body.colLabels ?? null,
        cells: Array.isArray(body.cells) && body.cells.length === size * size
          ? body.cells
          : Array(size * size).fill(null),
        published: false,
      };
      const { data, error } = await sb.from("grids").insert(row).select("*").single();
      if (error) throw error;
      return res.status(201).json(fromDb(data, true));
    }

    if (req.method === "PATCH") {
      const { editToken, patch } = req.body ?? {};
      if (typeof editToken !== "string" || typeof patch !== "object" || !patch) {
        return res.status(400).json({ error: "editToken and patch required" });
      }
      const { data, error } = await sb
        .from("grids")
        .update(patchToDb(patch))
        .eq("edit_token", editToken)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
}
