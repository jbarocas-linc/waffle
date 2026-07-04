import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sbAdmin } from "./_lib/supabase";

/**
 * Serves /g/:viewId with correct OG meta tags injected into the SPA shell so
 * iMessage/Slack/social unfurls look intentional (crawlers don't run JS).
 * Wired via the vercel.json rewrite; humans get the same shell and the app
 * boots normally.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const viewId = typeof req.query.viewId === "string" ? req.query.viewId : "";
  const appUrl = process.env.PUBLIC_APP_URL ?? `https://${req.headers.host}`;

  let title = "Waffle";
  let description = "Bite-sized learning grids you swipe through in any direction.";
  let cover: string | null = null;

  if (viewId) {
    try {
      const { data } = await sbAdmin()
        .from("grids")
        .select("title,description,cover_url")
        .eq("view_id", viewId)
        .maybeSingle();
      if (data) {
        title = data.title;
        description = data.description ?? description;
        cover = data.cover_url ?? `${appUrl}/api/og?viewId=${encodeURIComponent(viewId)}`;
      }
    } catch {
      /* fall through with defaults */
    }
  }

  const shellRes = await fetch(`${appUrl}/index.html`);
  let html = await shellRes.text();

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const tags = [
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(`${appUrl}/g/${viewId}`)}" />`,
    cover ? `<meta property="og:image" content="${esc(cover)}" />` : "",
    `<meta name="twitter:card" content="${cover ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    cover ? `<meta name="twitter:image" content="${esc(cover)}" />` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} — Waffle</title>`)
    .replace("</head>", `    ${tags}\n  </head>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  return res.status(200).send(html);
}
