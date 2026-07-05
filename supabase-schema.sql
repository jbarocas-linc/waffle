-- Waffle — Supabase schema
-- Run in the Supabase SQL editor once per project. Safe to re-run — every
-- statement is idempotent, so running this again against an already-set-up
-- project (e.g. to fix a bucket that was created with the wrong limits) just
-- brings it back in line with this file.

create table if not exists grids (
  id          uuid primary key default gen_random_uuid(),
  view_id     text unique not null,
  edit_token  text unique not null,
  title       text not null,
  description text,
  size        int  not null check (size in (2, 3, 4)),
  start_cell  int  not null default 4,
  row_labels  jsonb,
  col_labels  jsonb,
  cells       jsonb not null default '[]'::jsonb,
  theme       jsonb,
  cover_url   text,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists grids_view_id_idx on grids (view_id);
create index if not exists grids_edit_token_idx on grids (edit_token);

-- All table access goes through the /api/grids serverless layer using the
-- service-role key, so RLS just locks the anon key out entirely. This is how
-- edit_token stays off the view path.
alter table grids enable row level security;

-- ---------------------------------------------------------------------------
-- Storage: a public "media" bucket for images, GIFs, video, PDFs, and
-- uploaded HTML embeds. There are no user accounts in this app, so writes are
-- authenticated by possession of the Supabase anon key (which the browser
-- sends automatically) rather than a signed-in session — that's the
-- "authenticated write" here, as opposed to a bucket open to fully anonymous
-- requests with no key at all.
--
-- file_size_limit is in bytes; 104857600 = 100 MB, matching the video cap in
-- src/lib/store.ts. This is a per-bucket limit — Supabase also enforces a
-- project-wide upload cap (Settings → Storage → Upload file size limit,
-- commonly 50 MB by default) that overrides this if it's set lower. Raise
-- that in the dashboard too if it's below 100 MB.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 104857600)
on conflict (id) do update
  set public = true,
      file_size_limit = 104857600;

drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

drop policy if exists "media anon upload" on storage.objects;
create policy "media anon upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'media');
