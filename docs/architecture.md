# xu-novel architecture

## Overview

`xu-novel` is a split-surface monorepo:

- `apps/site`: reading surface on the root domain
- `apps/admin`: editorial workspace on the admin subdomain
- `packages/ui`: shared UI primitives and theme tokens
- `packages/lib`: shared Supabase, markdown, import, and cache utilities

Both apps run as separate Vercel projects, share one Supabase project, and share login state through a root-domain cookie.

## Auth and session

- Supabase Auth is configured with a cookie domain such as `.xu-novel.com`.
- Both apps run the same middleware pattern to protect all routes except login and internal utility endpoints.
- The database protects core tables with RLS and an `admin_users` allowlist.

## Content flow

- Novels and chapters are edited in `admin`.
- Chapter content is stored as Markdown.
- HTML is derived from Markdown and cached in the `chapters.html_cache` column.
- `site` renders only published chapters.

## Revalidation flow

- `site` exposes `POST /api/revalidate`.
- `admin` calls this endpoint after novel, chapter, or appearance updates.
- `site` uses tag-based caching for novel lists, novel detail, chapter lists, and site settings.

## Import flow

- `.docx` files are parsed in the browser with `mammoth`.
- Embedded images are uploaded from the browser to the `novel-media` storage bucket.
- Converted Markdown and uploaded asset URLs are saved into `import_jobs`.
- The import job is reviewed before writing chapters.

## Reader state

- The reader injects stable paragraph anchors during Markdown-to-HTML compilation.
- Progress is persisted as `anchor_id + fallback_progress`.
- If an anchor cannot be restored after a content edit, the client falls back to the saved percentage.
