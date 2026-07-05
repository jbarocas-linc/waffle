import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rateLimited } from "./_lib/ratelimit.js";

/** Fetch a page's title/description/OG image for link tiles (save-time only). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  if (rateLimited(req, 20)) return res.status(429).json({ error: "rate limited" });

  const raw = req.query.url;
  if (typeof raw !== "string") return res.status(400).json({ error: "url required" });

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return res.status(400).json({ error: "invalid url" });
  }
  // Basic SSRF guard: public http(s) hosts only.
  const host = url.hostname;
  if (
    !/^https?:$/.test(url.protocol) ||
    host === "localhost" ||
    /^(\d+\.){3}\d+$/.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return res.status(400).json({ error: "unsupported url" });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const page = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "WaffleLinkPreview/1.0 (+link cards)" },
    });
    clearTimeout(timer);
    const html = (await page.text()).slice(0, 300_000);

    const meta = (prop: string): string | null => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
        "i",
      );
      const m = html.match(re);
      return m ? decodeEntities(m[1] ?? m[2]) : null;
    };
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    let image = meta("og:image") ?? meta("twitter:image");
    if (image && image.startsWith("/")) image = `${url.origin}${image}`;

    return res.status(200).json({
      title: meta("og:title") ?? (titleTag ? decodeEntities(titleTag[1].trim()) : null),
      description: meta("og:description") ?? meta("description"),
      image,
    });
  } catch {
    return res.status(200).json({ title: null, description: null, image: null });
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}
