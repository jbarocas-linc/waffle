# Waffle

Swipeable learning grids: a 2×2, 3×3, or 4×4 grid of full-screen tiles a viewer
explores by swiping in any of four directions. Built for teacher PD shared via
Thinkific (iframe embed), Zoom (link), and iMessage (link). No accounts — the
edit URL is the credential.

## Run it locally (zero setup)

```sh
npm install
npm run dev
```

Local mode (`VITE_DATA_BACKEND=local`, the default) stores grids in
localStorage and uploads as data URLs — the full create → edit → share → view
loop works with no backend. A built-in demo grid lives at `/g/demo` and
exercises every tile type. Note: the AI buttons and link-metadata autofill call
`/api/*`, which only exists on Vercel — locally they fail gracefully and the
app is 100% usable without them.

## Deploy (Vercel + Supabase)

1. **Supabase**: create a project, run `supabase-schema.sql` in the SQL editor
   (creates the `grids` table + public `media` storage bucket).
2. **Vercel**: import this repo. Framework preset: Vite. Set env vars:

   | var | notes |
   |---|---|
   | `VITE_DATA_BACKEND` | `api` |
   | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client-side, media uploads only |
   | `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | server only |
   | `ANTHROPIC_API_KEY` | server only — powers the two AI assists |
   | `PUBLIC_APP_URL` | e.g. `https://waffle.vercel.app` |

3. Deploy. `vercel.json` rewrites `/g/:viewId` through `api/view-meta.ts` so
   link unfurls (iMessage, Slack) carry real OG tags + a generated cover image
   (`api/og.tsx`), while humans get the normal SPA.

## Architecture

```
src/viewer/    Stage.tsx (gesture/snap engine), MapOverlay, IntroScreen,
               tiles/TileView.tsx (all 7 tile renderers)
src/editor/    cell grid, per-type tile editors, share panel, AI assists
src/lib/store.ts  data layer — localStorage adapter or /api/grids adapter
api/           Vercel functions: grids CRUD, draft-grid + assist-text (Claude),
               link-meta fetcher, og image, view-meta injection
```

Key invariants:

- **`edit_token` never leaves the server on the view path.** Viewer reads go
  through `GET /api/grids?viewId=` which selects every column except it.
- **Adjacency-only navigation**; the map overlay is informational, never
  tappable. No progress state anywhere — deliberate.
- **Embeds are sandboxed** (`sandbox="allow-scripts"`, never
  `allow-same-origin`), with 24px edge grab-zones so the viewer can always
  swipe away from an interactive tile.
- Media pause: the active-tile flag flips the instant a navigation commits, so
  YouTube/Vimeo/native video pause before the slide animation ends.

## Embedding in Thinkific

Share panel → "Embed" → paste into a Multimedia/HTML block:

```html
<div style="position:relative;width:100%;max-width:480px;aspect-ratio:9/16;margin:auto">
  <iframe src="https://YOUR-APP/g/VIEW_ID" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" allow="fullscreen" loading="lazy"></iframe>
</div>
```
