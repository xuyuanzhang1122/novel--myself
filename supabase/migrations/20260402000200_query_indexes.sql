create index if not exists idx_novels_status_sort_order
on public.novels (status, sort_order);

create index if not exists idx_chapters_novel_id_chapter_order
on public.chapters (novel_id, chapter_order);
