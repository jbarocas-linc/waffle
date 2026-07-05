# Waffle

Swipeable learning grids: a 2×2, 3×3, or 4×4 grid of full-screen tiles a viewer
explores by swiping in any of four directions. Built for teacher PD shared via
Thinkific (iframe embed), Zoom (link), and iMessage (link). No accounts — the
edit URL is the credential.

## Setup (Supabase is required — there is no local fallback)

Media uploads and grid storage always go through Supabase; the app does not
run in a degraded local-only mode. Set up Supabase before running anything:

1. **Supabase**: create a project, then run `supabase-schema.sql` in the SQL
   editor. It creates the `grids` table and a `media` storage bucket configured
   for public read, a 100 MB per-file limit, and inserts from the app's anon
   key. Also check **Settings → Storage → Upload file size limit** in the
   Supabase dashboard — if it's below 100 MB (Supabase's project-wide default
   is 50 MB on most plans), raise it there too, since that project-level cap
   overrides any bucket-level setting.
2. **Local dev**: copy `.env.example` to `.env.local` and fill in
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (from Supabase → Settings →
   API), then `npm install && npm run dev`. Plain `vite dev` doesn't serve the
   `/api/*` serverless functions, so creating/editing/sharing a grid and the AI
   buttons all need those routes — run `vercel dev` instead (`npm i -g vercel`,
   then `vercel dev`, pulling env vars with `vercel env pull` first) for the
   full loop locally, or just deploy to Vercel to test end to end. The built-in
   demo grid at `/g/demo` works under plain `vite dev` with no backend at all,
   since it's bundled directly into the app rather than fetched.
3. **Deploy to Vercel**: import this repo (framework preset: Vite) and set
   these env vars — **note the two different naming conventions**, since Vite
   only exposes `VITE_`-prefixed vars to browser code:

   | var | notes |
   |---|---|
   | `VITE_SUPABASE_URL` | client-side — must have the `VITE_` prefix or the browser can't see it |
   | `VITE_SUPABASE_ANON_KEY` | client-side — same as above |
   | `SUPABASE_URL` | server only — **no** `VITE_` prefix |
   | `SUPABASE_ANON_KEY` | server only |
   | `SUPABASE_SERVICE_ROLE_KEY` | server only — never exposed to the browser |
   | `ANTHROPIC_API_KEY` | server only — powers the two AI assists |
   | `PUBLIC_APP_URL` | e.g. `https://waffle.vercel.app` |

   `VITE_SUPABASE_URL` and `SUPABASE_URL` hold the *same* Supabase project URL
   — they're just named differently so Vite knows which one to bundle into the
   client. Redeploy after adding or renaming env vars: Vite bakes them in at
   build time, so a running deployment won't pick up a change until it rebuilds.

## Architecture

```
src/viewer/    Stage.tsx (gesture/snap engine), MapOverlay, IntroScreen,
               tiles/TileView.tsx (all 7 tile renderers)
src/editor/    cell grid, per-type tile editors, share panel, AI assists
src/lib/store.ts  data layer — /api/grids for grid CRUD, direct-to-Supabase uploads
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
