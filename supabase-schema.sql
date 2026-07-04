-- Waffle — Supabase schema
-- Run in the Supabase SQL editor once per project.

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

-- Storage: create a bucket named "media" (public). Client uploads use the
-- anon key, so allow anon INSERT into that bucket; reads are public.
-- Size/MIME limits are enforced client-side (and can't be fully expressed in
-- storage policies) — set the bucket's global file size limit to 100 MB in
-- the dashboard as a backstop.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media anon upload"
  on storage.objects for insert
  with check (bucket_id = 'media');
