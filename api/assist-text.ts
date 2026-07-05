import type { VercelRequest, VercelResponse } from "@vercel/node";
import { anthropic, extractText, MODEL, stripFences } from "./_lib/ai.js";
import { rateLimited } from "./_lib/ratelimit.js";

/**
 * "Help with text" — draft copy from a rough note, or tighten existing copy.
 * Returns { text }. Never applied client-side without explicit "Use".
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (rateLimited(req, 20)) return res.status(429).json({ error: "rate limited" });

  const { mode, text, context } = req.body ?? {};
  if ((mode !== "draft" && mode !== "tighten") || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "mode (draft|tighten) and text required" });
  }

  const schema = {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"],
    additionalProperties: false,
  } as const;

  const system = `You write copy for full-screen tiles in a swipeable micro-learning app. Voice: warm, editorial, plain language, second person, zero jargon. Tiles are read on a phone in seconds — every word earns its place. Preserve line breaks as paragraph separators.
${typeof context === "string" && context.trim() ? `Context for this text: ${context.trim()}` : ""}
Return ONLY a JSON object: {"text": "..."}.`;

  const instruction =
    mode === "draft"
      ? `Write tile copy from this rough note. Keep it under ~80 words:\n\n${text.trim().slice(0, 2000)}`
      : `Rewrite this to be shorter and clearer, keeping the author's meaning and warmth:\n\n${text.trim().slice(0, 2000)}`;

  try {
    const client = anthropic();
    let result: { text: string } | null = null;

    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema },
        },
        system,
        messages: [{ role: "user", content: instruction }],
      });
      if (message.stop_reason === "refusal") break;
      try {
        const parsed = JSON.parse(stripFences(extractText(message)));
        if (typeof parsed.text === "string") result = parsed;
      } catch {
        result = null; // retry once
      }
    }

    if (!result) return res.status(502).json({ error: "assist failed" });
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "assist failed" });
  }
}
