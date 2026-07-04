import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

/**
 * Cover/OG image: title + the waffle pattern with filled cells tinted.
 * Fetched on demand (og:image points here), so no publish-time generation
 * job is needed — first publish just sets cover_url to this URL.
 */
export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const viewId = searchParams.get("viewId") ?? "";

  let title = "Waffle";
  let description = "Swipe through ideas in any direction";
  let size = 3;
  let filled: boolean[] = Array(9).fill(true);

  if (viewId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const resp = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/grids?view_id=eq.${encodeURIComponent(viewId)}&select=title,description,size,cells`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        },
      );
      const rows = await resp.json();
      if (Array.isArray(rows) && rows[0]) {
        title = rows[0].title ?? title;
        description = rows[0].description ?? "";
        size = rows[0].size ?? 3;
        filled = (rows[0].cells ?? []).map((c: unknown) => Boolean(c));
      }
    } catch {
      /* render defaults */
    }
  }

  const accents = ["#EE9E31", "#D98F58", "#C9D8C5", "#D9CBE3", "#EFD9B4", "#A9C0CE"];
  const cell = size === 4 ? 64 : size === 3 ? 84 : 116;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#2B211A",
          padding: "72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 48 }}>
          <div style={{ color: "#EE9E31", fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
            Waffle
          </div>
          <div
            style={{
              color: "#F4F1EA",
              fontSize: title.length > 40 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 20,
              maxWidth: 640,
            }}
          >
            {title}
          </div>
          {description ? (
            <div style={{ color: "rgba(244,241,234,0.65)", fontSize: 28, marginTop: 24, maxWidth: 620 }}>
              {description.slice(0, 120)}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: size * (cell + 12),
            gap: 12,
          }}
        >
          {Array.from({ length: size * size }, (_, i) => (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                borderRadius: 14,
                background: filled[i] ? accents[i % accents.length] : "rgba(244,241,234,0.07)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
