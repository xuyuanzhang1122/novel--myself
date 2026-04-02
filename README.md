# xu-novel

Private novel reading & publishing platform. It ships as a pnpm monorepo with two Next.js 15 apps: a reader-facing site and an editorial admin workspace, backed by Prisma + SQLite and a built-in password login.

[中文文档](./README.zh-CN.md)

## Quick Start

### Install with curl

```bash
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh | bash
```

If you prefer to inspect the script first:

```bash
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh -o setup.sh
bash setup.sh
```

You can also predefine the install directory:

```bash
XU_NOVEL_INSTALL_DIR="$HOME/xu-novel" \
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh | bash
```

The setup script will:
1. Detect your OS (macOS / Linux / WSL)
2. Install Node.js 20+ and pnpm if missing
3. Clone the repo and install dependencies
4. Generate `.env.local` interactively with your admin credentials
5. Initialize the SQLite database via Prisma
6. Run a build to verify everything works

### Manual install

```bash
git clone https://github.com/xuyuanzhang1122/novel--myself.git xu-novel
cd xu-novel
pnpm install
cat > .env.local <<'EOF'
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=novel123456
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
SITE_REVALIDATE_URL=http://localhost:3000/api/revalidate
SITE_REVALIDATE_SECRET=replace-with-a-random-secret
AUTH_SESSION_SECRET=
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
EOF
pnpm --filter @xu-novel/lib exec prisma db push
pnpm --filter @xu-novel/lib exec prisma generate
pnpm dev
```

You can also start from [`.env.example`](./.env.example) and then edit the values.

## Start Modes

### Development

```bash
pnpm dev
```

This starts both apps through Turborepo:

| App | URL | Command behind the workspace script |
|-----|-----|-------------------------------------|
| Site | http://localhost:3000 | `pnpm --filter @xu-novel/site dev` |
| Admin | http://localhost:3001 | `pnpm --filter @xu-novel/admin dev` |

### Production

```bash
pnpm build
pnpm --filter @xu-novel/site start
pnpm --filter @xu-novel/admin start
```

Run the two `start` commands in separate terminals.

## Access

| App | URL | Description |
|-----|-----|-------------|
| Site | http://localhost:3000 | Reader-facing library & reading experience |
| Admin | http://localhost:3001 | Editorial workspace: novels, chapters, imports, appearance |

Default login: `admin@local` / `novel123456` (configurable in `.env.local`).

## Architecture

```
xu-novel/
├── apps/
│   ├── site/          # Reader app (Next.js 15, port 3000)
│   └── admin/         # Admin app (Next.js 15, port 3001)
├── packages/
│   ├── lib/           # Shared: Prisma client, auth, data queries, markdown pipeline
│   │   └── prisma/    # Schema & SQLite database
│   └── ui/            # Shared UI components (Button, Panel, PosterHero, etc.)
├── setup.sh           # One-click installer
├── .env.example       # Environment variable reference
├── turbo.json         # Turborepo config
└── pnpm-workspace.yaml
```

### Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, RSC)
- **Database**: Prisma ORM + SQLite (zero external dependencies)
- **Auth**: Custom HMAC-SHA256 signed cookies (no third-party auth service)
- **Styling**: Tailwind CSS with Chinese typography focus
- **Monorepo**: pnpm workspaces + Turborepo
- **Content**: Markdown as single source of truth, rendered to HTML via unified/remark/rehype

### Key Features

- **Novel & chapter CRUD** with draft/published/archived status
- **DOCX import** (browser-side parsing via mammoth + turndown)
- **Appearance management** (hero text, background, theme, font, accent color — all admin-configurable)
- **Reading progress** tracking with paragraph anchor + percentage fallback
- **Cross-app cache revalidation** via protected API endpoint
- **Offline-capable dev** (SQLite, system fonts, no external CDN)

## Environment Variables

See [`.env.example`](.env.example) for full reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | No | Admin password (default: `novel123456`) |
| `SITE_REVALIDATE_SECRET` | Yes | Secret for cross-app cache invalidation |
| `AUTH_SESSION_SECRET` | No | Dedicated session signing secret |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | No | Cookie domain for shared auth in production |

## Scripts

```bash
pnpm dev        # Start both apps in dev mode
pnpm build      # Production build
pnpm --filter @xu-novel/site start   # Start the site after build
pnpm --filter @xu-novel/admin start  # Start the admin app after build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
pnpm format     # Prettier check
```

## License

Private project.
