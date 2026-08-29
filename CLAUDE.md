# 荷眠 LoRest — CLAUDE.md

## 项目概述

面向孕期用户的智能睡眠支持系统，配套荷眠智能床垫硬件使用。
软件负责设备绑定、睡眠报告展示、孕期管理、睡前陪伴等功能。

## 技术栈

- **Framework:** Next.js 16 App Router + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (base-nova)
- **DB:** PostgreSQL + Drizzle ORM
- **Package manager:** Bun（不用 npm/yarn）
- **i18n:** i18next，支持 zh-CN / en-US
- **Platform:** @eazo/sdk（auth、storage、AI、notifications）

## 常用命令

```bash
bun run dev          # 启动开发服务器 localhost:3000
bun run build        # 生产构建
bun run lint         # ESLint 检查
bun run db:generate  # 生成 Drizzle 迁移
bun run db:migrate   # 执行迁移
bun run db:push      # 直接推送 schema（开发用）
bun run db:studio    # 打开 Drizzle Studio
```

## 目录约定

```
src/
├── app/              # Next.js 页面和 API 路由
├── components/
│   ├── ui/           # shadcn/ui 原始组件，不在此改业务逻辑
│   ├── lorest/       # 通用业务组件（底导、评分环等）
│   ├── report/       # 睡眠报告相关组件
│   └── pregnancy/    # 孕期相关组件
├── lib/
│   ├── api/          # 客户端 API 调用层（typed helpers）
│   ├── auth/         # 认证（server-auth.ts + local-auth.tsx）
│   ├── db/           # schema / queries / migrations
│   └── lorest/       # 领域逻辑（sleep.ts, history.ts, daily-advice.ts）
└── i18n/locales/     # en-US.json / zh-CN.json
```

## 编码规范

- **API 调用**：客户端统一走 `src/lib/api/` 的 typed 函数，不直接 fetch
- **DB 查询**：集中在 `src/lib/db/queries/`，API 路由只调用 query 函数
- **认证**：服务端用 `requireAuth(request)`，客户端用 `useAuth()` hook
- **i18n**：所有文案走翻译 key，两个 locale 文件同步更新
- **睡眠历史数据**：按日期确定性生成（seeded），不存 DB，改 `src/lib/lorest/history.ts`
- **data-el 属性**：所有产品关键元素保留 `data-el`，供 Eazo Canvas 选点使用

## 认证方式

Base64 编码的 JSON session token，通过 `x-lorest-session` header 传递。
Demo 登录生成测试用户 session，不依赖真实账户系统。

## 验证步骤

每次改动后：
1. `bun run build` 确认无类型错误和构建失败
2. `bun run lint` 确认无 ESLint 报错
3. 涉及 DB schema 变更：`bun run db:generate` 生成迁移文件后一并提交

## 红线（需先确认）

- DB schema 变更或数据迁移
- 修改 `.env`、密钥、`EAZO_PRIVATE_KEY`
- 修改 Vercel cron 配置（`vercel.json`）
- `git push` / 部署到生产
