# Environment Setup

## 1. 复制环境文件

```bash
cp .env.example .env.local
```

## 2. 每个变量怎么填

### `NEXT_PUBLIC_SUPABASE_URL`

你的 Supabase 项目地址。

格式类似：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
```

在 Supabase 控制台的 `Project Settings -> API` 里可以找到。

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase 的匿名公钥，前后端都会用到。

格式类似：

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

同样在 `Project Settings -> API` 里。

### `SUPABASE_SERVICE_ROLE_KEY`

Supabase 的服务端密钥。只允许服务端使用，不能泄露到前端。

格式类似：

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`

前后台共享登录态用的 Cookie 域名。

本地开发建议先留空：

```env
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
```

因为 `localhost` 不适合写成 `.localhost` 这种格式。

生产环境再改成：

```env
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.xu-novel.com
```

### `NEXT_PUBLIC_SITE_URL`

前台阅读站地址。

本地开发：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

生产环境：

```env
NEXT_PUBLIC_SITE_URL=https://xu-novel.com
```

### `NEXT_PUBLIC_ADMIN_URL`

后台地址。

本地开发：

```env
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

生产环境：

```env
NEXT_PUBLIC_ADMIN_URL=https://admin.xu-novel.com
```

### `SITE_REVALIDATE_URL`

后台保存内容后，调用前台缓存刷新接口的地址。

本地开发：

```env
SITE_REVALIDATE_URL=http://localhost:3000/api/revalidate
```

生产环境：

```env
SITE_REVALIDATE_URL=https://xu-novel.com/api/revalidate
```

### `SITE_REVALIDATE_SECRET`

前后台通信用的密钥。你自己生成一个长随机字符串即可。

例如：

```env
SITE_REVALIDATE_SECRET=change-this-to-a-long-random-secret
```

可以用下面命令生成：

```bash
openssl rand -base64 32
```

### `ADMIN_EMAIL`

管理员邮箱。建议填你在 Supabase Auth 里创建的那个管理员账号邮箱。

例如：

```env
ADMIN_EMAIL=you@example.com
```

## 3. 本地开发推荐配置

你现在最适合先用这一套：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
SITE_REVALIDATE_URL=http://localhost:3000/api/revalidate
SITE_REVALIDATE_SECRET=change-this-to-a-long-random-secret
ADMIN_EMAIL=you@example.com
```

## 4. 生产环境推荐配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.xu-novel.com
NEXT_PUBLIC_SITE_URL=https://xu-novel.com
NEXT_PUBLIC_ADMIN_URL=https://admin.xu-novel.com
SITE_REVALIDATE_URL=https://xu-novel.com/api/revalidate
SITE_REVALIDATE_SECRET=change-this-to-a-long-random-secret
ADMIN_EMAIL=you@example.com
```

## 5. 额外注意

- 本地开发时，如果你发现前台和后台不能共享登录态，这是正常的。因为当前是 `localhost:3000` 和 `localhost:3001`，不是正式主域/子域模型。
- 真正的跨站共享登录态，要等生产环境绑定主域名和子域名后才完整成立。
- 迁移数据库后，记得把你的 Supabase 用户写入 `admin_users` 表，否则 RLS 会拦住后台写操作。
