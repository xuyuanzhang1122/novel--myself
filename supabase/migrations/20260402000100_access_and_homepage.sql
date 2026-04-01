alter table public.site_settings
  add column if not exists hero_eyebrow text default '阅读空间',
  add column if not exists hero_title text default '给长章节与未完稿准备的私家书架。',
  add column if not exists hero_primary_action text default '继续阅读',
  add column if not exists hero_secondary_action text default '打开后台';

drop policy if exists "users manage own preferences" on public.reader_preferences;
create policy "users manage own preferences"
on public.reader_preferences
for all
using ((auth.uid() = user_id) or public.is_admin())
with check ((auth.uid() = user_id) or public.is_admin());

drop policy if exists "users manage own reading history" on public.reading_history;
create policy "users manage own reading history"
on public.reading_history
for all
using ((auth.uid() = user_id) or public.is_admin())
with check ((auth.uid() = user_id) or public.is_admin());

drop policy if exists "public read published novels" on public.novels;
create policy "public read published novels"
on public.novels
for select
using (status = 'published');

drop policy if exists "public read published chapters" on public.chapters;
create policy "public read published chapters"
on public.chapters
for select
using (status = 'published');

drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings"
on public.site_settings
for select
using (true);

drop policy if exists "public read tags" on public.tags;
create policy "public read tags"
on public.tags
for select
using (true);

drop policy if exists "public read novel_tags" on public.novel_tags;
create policy "public read novel_tags"
on public.novel_tags
for select
using (
  exists (
    select 1
    from public.novels
    where novels.id = novel_tags.novel_id
      and novels.status = 'published'
  )
);

update public.site_settings
set brand_line = null
where id = 'default'
  and brand_line = 'Private reading room for long nights and unfinished manuscripts.';
