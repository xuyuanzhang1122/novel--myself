create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  cover_url text,
  backdrop_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels (id) on delete cascade,
  title text not null,
  slug text not null,
  markdown_content text not null default '',
  html_cache text,
  word_count integer not null default 0,
  chapter_order integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (novel_id, slug)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.novel_tags (
  novel_id uuid not null references public.novels (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (novel_id, tag_id)
);

create table if not exists public.site_settings (
  id text primary key,
  homepage_background_url text,
  brand_line text,
  default_theme text not null default 'paper' check (default_theme in ('paper', 'night', 'mist')),
  default_font text not null default 'serif' check (default_font in ('serif', 'song', 'sans')),
  accent_hex text
);

create table if not exists public.reader_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  font_family text not null default 'serif' check (font_family in ('serif', 'song', 'sans')),
  font_scale numeric(4,2) not null default 1.0,
  page_width text not null default 'standard' check (page_width in ('narrow', 'standard', 'wide')),
  theme text not null default 'paper' check (theme in ('paper', 'night', 'mist')),
  background_tone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  novel_id uuid not null references public.novels (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  anchor_id text,
  fallback_progress numeric(6,5),
  updated_at timestamptz not null default now(),
  unique (user_id, novel_id)
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  source_doc_url text,
  converted_markdown text not null,
  image_manifest jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  asset_type text not null default 'image',
  file_url text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chapters_touch_updated_at on public.chapters;
create trigger chapters_touch_updated_at
before update on public.chapters
for each row execute function public.touch_updated_at();

drop trigger if exists reader_preferences_touch_updated_at on public.reader_preferences;
create trigger reader_preferences_touch_updated_at
before update on public.reader_preferences
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.tags enable row level security;
alter table public.novel_tags enable row level security;
alter table public.site_settings enable row level security;
alter table public.reader_preferences enable row level security;
alter table public.reading_history enable row level security;
alter table public.import_jobs enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "admins manage admin_users" on public.admin_users;
create policy "admins manage admin_users"
on public.admin_users
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage novels" on public.novels;
create policy "admins manage novels"
on public.novels
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage chapters" on public.chapters;
create policy "admins manage chapters"
on public.chapters
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage tags" on public.tags;
create policy "admins manage tags"
on public.tags
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage novel_tags" on public.novel_tags;
create policy "admins manage novel_tags"
on public.novel_tags
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage site_settings" on public.site_settings;
create policy "admins manage site_settings"
on public.site_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage import_jobs" on public.import_jobs;
create policy "admins manage import_jobs"
on public.import_jobs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage media_assets" on public.media_assets;
create policy "admins manage media_assets"
on public.media_assets
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users manage own preferences" on public.reader_preferences;
create policy "users manage own preferences"
on public.reader_preferences
for all
using (auth.uid() = user_id and public.is_admin())
with check (auth.uid() = user_id and public.is_admin());

drop policy if exists "users manage own reading history" on public.reading_history;
create policy "users manage own reading history"
on public.reading_history
for all
using (auth.uid() = user_id and public.is_admin())
with check (auth.uid() = user_id and public.is_admin());

insert into public.site_settings (id, brand_line, default_theme, default_font, accent_hex)
values ('default', 'Private reading room for long nights and unfinished manuscripts.', 'paper', 'serif', '#c08457')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('novel-media', 'novel-media', true)
on conflict (id) do nothing;

drop policy if exists "admins manage media bucket objects" on storage.objects;
create policy "admins manage media bucket objects"
on storage.objects
for all
using (bucket_id = 'novel-media' and public.is_admin())
with check (bucket_id = 'novel-media' and public.is_admin());
