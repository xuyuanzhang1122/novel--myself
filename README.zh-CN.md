# xu-novel

私有小说阅读与发布平台。项目基于 pnpm monorepo 构建，包含两个 Next.js 15 应用：前台阅读站和后台编辑工作台，使用 Prisma + SQLite 作为数据层，内置用户体系、引导管理员账号以及邮箱验证码注册。

[English](./README.md)

## 快速开始

### 用 curl 安装

```bash
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh | bash
```

如果你想先下载脚本再执行：

```bash
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh -o setup.sh
bash setup.sh
```

也可以先指定安装目录：

```bash
XU_NOVEL_INSTALL_DIR="$HOME/xu-novel" \
curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh | bash
```

脚本会自动完成：
1. 检测操作系统（macOS / Linux / WSL）
2. 安装 Node.js 20+ 和 pnpm（如果缺失）
3. 克隆仓库并安装依赖
4. 交互式生成 `.env.local` 配置文件，包括管理员账号、QQ SMTP 和对象存储参数
5. 通过 Prisma 初始化 SQLite 数据库
6. 执行构建验证

### 手动安装

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
AUTH_SESSION_SECRET=replace-with-another-random-secret
SMTP_QQ_EMAIL=
SMTP_QQ_AUTH_CODE=
SMTP_FROM_NAME=xu-novel
IMAGE_API_BASE_URL=http://127.0.0.1:4000
IMAGE_API_KEY=
IMAGE_API_BEARER_TOKEN=
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
EOF
pnpm --filter @xu-novel/lib exec prisma db push
pnpm --filter @xu-novel/lib exec prisma generate
pnpm dev
```

也可以先复制 [`.env.example`](./.env.example) 再按需修改。

## 启动方式

### 开发模式

```bash
pnpm dev
```

这个 workspace 命令会同时启动两个应用：

| 应用 | 地址 | 实际命令 |
|------|------|----------|
| 前台 | http://localhost:3000 | `pnpm --filter @xu-novel/site dev` |
| 后台 | http://localhost:3001 | `pnpm --filter @xu-novel/admin dev` |

### 生产模式

```bash
pnpm build
pnpm --filter @xu-novel/site start
pnpm --filter @xu-novel/admin start
```

生产模式下，两个 `start` 命令需要分两个终端执行。

## 访问地址

| 应用 | 地址 | 说明 |
|------|------|------|
| 前台 | http://localhost:3000 | 未登录首页预览、登录/注册、登录后的书库与阅读 |
| 后台 | http://localhost:3001 | 编辑工作台：作品、章节、导入、外观、用户管理 |

引导管理员默认登录：`admin@local` / `novel123456`（可在 `.env.local` 中修改）。

## 项目结构

```
xu-novel/
├── apps/
│   ├── site/          # 前台阅读应用（Next.js 15，端口 3000）
│   └── admin/         # 后台管理应用（Next.js 15，端口 3001）
├── packages/
│   ├── lib/           # 共享库：Prisma 客户端、认证、数据查询、Markdown 渲染管线
│   │   └── prisma/    # 数据库 Schema 与 SQLite 文件
│   └── ui/            # 共享 UI 组件（Button、Panel、PosterHero 等）
├── setup.sh           # 一键安装脚本
├── .env.example       # 环境变量参考
├── turbo.json         # Turborepo 配置
└── pnpm-workspace.yaml
```

### 技术栈

- **框架**: Next.js 15（App Router、Server Actions、RSC）
- **数据库**: Prisma ORM + SQLite（零外部依赖）
- **认证**: 自建 HMAC-SHA256 签名 Cookie + Prisma 用户账号（无需第三方认证服务）
- **样式**: Tailwind CSS，中文排版优化
- **工程化**: pnpm workspaces + Turborepo
- **内容**: Markdown 为唯一真源，通过 unified/remark/rehype 渲染为 HTML

### 核心功能

- **游客首页预览** — 未登录只能看首页，书库/作品详情/章节阅读需要登录
- **邮箱验证码注册** — 通过 QQ SMTP 发件配置发送注册验证码
- **后台用户管理** — 支持新增用户、删除用户、切换管理员权限
- **作品与章节管理** — 支持草稿/已发布/归档三态
- **Word 导入** — 浏览器端解析 .docx（mammoth + turndown）
- **外观配置** — Hero 文案、背景图、主题、字体、强调色全部后台可控
- **对象存储上传代理** — 通过 `IMAGE_API_*` 环境变量接入上传服务
- **阅读进度** — 段落锚点 + 百分比双重备份
- **跨应用缓存刷新** — 后台更新后自动刷新前台缓存
- **离线可用开发环境** — SQLite + 系统字体，不依赖外部 CDN

## 环境变量

完整参考见 [`.env.example`](.env.example)。

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_EMAIL` | 是 | 引导管理员邮箱 |
| `ADMIN_PASSWORD` | 否 | 引导管理员密码（默认 `novel123456`） |
| `SITE_REVALIDATE_SECRET` | 是 | 跨应用缓存刷新密钥 |
| `AUTH_SESSION_SECRET` | 否 | 独立的登录会话签名密钥 |
| `SMTP_QQ_EMAIL` | 否 | 用于发送注册邮件的 QQ 发件邮箱 |
| `SMTP_QQ_AUTH_CODE` | 否 | QQ 邮箱授权码 |
| `SMTP_FROM_NAME` | 否 | 注册邮件展示名称 |
| `IMAGE_API_BASE_URL` | 否 | 对象存储上传服务地址 |
| `IMAGE_API_KEY` | 否 | 上传服务 API Key |
| `IMAGE_API_BEARER_TOKEN` | 否 | 上传服务 Bearer Token |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | 否 | 生产环境共享 Cookie 域名 |

注册邮件说明：

- 当前仅支持 QQ 邮箱作为 SMTP 发件箱。
- 用户注册邮箱本身不要求是 QQ 邮箱；QQ 限制只作用于服务端发信账号。
- 如果 `SMTP_QQ_EMAIL` / `SMTP_QQ_AUTH_CODE` 留空，账号密码登录仍可用，但邮箱验证码注册会失败，直到补齐 SMTP 配置。

对象存储说明：

- 推荐对象存储服务仓库：[Novel-Object-Storage](https://github.com/xuyuanzhang1122/Novel-Object-Storage)
- 这个开源对象存储默认运行在 `http://127.0.0.1:4000`，和本项目默认的 `IMAGE_API_BASE_URL` 一致。
- 先单独部署对象存储服务，再把 `IMAGE_API_BASE_URL` 指向对应地址。
- 上传代理实现位于 `apps/admin/src/app/api/upload/route.ts`。
- 上传服务认证支持二选一：`IMAGE_API_KEY` 或 `IMAGE_API_BEARER_TOKEN`。
- 如果你是从对象存储仓库源码启动，请按它自己的 README 初始化 `.env`、管理员账号，并为本项目生成一个 API Key。

## 常用命令

```bash
pnpm dev        # 启动开发服务器（双应用）
pnpm build      # 生产构建
pnpm --filter @xu-novel/site start   # 构建后启动前台
pnpm --filter @xu-novel/admin start  # 构建后启动后台
pnpm lint       # ESLint 检查
pnpm typecheck  # TypeScript 类型检查
pnpm format     # Prettier 格式检查
```
