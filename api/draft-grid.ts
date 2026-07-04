import type { VercelRequest, VercelResponse } from "@vercel/node";
import { anthropic, extractText, MODEL, stripFences } from "./_lib/ai";
import { rateLimited } from "./_lib/ratelimit";

/**
 * "Draft my grid" — returns a proposal the creator reviews before accepting:
 * { rowLabels, colLabels, startCell, cells: [{title, brief} | null] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (rateLimited(req)) return res.status(429).json({ error: "rate limited" });

  const { topic, audience, notes, size } = req.body ?? {};
  const gridSize = Number(size);
  if (typeof topic !== "string" || !topic.trim() || ![2, 3, 4].includes(gridSize)) {
    return res.status(400).json({ error: "topic and size (2|3|4) required" });
  }
  const total = gridSize * gridSize;
  const defaultStart =
    gridSize % 2 === 1 ? Math.floor((total - 1) / 2) : (gridSize / 2) * gridSize + gridSize / 2;

  // Structured outputs guarantee valid JSON; the fence-strip parse is a belt-
  // and-suspenders fallback (e.g. refusal or truncated output).
  const schema = {
    type: "object",
    properties: {
      rowLabels: {
        anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      },
      colLabels: {
        anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      },
      startCell: { type: "integer" },
      cells: {
        type: "array",
        items: {
          anyOf: [
            {
              type: "object",
              properties: { title: { type: "string" }, brief: { type: "string" } },
              required: ["title", "brief"],
              additionalProperties: false,
            },
            { type: "null" },
          ],
        },
      },
    },
    required: ["rowLabels", "colLabels", "startCell", "cells"],
    additionalProperties: false,
  } as const;

  const system = `You draft content plans for "swipeable learning grids": a ${gridSize}x${gridSize} grid of full-screen tiles a viewer explores by swiping in any direction. Cells are indexed row-major, 0 to ${total - 1}.

Conceptual convention: columns move from big picture (left) to detail (right); rows increase in complexity top to bottom. The start cell should be a welcoming orientation tile — usually near the center.

For each cell produce a short punchy title (2-6 words) and a brief of 1-3 warm, plain-language sentences a creator will refine. Fill all ${total} cells unless the topic genuinely can't support it (then use null for extras). Row and column labels are optional — propose them only if genuinely clarifying, as 1-2 word phrases; otherwise return null for both. Voice: warm, editorial, second-person, zero jargon. Return ONLY the JSON object.`;

  const userMsg = `Topic: ${topic.trim()}
Audience: ${typeof audience === "string" && audience.trim() ? audience.trim() : "adult learners"}
${typeof notes === "string" && notes.trim() ? `Additional notes: ${notes.trim()}` : ""}`;

  try {
    const client = anthropic();
    let proposal: {
      rowLabels: string[] | null;
      colLabels: string[] | null;
      startCell: number;
      cells: ({ title: string; brief: string } | null)[];
    } | null = null;

    for (let attempt = 0; attempt < 2 && !proposal; attempt++) {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema },
        },
        system,
        messages: [{ role: "user", content: userMsg }],
      });
      if (message.stop_reason === "refusal") break;
      try {
        proposal = JSON.parse(stripFences(extractText(message)));
      } catch {
        proposal = null; // retry once on parse failure
      }
    }

    if (!proposal || !Array.isArray(proposal.cells)) {
      return res.status(502).json({ error: "draft failed" });
    }

    // Normalize: exact cell count, valid labels, in-range start cell.
    const cells = Array.from({ length: total }, (_, i) => {
      const c = proposal!.cells[i];
      return c && typeof c.title === "string" && typeof c.brief === "string"
        ? { title: c.title, brief: c.brief }
        : null;
    });
    const labels = (arr: unknown): string[] | null =>
      Array.isArray(arr) && arr.length === gridSize && arr.every((s) => typeof s === "string")
        ? (arr as string[])
        : null;
    const startCell =
      Number.isInteger(proposal.startCell) &&
      proposal.startCell >= 0 &&
      proposal.startCell < total &&
      cells[proposal.startCell]
        ? proposal.startCell
        : defaultStart;

    return res.status(200).json({
      rowLabels: labels(proposal.rowLabels),
      colLabels: labels(proposal.colLabels),
      startCell,
      cells,
    });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "draft failed" });
  }
}
