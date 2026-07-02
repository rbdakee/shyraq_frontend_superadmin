# Shyraq SuperAdmin Frontend — Architecture

Веб-приложение для команды Shyraq (super_admin / support роли) для управления SaaS-платформой: садики, подписки, фичефлаги, billing/content cron-триггеры, операторские поверхности.

**Не путать с Admin Web** — это отдельная админка для **сотрудников ОДНОГО садика** (роль `admin`). SuperAdmin работает над **всеми** садиками платформы.

---

## 1. Контекст и ограничения

| Аспект        | Значение                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Аудитория** | Внутренняя команда Shyraq (5–20 человек): super_admin, support, devops                                                                                                                                                                        |
| **Деплой**    | За VPN / IP-allowlist на reverse proxy. Не публичный сайт.                                                                                                                                                                                    |
| **SEO**       | Не нужен                                                                                                                                                                                                                                      |
| **SSR**       | Не нужен (нет публичных страниц)                                                                                                                                                                                                              |
| **Mobile**    | Не основной use-case. Desktop-first, минимально адаптивно для tablet                                                                                                                                                                          |
| **Backend**   | NestJS REST API на том же домене, эндпойнты `/saas/*` + некоторые `/admin/*` для cross-kg операций. См. [`endpoints.md`](endpoints.md)                                                                                                        |
| **Auth**      | Email + password → JWT (HS256, access TTL 15m) + opaque refresh (TTL 30d)                                                                                                                                                                     |
| **i18n**      | RU + KK (i18next). Backend отдаёт jsonb-поля `{ru, kz}` для контента — фронт показывает оба значения в read-only превью                                                                                                                       |
| **Real-time** | Не используется. Backend WS gateway существует, но не транслирует cross-kg system events для super_admin (auto-subscribe только в `user:{id}` room). См. [`OPEN_QUESTIONS.md#a2`](OPEN_QUESTIONS.md#a2-websocket-integration-timing--parked). |

---

## 2. Стек

| Слой                     | Технология                                                          | Причина выбора                                                                                                            |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Build**                | Vite 5                                                              | Быстрый dev-server, esbuild dev-bundle, минимальная конфигурация. SPA сборка → один статик-бандл за reverse proxy.        |
| **Framework**            | React 18 + TypeScript (strict)                                      | Стандарт. Strict TS — обязательно (бэкенд тоже strict).                                                                   |
| **Routing**              | React Router 6 (data-router API: `createBrowserRouter`)             | File-based routing не нужен (приложение маленькое, 15–25 экранов). Loader/Action API даёт интеграцию с TanStack Query.    |
| **Server state**         | TanStack Query 5                                                    | Дедупликация, кэш, invalidation tree, optimistic updates, background refetch. Идеальный матч для REST API.                |
| **HTTP client**          | `ky` (или нативный `fetch` с обёрткой)                              | Лёгкий, типизируемый, поддерживает retry/timeout без axios-веса. Кастомный interceptor для JWT refresh-on-401.            |
| **API types**            | `openapi-typescript` (generate from `/docs-json`) + `openapi-fetch` | Backend выдаёт OpenAPI через NestJS Swagger. Генерим `.d.ts` в build-time → нет ручной синхронизации DTO.                 |
| **Forms**                | React Hook Form + Zod                                               | RHF — uncontrolled forms, минимум re-renders. Zod — runtime validation, типы выводятся автоматически.                     |
| **UI components**        | shadcn/ui (Radix UI primitives + Tailwind CSS v4)                   | Не библиотека, copy-paste коллекция в `src/components/ui/`. Полный контроль над стилями. Доступность из Radix.            |
| **Styling**              | Tailwind CSS v4 + CSS Variables (для тем)                           | Utility-first, design tokens через CSS vars. Темизация (light/dark) через `prefers-color-scheme` + toggle.                |
| **Icons**                | Lucide React                                                        | Tree-shakable, дружит с shadcn/ui.                                                                                        |
| **Tables**               | TanStack Table v8                                                   | Headless, идеально для сложных списков (садики, подписки, инвойсы) с сортировкой, фильтрами, пагинацией.                  |
| **Charts**               | Recharts (или ECharts если понадобятся сложные)                     | Дашборд статуса, метрики платформы. На MVP — Recharts (простые bar/line).                                                 |
| **State (UI)**           | Zustand (минимально)                                                | Только для не-серверного UI-state (sidebar collapse, theme, modals). Большинство state'а — server-state в TanStack Query. |
| **i18n**                 | i18next + react-i18next + i18next-browser-languagedetector          | RU + KK. Файлы `src/locales/{ru,kk}/{common,kindergartens,billing,...}.json`.                                             |
| **Date/time**            | `date-fns` + `date-fns-tz`                                          | Backend timezone — `Asia/Almaty` для cron. Все cron-триггеры показываем в Almaty TZ.                                      |
| **Notifications/toasts** | `sonner`                                                            | Лёгкий, дружит с shadcn/ui.                                                                                               |
| **Env config**           | Vite `import.meta.env` + Zod-валидация на старте                    | Падаем с понятной ошибкой если `VITE_API_BASE_URL` не задан.                                                              |
| **Tests (unit)**         | Vitest + Testing Library                                            | Vitest сидит на esbuild как Vite — быстрый.                                                                               |
| **Tests (e2e)**          | Playwright                                                          | Только для критичных флоу: логин, создание садика, активация фичефлага.                                                   |
| **Lint/format**          | ESLint (flat config) + Prettier + TypeScript ESLint                 | Стандарт.                                                                                                                 |
| **Pre-commit**           | Husky + lint-staged                                                 | `eslint --fix` + `prettier --write` + `tsc --noEmit` перед commit.                                                        |
| **Package manager**      | pnpm                                                                | Быстрее npm, дисковая экономия.                                                                                           |
| **Node version**         | 20 LTS                                                              | Закреплено в `.nvmrc` и `package.json#engines`.                                                                           |

### 2.1 Что НЕ берём и почему

| Технология                         | Почему отказ                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**                        | SSR/RSC/edge-runtime не дают пользы для internal SPA. Overhead в build-time, конфигурация, deploy.                                                                                    |
| **AntD Pro / Refine**              | Дают быстрый CRUD из коробки, но lock-in в их theming → когда придёт дизайн-фаза, переделка дороже экономии на старте.                                                                |
| **Redux / Redux Toolkit**          | Сервер-state покрывает TanStack Query; UI-state маленький → Zustand хватает. RTK Query — хороший вариант, но TanStack Query шире распространён и интегрируется с openapi-fetch проще. |
| **MUI / Mantine**                  | Готовые компоненты, но кастомизация под брендинг — через theme overrides (хрупкие). shadcn/ui честнее: код твой.                                                                      |
| **Storybook**                      | Не нужен на MVP (нет дизайн-системы для документирования). Добавим, если внутренняя UI-kit вырастет.                                                                                  |
| **socket.io-client**               | См. §1 — backend не шлёт cross-kg WS events для super_admin. Не тащим зависимость.                                                                                                    |
| **GraphQL клиенты (Apollo, urql)** | Backend — REST.                                                                                                                                                                       |

---

## 3. Структура проекта

```
frontend_superadmin/
├── public/                          # статика (favicon, robots.txt с Disallow:)
├── src/
│   ├── main.tsx                     # entry: createRoot, провайдеры, router
│   ├── App.tsx                      # root layout (sidebar + outlet)
│   ├── env.ts                       # Zod-валидация import.meta.env
│   │
│   ├── api/                         # HTTP-слой
│   │   ├── client.ts                # ky-instance с JWT-refresh interceptor
│   │   ├── auth.ts                  # POST /saas/auth/login, refresh, logout
│   │   ├── kindergartens.ts         # /saas/kindergartens CRUD
│   │   ├── subscriptions.ts         # /saas/saas-subscriptions CRUD
│   │   ├── feature-flags.ts         # /saas/feature-flags CRUD
│   │   ├── saas-users.ts            # /saas/users CRUD
│   │   ├── billing-ops.ts           # /saas/billing/* triggers
│   │   ├── content-ops.ts           # /saas/content/* triggers
│   │   ├── lifecycle-jobs.ts        # /admin/lifecycle/failed-jobs cross-kg
│   │   ├── schedule-rollout.ts      # /admin/schedule/week-rollout/run
│   │   ├── health.ts                # /health, /health/ready
│   │   └── types/                   # openapi-typescript-сгенерённые типы (.d.ts)
│   │
│   ├── hooks/                       # TanStack Query hooks (per-domain)
│   │   ├── use-auth.ts              # useLogin, useRefresh, useLogout, useMe
│   │   ├── use-kindergartens.ts     # useKindergartens, useKindergarten, useCreateKindergarten…
│   │   ├── use-subscriptions.ts
│   │   ├── use-feature-flags.ts
│   │   ├── use-saas-users.ts
│   │   ├── use-billing-ops.ts
│   │   ├── use-content-ops.ts
│   │   ├── use-lifecycle-jobs.ts
│   │   ├── use-schedule-rollout.ts
│   │   └── use-health.ts
│   │
│   ├── routes/                      # React Router routes (страницы)
│   │   ├── _root.tsx                # root layout с auth-guard
│   │   ├── login.tsx                # /login
│   │   ├── dashboard.tsx            # / (home: статус платформы)
│   │   ├── kindergartens/
│   │   │   ├── index.tsx            # /kindergartens (list)
│   │   │   ├── new.tsx              # /kindergartens/new (form)
│   │   │   └── $id/
│   │   │       ├── index.tsx        # /kindergartens/:id (overview)
│   │   │       ├── settings.tsx     # /kindergartens/:id/settings
│   │   │       ├── subscription.tsx # /kindergartens/:id/subscription
│   │   │       ├── flags.tsx        # /kindergartens/:id/flags
│   │   │       └── view-as.tsx      # /kindergartens/:id/view-as (read-only impersonation)
│   │   ├── subscriptions/index.tsx  # /subscriptions (cross-kg list)
│   │   ├── feature-flags/index.tsx  # /feature-flags (global + per-kg)
│   │   ├── users/                   # /users (saas_users)
│   │   │   ├── index.tsx
│   │   │   └── new.tsx
│   │   ├── operations/
│   │   │   ├── billing.tsx          # /operations/billing (manual triggers)
│   │   │   ├── content.tsx          # /operations/content
│   │   │   ├── schedule-rollout.tsx # /operations/schedule-rollout
│   │   │   └── lifecycle-dlq.tsx    # /operations/lifecycle-dlq
│   │   └── system-status.tsx        # /system-status (health page)
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui copy-paste (Button, Input, Dialog, …)
│   │   ├── layout/                  # Sidebar, Topbar, AuthGuard
│   │   ├── data-table/              # TanStack Table обёртки
│   │   ├── forms/                   # переиспользуемые поля (PhoneInput, SlugInput, …)
│   │   └── feedback/                # ErrorBoundary, EmptyState, LoadingSpinner
│   │
│   ├── lib/                         # утилиты
│   │   ├── token-storage.ts         # in-memory access token + httpOnly refresh (см. §6)
│   │   ├── format.ts                # форматтеры (дата, валюта, телефон)
│   │   ├── error-map.ts             # backend error code → i18n message
│   │   └── time.ts                  # Asia/Almaty helpers
│   │
│   ├── locales/
│   │   ├── ru/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── kindergartens.json
│   │   │   ├── billing.json
│   │   │   └── errors.json
│   │   └── kk/
│   │       └── ...
│   │
│   └── styles/
│       ├── globals.css              # Tailwind base + CSS variables (theme tokens)
│       └── fonts.css
│
├── tests/                           # Playwright e2e
│   └── auth.spec.ts
│
├── .env.example                     # VITE_API_BASE_URL=https://api.shyraq.kz и т.п.
├── .nvmrc
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
└── docs/                            # (этот документ)
```

### 3.1 Слоистые правила

| Слой                                             | Что разрешено                                                                   | Что запрещено                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `api/`                                           | `ky`, openapi-types, чистые async-функции `(input) → Promise<Response>`         | TanStack Query hooks, React, i18n                   |
| `hooks/`                                         | TanStack Query (`useQuery`, `useMutation`), вызовы `api/*`, query-key constants | UI / JSX, прямой `fetch`                            |
| `routes/`                                        | React, JSX, `hooks/*`, `components/*`, `react-router-dom`                       | прямой `fetch`, прямой `api/*` (только через hooks) |
| `components/ui/`                                 | shadcn-сгенерённые примитивы                                                    | бизнес-логика, прямой backend-доступ                |
| `components/{layout,data-table,forms,feedback}/` | UI + переиспользуемые wrappers                                                  | бизнес-логика домена (это в routes)                 |
| `lib/`                                           | чистые функции, без React                                                       | TanStack Query, JSX                                 |

Нарушения отлавливаются ESLint правилом `no-restricted-imports` + code-review.

---

## 4. Маршрутизация и auth-guard

```tsx
// src/main.tsx
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AuthGuard><RootLayout /></AuthGuard>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'kindergartens', children: [...] },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      // ...
    ],
  },
]);
```

`<AuthGuard>` — читает access token из `lib/token-storage`; если нет → redirect на `/login` с сохранением `?next=`. На 401 от backend (через `api/client.ts` interceptor) пробует refresh; если refresh fails → wipe token + redirect.

---

## 5. State management

### 5.1 Server state — TanStack Query

- Один `QueryClient` на приложение. `defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } }`.
- Query keys — иерархические массивы: `['kindergartens', 'list', filters]`, `['kindergartens', 'detail', id]`. Invalidation через префикс: `queryClient.invalidateQueries({ queryKey: ['kindergartens'] })`.
- Mutations — обязательно `onSuccess: invalidate` или `onSuccess: setQueryData` для optimistic updates критичных операций (создание садика).
- Cron-триггеры (`/saas/billing/monthly-run` и т.п.) — через `useMutation` с `toast.promise` для UX.

### 5.2 UI state — Zustand

Только для:

- `useUiStore` — sidebar collapsed, current theme (light/dark), current locale
- `useModalStore` — глобальные диалоги (если будут)

Никаких "загруженных данных" в Zustand — это работа TanStack Query.

### 5.3 Form state — React Hook Form

- Все формы через `useForm` + `zodResolver`.
- Schema живёт рядом с компонентом или в `routes/<feature>/schemas.ts`.
- Server-validation errors (`422`) маппятся в `setError('field', { message })`.

---

## 6. Auth и токены

### 6.1 Backend контракт

```
POST /saas/auth/login { email, password }
  → 200 { access_token, refresh_token, token_type: 'Bearer', expires_in: 900 }
  → 401 { error: 'invalid_credentials' }
  → 429 { error: 'rate_limit' }   // 10/hour per email

POST /saas/auth/refresh { refresh_token }
  → 200 { access_token, refresh_token, ... }   // ротация
  → 401 { error: 'invalid_refresh' }

POST /saas/auth/logout (Bearer)
  → 204 No Content
```

### 6.2 Хранение токенов

| Токен             | Где хранится                                          | Почему                                                         |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| **access_token**  | In-memory (`lib/token-storage.ts`, переменная модуля) | Short-lived (15m). Не в localStorage — XSS-эксфильтрация.      |
| **refresh_token** | `localStorage` под ключом `shyraq.sa.refresh`         | Internal tool за VPN/IP-allowlist, XSS-поверхность ограничена. |

Миграция на httpOnly cookie — отложена; триггер и варианты см. [`OPEN_QUESTIONS.md#a1`](OPEN_QUESTIONS.md#a1-token-storage-strategy--parked).

### 6.3 JWT refresh interceptor

```ts
// api/client.ts (упрощённо)
const client = ky.create({
  prefixUrl: env.VITE_API_BASE_URL,
  hooks: {
    beforeRequest: [
      (req) => {
        const token = tokenStorage.getAccess();
        if (token) req.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (req, _opts, res) => {
        if (res.status !== 401) return res;
        const refreshed = await tryRefreshOnce(); // single-flight через mutex
        if (!refreshed) {
          tokenStorage.clear();
          window.location.href = '/login?reason=session_expired';
          return res;
        }
        req.headers.set('Authorization', `Bearer ${refreshed.access_token}`);
        return ky(req);
      },
    ],
  },
});
```

`tryRefreshOnce()` — single-flight: если 5 параллельных запросов получили 401, refresh выполняется ОДИН раз, остальные ждут результат.

### 6.4 Logout

`POST /saas/auth/logout` → wipe access + refresh из storage → `queryClient.clear()` → redirect `/login`.

---

## 7. Локализация

- Default locale — RU. KK — переключается в topbar.
- `i18next-browser-languagedetector` смотрит `localStorage.shyraq.sa.lang`.
- Файлы `src/locales/<lang>/<namespace>.json`. Namespace per-domain: `common`, `auth`, `kindergartens`, `billing`, `content`, `errors`.
- **Backend error codes** мапятся через `lib/error-map.ts` → `errors.json`. Например, `invalid_credentials` → `{ru: 'Неверный email или пароль', kk: 'Қате email немесе пароль'}`.
- **JSONB-поля backend'а** (`{ru, kz}`) — рендерятся через хелпер `localizeJsonb(field, lang)` с fallback `ru → kz → first available`. Backend uses `kz`, не `kk` — соблюдаем (см. `architecture.md` backend §1.4 shared-kernel/i18n).

---

## 8. Стилизация и темизация

- **Tailwind v4** + CSS variables. Все цвета — переменные:
  ```css
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    /* ... */
  }
  .dark { --background: 240 10% 3.9%; ... }
  ```
- shadcn/ui компоненты используют эти переменные → переключение темы через `<html class="dark">` toggle.
- **Дизайн-фаза будет позже** (см. ТЗ от пользователя). Пока используем дефолтный shadcn-look.

---

## 9. API integration с backend

### 9.1 OpenAPI types generation

Backend выставляет OpenAPI на `/docs-json` (NestJS Swagger).

```bash
# pnpm script: "gen:api": "openapi-typescript http://localhost:3000/docs-json -o src/api/types/openapi.d.ts"
pnpm gen:api
```

Запускается:

- В CI после backend-deploy на staging
- Локально руками когда фронт-разработчик знает что backend поменялся

Генерится `src/api/types/openapi.d.ts` — это commit'нутый артефакт (не gitignore), чтобы CI без backend connection мог собрать фронт.

### 9.2 Type-safe API calls

```ts
// api/kindergartens.ts
import createClient from 'openapi-fetch';
import type { paths } from './types/openapi';

export const apiClient = createClient<paths>({ baseUrl: env.VITE_API_BASE_URL });

export const listKindergartens = (params: { plan?: string; is_active?: boolean }) =>
  apiClient.GET('/saas/kindergartens', { params: { query: params } });
```

Типы запроса/ответа выводятся из openapi.d.ts автоматически.

### 9.3 Error handling

Backend возвращает ошибки в едином формате (см. `endpoints.md` §0.1):

```json
{ "error": "kindergarten_slug_taken", "message": "Slug already taken", "details": {...} }
```

`api/client.ts` парсит ответ, бросает `AppError(code, status, details)`. UI ловит через `useMutation({ onError: (err) => toast.error(t(`errors.${err.code}`)) })`.

---

## 10. Endpoint coverage (MVP)

Полный список — см. [`endpoints.md`](endpoints.md). Краткое резюме:

| Категория                     | Backend route                                                            | Frontend page                                                  |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Auth                          | `/saas/auth/{login,refresh,logout}`                                      | `/login`                                                       |
| Kindergartens (tenants)       | `/saas/kindergartens` CRUD                                               | `/kindergartens` + `/kindergartens/:id` + `/kindergartens/new` |
| SaaS Subscriptions            | `/saas/saas-subscriptions`                                               | `/subscriptions`, в `/kindergartens/:id/subscription`          |
| Feature Flags                 | `/saas/feature-flags`                                                    | `/feature-flags`, в `/kindergartens/:id/flags`                 |
| SaaS Users                    | `/saas/users`                                                            | `/users`                                                       |
| Billing ops (manual triggers) | `/saas/billing/{monthly-run, discount-expire-run, overdue-run}`          | `/operations/billing`                                          |
| Content ops (manual triggers) | `/saas/content/{birthday-run, story-cleanup-run, publish-scheduled-run}` | `/operations/content`                                          |
| Schedule weekly rollout       | `/admin/schedule/week-rollout/run`                                       | `/operations/schedule-rollout`                                 |
| Lifecycle DLQ (cross-kg)      | `/admin/lifecycle/failed-jobs` (+ `/:id/retry`)                          | `/operations/lifecycle-dlq`                                    |
| Health                        | `/health`, `/health/ready`                                               | `/system-status` (+ виджет на dashboard)                       |
| View-as kindergarten          | (placeholder — backend не поддерживает read-only impersonation)          | `/kindergartens/:id/view-as`                                   |

---

## 11. Деплой

**Платформа — Vercel** (решение Post-B8, 2026-05-15). Vercel Git-интеграция собирает и деплоит SPA-статику; `vercel.json` reverse-proxy сохраняет same-origin модель (без CORS, без mixed-content). Прежний вариант (S3 + CloudFront / Nginx за reverse-proxy) — отклонён.

| Аспект                    | Решение                                                                                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build**                 | `pnpm build` → `dist/` (статика). Vercel framework preset = `vite`.                                                                                                                                                         |
| **Hosting**               | Vercel CDN (статика `dist/`).                                                                                                                                                                                               |
| **API origin**            | Same-origin: Routing Middleware проксирует `/api/*` → backend из `BACKEND_ORIGIN`. Браузер ↔ Vercel — HTTPS; Vercel ↔ backend — server-side (нет mixed-content при HTTP-бэкенде). CORS не нужен.                            |
| **Backend origin config** | `BACKEND_ORIGIN` читается middleware на runtime. Переменная задаётся в Vercel Project Settings отдельно для Production и Preview; адрес backend в репозитории не хранится.                                                  |
| **Build-time env**        | `VITE_API_BASE_URL=/api/v1` (относительный, same-origin) — **запекается в bundle**. Задаётся в Project Settings → Environment Variables на Vercel + в `.env.example`.                                                       |
| **SPA fallback**          | `vercel.json` rewrite `/(.*) → /index.html` (после `/api/*`-правила). Deep-links React Router не отдают 404. Статика (`/assets/*`) резолвится файловой системой до rewrites.                                                |
| **CI/CD**                 | **GitHub Actions** — gate `typecheck → lint → test → build` на push/PR в `main` (соответствует [CLAUDE.md §7](../CLAUDE.md)). **Vercel Git-интеграция** — build + production deploy на push в `main`, preview-deploy на PR. |
| **Versioning**            | `__APP_VERSION__` из `package.json` (через `vite.config.ts define`). Git tag `superadmin-vX.Y.Z` — опционально.                                                                                                             |
| **Cache headers**         | Через `vercel.json headers`: `index.html` — `Cache-Control: no-store`; content-hashed `/assets/*` — `public, max-age=31536000, immutable`.                                                                                  |

### 11.1 Network security

| Слой               | Защита                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Транспорт**      | HTTPS only (Vercel managed TLS), HSTS.                                                                                                                                                                                                                                                                                                                               |
| **Доступ**         | ⚠️ **Отложено.** Vercel Hobby = публичный URL без IP-allowlist. Network-периметр (Vercel Deployment Protection / Trusted IPs — план Pro) пока не настроен. На текущем этапе защита — только app-login (super-admin auth + backend rate-limit `10/час` per email). См. [`OPEN_QUESTIONS.md#a3`](OPEN_QUESTIONS.md#a3-vercel-access-control--network-perimeter--open). |
| **CSP**            | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'`. `connect-src 'self'` достаточно — API same-origin через rewrite. Google Fonts (`index.html`) допущены явно.                    |
| **Доп. заголовки** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex` (internal tool, не индексируется).                                                                                                                                                                                                               |
| **CORS**           | Не нужен (same-origin через rewrite).                                                                                                                                                                                                                                                                                                                                |
| **CSRF**           | Не уязвимо: auth через `Authorization: Bearer` (не cookie). При миграции на httpOnly cookie ([OPEN_QUESTIONS#a1](OPEN_QUESTIONS.md#a1-token-storage-strategy--parked)) — добавить CSRF-token.                                                                                                                                                                        |

---

## 12. Ссылки на источники

- Backend архитектура: [`../backend_shyraq_v2/docs/architecture.md`](../../backend_shyraq_v2/docs/architecture.md)
- Backend эндпойнты (полный референс): [`../backend_shyraq_v2/docs/endpoints.md`](../../backend_shyraq_v2/docs/endpoints.md)
- Backend бизнес-процессы: [`../backend_shyraq_v2/docs/Shyraq BP.md`](../../backend_shyraq_v2/docs/Shyraq%20BP.md)
- Backend DB schema: [`../backend_shyraq_v2/docs/schema.dbml`](../../backend_shyraq_v2/docs/schema.dbml)
- Backend implementation tracker: [`../backend_shyraq_v2/IMPLEMENTATION_PLAN.md`](../../backend_shyraq_v2/IMPLEMENTATION_PLAN.md)
- Frontend endpoints (super-admin scope): [`endpoints.md`](endpoints.md)
- Frontend бизнес-процессы (super-admin scope): [`superadmin_BP.md`](superadmin_BP.md)
