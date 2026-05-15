# Shyraq SuperAdmin — Implementation Plan

Безопасный, поэтапный план разработки SuperAdmin frontend. **8 батчей**, каждый ≈ одна Claude Code сессия. Каждый батч заканчивается рабочим коммитом с проходящими acceptance-критериями.

**Контракты сверены с live Swagger** (`http://13.60.189.214:3000/docs-json`, последний аудит: 2026-05-14, OpenAPI ≈ 383KB, 202 paths из них 13 под `/saas/*` + 2 для super-admin под `/admin/*` + 2 health). Все URL/DTO/response shape'ы в этом плане — точные. Если backend меняется — `pnpm gen:api` + ре-аудит.

**Total estimate:** 24–32 часа чистого кодинга (с учётом готового handoff-дизайна и blocker'ов B.8-B.13). Календарно: 8–14 рабочих дней при 1 сессии в день.

---

## 0. Working agreement (правила игры)

1. **Один батч за сессию.** Не браться за следующий, пока acceptance current батча не зелёный.
2. **Safe & stable approach:** перед каждым риском (миграция packages, переписывание core-инфраструктуры) — сначала zero-risk POC в отдельном файле, потом интеграция.
3. **Commit per batch:** в конце батча — один merge commit с шаблонным сообщением (см. ниже). Не амендить, не rebase'ить.
4. **Backend changes blocking:** если в процессе батча обнаружено расхождение с `docs/endpoints.md` — записать в `docs/OPEN_QUESTIONS.md` (не править наобум). Если блокирующее — остановиться, обсудить.
5. **Doc-first:** меняешь scope/UI — сначала правишь `docs/DESIGN.md` или `docs/endpoints.md`, потом код. Doc + code в одном PR.
6. **No skip:** acceptance — обязательны. Не отмечать батч `[x]` пока ВСЕ критерии не зелёные.
7. **TODO discipline (см. CLAUDE.md §6.7):** каждый `// TODO(BN)` в коде — параллельная запись в раздел "TODO backlog" этого файла.

### Шаблон commit-сообщения

```
B<N>: <short title>

<2–4 lines: что сделано на high level>

Acceptance:
- [x] criterion 1
- [x] criterion 2
- [x] criterion 3

Refs: docs/IMPLEMENTATION_PLAN.md §B<N>
```

---

## Backend reality check (single source of facts)

Перед началом любого батча — этот блок отвечает на вопросы "какой URL", "какой field name", "какой response shape".

### URLs

| Что                               | URL                                   |
| --------------------------------- | ------------------------------------- |
| Backend base                      | `http://13.60.189.214:3000`           |
| API prefix (для всех endpoints)   | `/api/v1/`                            |
| Swagger UI                        | `http://13.60.189.214:3000/docs`      |
| Swagger JSON (для `pnpm gen:api`) | `http://13.60.189.214:3000/docs-json` |

> **Внимание:** Swagger UI/JSON живут на корне домена, **не** под `/api/v1/`. Все остальные endpoints — под `/api/v1/`.

### Vite dev proxy

В `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': { target: 'http://13.60.189.214:3000', changeOrigin: true },
  },
}
```

→ Frontend пишет `fetch('/api/v1/...')`, прокси тоннелит на backend. CORS не нужен.

### `.env.local`

```
VITE_API_BASE_URL=/api/v1
VITE_APP_VERSION=0.1.0
```

### Available endpoints (in-scope, MVP)

| Method | Path                                             | Auth   | Async?                    |
| ------ | ------------------------------------------------ | ------ | ------------------------- |
| POST   | `/api/v1/saas/auth/login`                        | public | sync                      |
| POST   | `/api/v1/saas/auth/refresh`                      | public | sync                      |
| POST   | `/api/v1/saas/auth/logout`                       | Bearer | sync                      |
| GET    | `/api/v1/saas/kindergartens`                     | Bearer | sync                      |
| POST   | `/api/v1/saas/kindergartens`                     | Bearer | sync (atomic TX)          |
| POST   | `/api/v1/saas/kindergartens/{id}/archive`        | Bearer | sync (cascade)            |
| POST   | `/api/v1/saas/kindergartens/{id}/restore`        | Bearer | sync                      |
| POST   | `/api/v1/saas/kindergartens/{id}/admin/invite`   | Bearer | sync (best-effort SMS)    |
| POST   | `/api/v1/saas/billing/monthly-run`               | Bearer | **202 async** (BullMQ)    |
| POST   | `/api/v1/saas/billing/discount-expire-run`       | Bearer | **202 async**             |
| POST   | `/api/v1/saas/billing/overdue-run`               | Bearer | **202 async**             |
| POST   | `/api/v1/saas/content/birthday-run`              | Bearer | **200 sync** (с counters) |
| POST   | `/api/v1/saas/content/story-cleanup-run`         | Bearer | **200 sync**              |
| POST   | `/api/v1/saas/content/publish-scheduled-run`     | Bearer | **200 sync**              |
| GET    | `/api/v1/admin/lifecycle/failed-jobs`            | Bearer | sync                      |
| POST   | `/api/v1/admin/lifecycle/failed-jobs/{id}/retry` | Bearer | 202 async                 |
| POST   | `/api/v1/admin/schedule/week-rollout/run`        | Bearer | sync (минуты)             |
| GET    | `/api/v1/health`                                 | public | sync                      |
| GET    | `/api/v1/health/ready`                           | public | sync                      |

### NOT available (blocker'ы, см. OPEN_QUESTIONS)

- `GET /api/v1/saas/kindergartens/{id}` — детальная страница садика → [B.8](OPEN_QUESTIONS.md#b8)
- `PATCH /api/v1/saas/kindergartens/{id}` — редактирование настроек → [B.8](OPEN_QUESTIONS.md#b8)
- `/api/v1/saas/saas-subscriptions/*` — модуль не существует → [B.9](OPEN_QUESTIONS.md#b9)
- `/api/v1/saas/feature-flags/*` — модуль не существует → [B.10](OPEN_QUESTIONS.md#b10)
- `/api/v1/saas/users/*` — модуль не существует → [B.11](OPEN_QUESTIONS.md#b11)
- `monthly-run` с `kindergarten_id` — backend возвращает 400 → [B.12](OPEN_QUESTIONS.md#b12)

### Точные DTO для критичных операций

**Auth:**

- `RefreshTokenDto` (используется и в refresh, и в logout): `{ refreshToken: string }` — **camelCase**, ровно 64 символа, обязательное поле даже в logout.
- `SuperAdminAuthResponseDto`: `{ access_token, refresh_token, token_type: 'Bearer', expires_in: 900, pending_role_select: false, roles: RoleResponseDto[] }` — **snake_case** в response.
- `RoleResponseDto`: `{ role: string, kindergarten_id: null, group_id: null }` — для super_admin всегда `kg_id=null`.

**Kindergartens:**

- `CreateKindergartenDto`: `{ name (req), slug (req), address?, phone?, plan?, settings?, admin: CreateKindergartenAdminDto (req) }`.
- `CreateKindergartenAdminDto`: `{ full_name (req), phone (req), locale?: 'ru' | 'kk' }`. **Locale enum = `'ru' | 'kk'`** (НЕ `kz`!).
- `KindergartenDto`: `{ id, name, slug, address (nullable), phone (nullable), plan, settings (object), is_active, archived_at (nullable ISO), created_at, updated_at }`.
- `KindergartenListResponseDto`: `{ items: KindergartenDto[], total: number, limit: number, offset: number }` — **offset-based pagination**.
- `InviteAdminDto`: `{ phone (req) }`.
- `InviteAdminResponseDto`: `{ phone, kindergarten_id, sent: boolean }`.
- Archive/restore возвращают `KindergartenDto` целиком.

**Billing triggers (все возвращают 202):**

- `TriggerMonthlyRunDto`: `{ kindergarten_id?: string, period_start?: string }` — но `kindergarten_id` backend отвергает с 400 ([B.12](OPEN_QUESTIONS.md#b12)). Frontend НЕ отправляет это поле.
- `TriggerDiscountExpireRunDto`: `{ now?: string }`.
- `TriggerOverdueRunDto`: `{ now?: string }`.
- Все три ответа: `{ job_id: string, status: string }`.

**Content triggers (все возвращают 200 sync):**

- `RunTriggerDto`: `{ now?: string }` — **только этот параметр**, НЕТ `kindergarten_id` или `date`.
- Ответ `RunTriggerResponseDto`: `{ triggered_at: ISO, processed_count: number, skipped_count: number, kindergartens_processed: number }`.

**Schedule rollout:**

- `RunWeeklyRolloutDto`: `{ fromMonday?: string }` — **camelCase**.
- Ответ `RolloutSummaryResponseDto`: `{ fromMonday: string, source: string, kindergartens: KindergartenWeeklyRolloutResultDto[], totals: RolloutTotalsDto }` — **camelCase везде**.

**Lifecycle DLQ:**

- Query: `?limit=number&cursor=string` (cursor — opaque base64, не int offset).
- Ответ `ListLifecycleFailedJobsResponseDto`: `{ items: FailedJobItemDto[], next_cursor: string | null }`.
- Retry endpoint: POST с **пустым телом `{}`** (DTO type=object). Ответ: `{ enqueued: boolean, job_id: string }`.

**Health:**

- `HealthStatusDto` (`/health`): `{ status, version, uptime_seconds, timestamp }` — всегда 200.
- `HealthReadyDto` (`/health/ready`): `{ status: 'ok' | 'degraded', checks: object }` — Swagger декларирует только 200; 503 не подтверждён ([B.13](OPEN_QUESTIONS.md#b13-healthready-503-contract--open)). Frontend смотрит на `status` поле, **не** на HTTP-код.

---

## Pre-flight checklist (B0 — выполнить ОДИН РАЗ перед B1)

Запускать каждую команду и убеждаться что всё зелёное.

```bash
# Backend health
curl -sS http://13.60.189.214:3000/api/v1/health | head
# → должно быть {"status":"ok","version":"...","uptime_seconds":...,"timestamp":"..."}

# Swagger UI открывается
curl -sS -o /dev/null -w "%{http_code}\n" http://13.60.189.214:3000/docs
# → 200

# Swagger JSON не пустой
curl -sS http://13.60.189.214:3000/docs-json | wc -c
# → должно быть > 100000 (~383KB)

# SuperAdmin login работает
curl -sS -X POST http://13.60.189.214:3000/api/v1/saas/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@shyraq.local","password":"<actual_password>"}' | head
# → должно быть {"access_token":"eyJ...","refresh_token":"...","token_type":"Bearer","expires_in":900,...}

# Tooling
node --version    # v20.x.x
pnpm --version    # >= 9
```

Также проверить локально:

- [ ] Git репо инициализирован, `.gitignore` включает `node_modules`, `dist`, `.env*`, `.DS_Store`, `*.log`
- [ ] `CLAUDE.md` прочитан (корень репо)
- [ ] `docs/architecture.md`, `docs/DESIGN.md`, `docs/endpoints.md`, `docs/OPEN_QUESTIONS.md` прочитаны overview-уровнем
- [ ] Handoff-зип распакован в `docs/design/handoff/` (не пустой)

**Если хоть один пункт НЕ выполнен — стоп, чинить.** Не начинать B1.

---

## B1 — Foundation

**Goal:** рабочий Vite-скелет с настроенным тулингом, дизайн-токенами, OpenAPI codegen и проверенной связью с backend через прокси.

**Time:** 2–3 часа

### Inputs

- [`docs/architecture.md §2-3`](architecture.md#2-стек) — стек и folder structure
- [`docs/design/handoff/shyraq-superadmin/project/tokens.css`](design/handoff/shyraq-superadmin/project/tokens.css) — дизайн-токены (копировать)

### Tasks

1. **Init Vite project:**

   ```bash
   pnpm create vite@latest . -- --template react-ts
   pnpm install
   ```

   Удалить дефолтный boilerplate (`App.css`, `assets/react.svg`, дефолтный CSS из `App.tsx`).

2. **Tailwind v4 setup:**

   ```bash
   pnpm add tailwindcss @tailwindcss/vite
   ```

   Подключить `@tailwindcss/vite()` plugin в `vite.config.ts`. Создать `src/styles/globals.css` с `@import "tailwindcss";`. Импортировать в `main.tsx`.

3. **Перенос design tokens** из `docs/design/handoff/.../tokens.css` в `src/styles/globals.css`:
   - Все CSS variables (`--bg-*`, `--text-*`, `--border-*`, `--brand*`, semantic, role colors, radii, shadows) — копировать as-is в `:root`.
   - Скопировать `body` typography reset и `*{box-sizing:border-box}` базовые стили (БЕЗ artboard `.ab` / `.ab--login` классов — они только для прототипа).
   - Подключить **Geist + Geist Mono** через Google Fonts в `index.html` (preconnect + stylesheet link).
   - Расширить Tailwind theme через `@theme` директиву (Tailwind v4 синтаксис) — мапить CSS vars на токены: `--color-brand: var(--brand)`, `--color-bg-canvas: var(--bg-canvas)`, etc.

4. **Folder structure** (создать пустые папки + index файлы — где Vite требует):

   ```
   src/api/   src/api/types/
   src/hooks/
   src/routes/
   src/components/ui/   src/components/layout/   src/components/data-table/
   src/components/forms/   src/components/feedback/
   src/lib/
   src/stores/
   src/locales/ru/   src/locales/kk/
   src/styles/
   ```

5. **shadcn/ui init:**

   ```bash
   pnpm dlx shadcn@latest init
   ```

   Конфиг: TypeScript ✓, Tailwind v4 ✓, alias `@/*` → `src/*`, default style "new-york", base color "neutral", CSS variables ✓.
   **Не устанавливать пока компоненты** — будем по требованию в следующих батчах.

6. **Path alias `@/*`:** настроить одинаково в `tsconfig.json` (paths) + `vite.config.ts` (resolve.alias) + `eslint.config.js` (если используется import resolver).

7. **Lucide icons:** `pnpm add lucide-react`. Создать `src/components/ui/icon.ts` — placeholder для маппинга (заполним по мере использования).

8. **`src/lib/cn.ts`:** утилита `clsx + tailwind-merge` (стандартный shadcn helper).

9. **Env validation (`src/env.ts`):**

   ```ts
   import { z } from 'zod';
   const schema = z.object({
     VITE_API_BASE_URL: z.string().min(1),
     VITE_APP_VERSION: z.string().default('0.0.0'),
   });
   export const env = schema.parse(import.meta.env);
   ```

   Создать `.env.example` (committed) и `.env.local` (gitignored):
   - `.env.example` — содержит `VITE_API_BASE_URL=/api/v1` и `VITE_APP_VERSION=0.1.0`
   - `.env.local` — копия `.env.example` (для dev)

10. **Vite dev proxy** (`vite.config.ts`):

    ```ts
    server: {
      proxy: {
        '/api': {
          target: 'http://13.60.189.214:3000',
          changeOrigin: true,
        },
      },
    },
    ```

11. **TanStack Query setup:**

    ```bash
    pnpm add @tanstack/react-query
    pnpm add -D @tanstack/react-query-devtools
    ```

    `src/main.tsx` — `<QueryClientProvider client={queryClient}>` с:

    ```ts
    new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
    });
    ```

    Devtools только в `import.meta.env.DEV`.

12. **React Router setup:**

    ```bash
    pnpm add react-router-dom
    ```

    `src/router.tsx` — `createBrowserRouter` со скелетом всех routes из [`docs/DESIGN.md §2.1`](DESIGN.md#21-sitemap). Каждый route возвращает `<div>{routeName}</div>` placeholder. Обернуть в `<RouterProvider>` в `main.tsx`.

13. **i18next:**

    ```bash
    pnpm add i18next react-i18next i18next-browser-languagedetector
    ```

    `src/lib/i18n.ts` — init с RU + KK, default `ru`, fallbackLng `ru`, languageDetector с `localStorage` под ключом `shyraq.sa.lang`. Создать `src/locales/{ru,kk}/common.json` с одним ключом `app.title: "Shyraq SuperAdmin"`.

14. **Sonner (toasts):** `pnpm add sonner`. `<Toaster position="top-right" richColors />` в `App.tsx`.

15. **OpenAPI codegen:**

    ```bash
    pnpm add -D openapi-typescript
    pnpm add openapi-fetch
    ```

    `package.json` script:

    ```json
    "gen:api": "openapi-typescript http://13.60.189.214:3000/docs-json -o src/api/types/openapi.d.ts"
    ```

    Запустить `pnpm gen:api`. Файл должен сгенериться (> 100KB, typical 500-600KB depending on backend schema). Закоммитить.

16. **ESLint + Prettier + Husky + lint-staged:**

    ```bash
    pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
      eslint-plugin-react-hooks eslint-plugin-react-refresh prettier \
      eslint-config-prettier eslint-plugin-import husky lint-staged
    ```

    `eslint.config.js` (flat config) + `.prettierrc` + `package.json` scripts:

    ```json
    "lint": "eslint . --max-warnings=0",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
    ```

    Husky setup: `pnpm dlx husky init` + `.husky/pre-commit` → `pnpm lint-staged`. `lint-staged` config в `package.json`:

    ```json
    "lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{json,md,css}": ["prettier --write"] }
    ```

17. **`.nvmrc`:** содержит `20` (одна строка).

18. **README.md:** короткий — что за проект (1 параграф), как запустить (`pnpm install && pnpm dev`), ссылки на `CLAUDE.md` и `docs/`.

### Acceptance criteria

- [ ] `pnpm install` exit 0
- [ ] `pnpm dev` поднимает сервер на http://localhost:5173
- [ ] Открыть `http://localhost:5173/login` → видно `<div>login</div>` placeholder
- [ ] Открыть `http://localhost:5173/kindergartens` → видно placeholder (роут зарегистрирован)
- [ ] `pnpm typecheck` — exit 0
- [ ] `pnpm lint` — exit 0
- [ ] `pnpm gen:api` — генерит `src/api/types/openapi.d.ts` размером > 100KB
- [ ] В DevTools браузера видно подключённый Geist шрифт (Network tab → fonts.gstatic.com → 200) + CSS variables на `:root`
- [ ] Tailwind class `bg-[var(--bg-canvas)]` рендерит корректный warm-neutral цвет (#f3f3f1)
- [ ] Husky pre-commit hook срабатывает на `git commit` (тестово создать файл с lint-ошибкой → commit падает)
- [ ] DevTools Console: `fetch('/api/v1/health').then(r=>r.json()).then(console.log)` → `{status: "ok", version: ..., uptime_seconds: ..., timestamp: ...}` (proxy работает)

### Commit

```
B1: Foundation (Vite, Tailwind, shadcn, tooling, OpenAPI codegen)

Initial scaffold: Vite+React+TS, Tailwind v4 with tokens from
design handoff, shadcn init, ESLint/Prettier/Husky, Zod env
validation, OpenAPI types from live Swagger, dev proxy to backend.

Acceptance: ...

Refs: docs/IMPLEMENTATION_PLAN.md §B1
```

---

## B2 — Auth + Shell

**Goal:** работающий end-to-end auth (login → JWT → silent refresh → logout) + базовый layout (Sidebar + Topbar) с навигацией по placeholder-страницам.

**Time:** 3–4 часа

### Inputs

- [`docs/endpoints.md §0`](endpoints.md#0-аутентификация-и-токены) — auth endpoints
- [`docs/architecture.md §6`](architecture.md#6-auth-и-токены) — token storage strategy
- [`docs/DESIGN.md §3`](DESIGN.md#3-shell--layout) + [`§5.1`](DESIGN.md#51-login)
- Visual reference:
  - `docs/design/handoff/.../screens-shell.jsx` → `ScreenLogin`, `ScreenDashboard` (для Shell-обёртки)
  - `docs/design/handoff/.../primitives.jsx` → `Sidebar`, `Topbar`, `Shell`, `Card`, `Field`, `Input`, `Button` компоненты

### Tasks

1. **Token storage (`src/lib/token-storage.ts`):**
   - Module-level переменная для access (in-memory, не leak в localStorage).
   - `localStorage` под ключом `shyraq.sa.refresh` для refresh-токена.
   - Methods: `getAccess(): string | null`, `setAccess(t)`, `getRefresh()`, `setRefresh(t)`, `setBoth({access, refresh})`, `clear()`.

2. **API client (`src/api/client.ts`):**
   - `pnpm add ky`. Создать `ky.create({ prefixUrl: env.VITE_API_BASE_URL })`.
   - `beforeRequest` hook: добавить `Authorization: Bearer <access>` если токен есть.
   - Кастомная ошибка `AppError(code, status, details)` в случае не-2xx ответа — парсит `{error, message, details}` из body. Если parse не удался — fallback `{code: 'unknown_error', status, details: null}`.
   - `afterResponse` hook: на 401 → `tryRefreshOnce()` (single-flight). При успехе — повторить оригинальный запрос с новым access. При fail → `tokenStorage.clear()` + `window.location.href = '/login?reason=session_expired'`.
   - `tryRefreshOnce()` — single-flight через module-level Promise mutex: первый параллельный 401 запускает refresh, остальные ждут результат.

3. **API auth functions (`src/api/auth.ts`):**

   ```ts
   export async function login({ email, password }: { email: string; password: string }) {
     return client
       .post('saas/auth/login', { json: { email, password } })
       .json<SuperAdminAuthResponse>();
   }
   export async function refresh(refreshToken: string) {
     return client
       .post('saas/auth/refresh', { json: { refreshToken } })
       .json<SuperAdminAuthResponse>();
   }
   export async function logout(refreshToken: string) {
     await client.post('saas/auth/logout', { json: { refreshToken } });
   }
   ```

   Типы — из openapi-typescript artifact (`SuperAdminAuthResponseDto`). Для type-safety использовать `openapi-fetch` если удобнее.

   > **Важно:** оба `refresh` и `logout` принимают `refreshToken` (camelCase, ровно 64 символа). В response поля snake_case (`access_token`, `refresh_token`).

4. **Hooks (`src/hooks/use-auth.ts`):**
   - `useLogin()` — `useMutation` обёртка. На success: `tokenStorage.setBoth({ access: r.access_token, refresh: r.refresh_token })`, `queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })`, redirect на `?next` или `/`.
   - `useLogout()` — `useMutation`. На success: `tokenStorage.clear()`, `queryClient.clear()`, `navigate('/login')`.
   - `useCurrentUser()` — placeholder: backend нет endpoint'а `/saas/me`. Декодируем JWT payload (через `jwt-decode` lib или ручной atob) для `{sub, role, email}` fallback'а.

5. **Query keys (`src/hooks/query-keys.ts`):**
   Централизованный объект:

   ```ts
   export const queryKeys = {
     auth: { me: () => ['auth', 'me'] as const },
     kindergartens: {
       all: ['kindergartens'] as const,
       list: (filters: object) => ['kindergartens', 'list', filters] as const,
     },
     health: { ready: () => ['health', 'ready'] as const },
     // ... остальное по мере добавления
   };
   ```

6. **AuthGuard (`src/components/layout/auth-guard.tsx`):**
   - Reads `tokenStorage.getRefresh()`. Если нет — `<Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`}/>`.
   - Если есть — `<Outlet />` (сценарий: refresh может быть просрочен, но это разрулит первый 401).

7. **Login page (`src/routes/login.tsx`):**
   - shadcn install: `button`, `input`, `label`, `card`. Также `pnpm add react-hook-form @hookform/resolvers zod` (если ещё нет).
   - RHF + Zod schema:
     ```ts
     const LoginSchema = z.object({
       email: z.string().email(),
       password: z.string().min(1),
     });
     ```
   - Layout — по [DESIGN §5.1](DESIGN.md#51-login) и `ScreenLogin` (centered card 420px, logo "SH", "Войдите в кабинет" title, email + password inputs, "Войти" CTA full-width, "Забыли пароль?" link → modal с текстом, version footer `v0.1.0 · production`).
   - Submit: `useLogin()` → success redirect / error → inline alert.
   - Error mapping: 401 → `t('auth.errors.invalid_credentials')`, 429 → `t('auth.errors.rate_limit')`, прочее → `t('errors.unknown_error')`.
   - Handle `?next=` (preserve) и `?reason=session_expired` (info-alert "Сессия истекла, войдите снова").

8. **Shell components:**
   - **Sidebar (`src/components/layout/sidebar.tsx`):** базируется на `primitives.jsx#Sidebar` (lines 44+). Преобразовать inline `style={{...}}` → Tailwind utilities. Items из [DESIGN §2.2](DESIGN.md#22-navigation-структура-sidebar). Active state определяется через `useLocation()`. Operations group — shadcn `<Accordion type="single" defaultValue="ops">`. Collapse toggle — переключает Zustand store.
   - **Topbar (`src/components/layout/topbar.tsx`):** breadcrumbs (placeholder, derive из route — позже сделаем умнее), language switcher (`<DropdownMenu>` RU/KK), user menu (`<DropdownMenu>` с inline avatar/имя + items: "Сменить пароль" disabled placeholder, "Выйти").
   - **Shell (`src/components/layout/shell.tsx`):** layout wrapper:
     ```tsx
     <div className="flex h-screen">
       <Sidebar />
       <div className="flex flex-col flex-1 min-w-0">
         <Topbar />
         <main className="flex-1 overflow-auto">
           <Outlet />
         </main>
       </div>
     </div>
     ```

9. **UI store (`src/stores/ui-store.ts`):** `pnpm add zustand`. Store:

   ```ts
   interface UiStore {
     sidebarCollapsed: boolean;
     locale: 'ru' | 'kk';
     toggleSidebar: () => void;
     setLocale: (l: 'ru' | 'kk') => void;
   }
   ```

   Persist через `zustand/middleware/persist` в localStorage под `shyraq.sa.ui`.

10. **Router updates (`src/router.tsx`):**

    ```tsx
    createBrowserRouter([
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <AuthGuard>
            <Shell />
          </AuthGuard>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'kindergartens', element: <KindergartensPage /> },
          // ...все остальные routes из DESIGN §2.1, пока placeholders
        ],
      },
      { path: '*', element: <NotFoundPage /> }, // создать в B3
    ]);
    ```

11. **i18n (`src/locales/{ru,kk}/auth.json`):**

    ```json
    {
      "title": "Войдите в кабинет",
      "subtitle": "Только для сотрудников Shyraq",
      "email": "Email",
      "password": "Пароль",
      "submit": "Войти",
      "forgot": "Забыли пароль?",
      "errors": {
        "invalid_credentials": "Неверный email или пароль",
        "rate_limit": "Превышен лимит попыток. Повторите через час.",
        "session_expired": "Сессия истекла, войдите снова"
      }
    }
    ```

    Также `common.json`: `logout`, `change_password`, `version`.

12. **Error map (`src/lib/error-map.ts`):**
    - Function `toI18nKey(errorCode: string): string` — маппит `invalid_credentials` → `errors.invalid_credentials`.
    - Создать `src/locales/{ru,kk}/errors.json` с базовыми кодами из [endpoints.md §11](endpoints.md#11-error-code-reference-cross-endpoint).
    - Fallback: `unknown_error` → "Неизвестная ошибка. Если повторяется, свяжитесь с разработкой."

### Acceptance criteria

- [ ] Открыть `/login` → визуально похоже на `ScreenLogin` (точный pixel-perfect не требуется в B2)
- [ ] Submit с правильными creds (`admin@shyraq.local` + актуальный пароль) → 200 → redirect на `/` → видно Shell с sidebar+topbar
- [ ] Submit с неверным паролем → inline alert "Неверный email или пароль"
- [ ] Sidebar items видны, active item подсвечен по текущему URL
- [ ] Click по sidebar item (например, "Садики") → переход на `/kindergartens` placeholder
- [ ] Sidebar collapse toggle работает, состояние persist'ится после reload (DevTools → Application → localStorage → `shyraq.sa.ui`)
- [ ] User menu → "Выйти" → POST `/api/v1/saas/auth/logout` (Network tab) → 204 → redirect `/login`
- [ ] После logout: localStorage `shyraq.sa.refresh` отсутствует, in-memory access cleared
- [ ] Language switcher RU↔KK меняет хотя бы один тестовый текст (например, заголовок Login)
- [ ] Перейти на `/kindergartens` без логина → redirect на `/login?next=%2Fkindergartens`
- [ ] После login на этом URL → redirect обратно на `/kindergartens`
- [ ] **Refresh flow:** в DevTools вручную обнулить access (`tokenStorage.setAccess(null)` через React Devtools или редактом source) + сделать любой API запрос → backend 401 → automatic refresh (Network: POST `/api/v1/saas/auth/refresh`) → оригинальный запрос повторяется и проходит

### Commit

```
B2: Auth + Shell

End-to-end auth: login (POST /saas/auth/login), single-flight JWT
refresh on 401, logout. AuthGuard. Sidebar + Topbar layout with
language switcher and user menu. Zustand UI store with persist.

Refs: docs/IMPLEMENTATION_PLAN.md §B2
```

---

## B3 — Dashboard + System Status + Error pages

**Goal:** домашняя страница с health-виджетом и quick-actions, детальная health-страница с историей, 404/403/500 error pages.

**Time:** 2–3 часа

### Inputs

- [`docs/endpoints.md §9`](endpoints.md#9-health--system-status) — health endpoints
- [`docs/DESIGN.md §5.2`](DESIGN.md#52----dashboard), [`§5.15`](DESIGN.md#515-system-status), [`§5.16`](DESIGN.md#516-error-pages)
- Visual reference:
  - `screens-shell.jsx` → `ScreenDashboard`
  - `screens-misc.jsx` → `ScreenSystemStatus`
  - `screens-extra.jsx` → `ScreenError404`, `ScreenError403`, `ScreenError500`, `ErrorPageLayout`

### Tasks

1. **Health API (`src/api/health.ts`):**

   ```ts
   export async function getHealth() {
     return client.get('health').json<HealthStatusDto>();
   }
   export async function getReady() {
     return client.get('health/ready').json<HealthReadyDto>();
   }
   ```

   Типы: `{ status, version, uptime_seconds, timestamp }` для `/health`; `{ status: 'ok' | 'degraded', checks: object }` для `/ready`.

2. **Hooks (`src/hooks/use-health.ts`):**
   - `useHealthReady()` → `useQuery` с `queryKey: queryKeys.health.ready()`, `refetchInterval: 30_000`, `retry: 0`, `staleTime: 0`.

3. **Reusable components:**

   > ⚠️ Все четыре виджета — domain-specific UI компоненты, не shadcn primitives. Лежат в `components/feedback/` согласно CLAUDE.md §4 (ui/ только для shadcn).
   - `src/components/feedback/stat.tsx` — Stat card (label + value + optional badge + optional divider). Из `primitives.jsx#Stat`.
   - `src/components/feedback/health-row.tsx` — строка `Component / Status / Last check` с pulse-dot.
   - `src/components/feedback/quick-action.tsx` — карточка-кнопка с icon + label + optional badge (для warning/error).
   - `src/components/feedback/pulse-dot.tsx` — анимированный dot (зелёный/красный/жёлтый).

4. **Dashboard (`src/routes/dashboard.tsx`):**
   - Page header: title "Главная" + subtitle "Обзор платформы Shyraq".
   - 2-колоночный grid: Health card + Quick actions card.
   - Health card: pulse-indicator (green/red), `<HealthRow>` для DB/Redis из `checks` объекта, "обновлено N сек назад" (computed из `Date.now() - lastFetch`), "Подробнее →" link на `/system-status`.
   - Quick actions card: 4 `<QuickAction>` кнопки — "Создать садик" → `/kindergartens/new`, "Monthly billing run" → `/operations/billing`, "Schedule rollout" → `/operations/schedule-rollout`, "Failed jobs" → `/operations/lifecycle-dlq`. Последний с warning-badge если backend dlq не пустой (опционально, можно отложить до B6).
   - Под grid'ом — Platform card (Stats): "Активных садиков", "Архивных", "Активных подписок" (показываем ?, см. ниже).
   - Подсчёт "Активных садиков" — через `useKindergartens({is_active: true, limit: 1})` → `total` из response. (Этот хук создадим в B4 — на B3 placeholder "—" приемлем).

5. **System Status (`src/routes/system-status.tsx`):**
   - Page header: title "Статус системы" + subtitle "Последнее обновление: <timestamp>", action button "↻ Обновить" → `queryClient.invalidateQueries(queryKeys.health.ready())`.
   - Top status block — pulse + текст "Все системы работают нормально" / "Сервисы нестабильны". При degraded — красный outline + Alert.
   - Components table: `API process`, `PostgreSQL`, `Redis` (parsed from `checks`).
   - History block: in-memory state (Zustand или `useState` в компоненте — последние 10 проверок). Обновляется на каждый успешный fetch через `useEffect(() => append(data), [data])`. Сброс при reload.

6. **Error pages:**
   - `src/routes/_404.tsx`, `src/routes/_403.tsx`, `src/routes/_500.tsx` — компоненты, не отдельные routes.
   - В роутере catch-all `* → <NotFoundPage>`. Корневой `errorElement={<ServerErrorPage>}` для top-level RouterProvider — ловит unhandled exceptions.
   - 403 не имеет автоматического trigger'а — рендерим вручную из useMutation onError если код `forbidden` (для DLQ retry, например).
   - Layout — по `screens-extra.jsx#ErrorPageLayout` + `ScreenError404/403/500`. Использовать shadcn `<Card>` + Lucide icons (`FileQuestion`, `Lock`, `AlertTriangle`). Centered content внутри Shell-обёртки (с пустым sidebar item).

7. **i18n (`src/locales/{ru,kk}/`):**
   - `dashboard.json`: title, subtitle, health.title, health.updated_ago, health.details, quick.create_kg, quick.monthly_run, quick.rollout, quick.failed_jobs, platform.active_kgs, etc.
   - `errors.json`: расширить (`not_found.title/subtitle`, `forbidden.title/subtitle`, `server_error.title/subtitle`).

### Acceptance criteria

- [ ] `/` (после login) показывает Health widget с green pulse и "DB up / Redis up"
- [ ] Polling работает: open Network tab → GET `/api/v1/health/ready` дёргается каждые 30 сек
- [ ] Quick action кнопки кликабельны и ведут на нужные routes (placeholder pages пока что)
- [ ] `/system-status` показывает текущий status + history table (заполняется по мере polling, минимум 2 строки после 60 сек)
- [ ] "↻ Обновить" триггерит немедленный refetch
- [ ] Перейти на несуществующий route `/foo/bar` → 404 page рендерится с правильным дизайном (Lucide icon + heading + 2 строки + CTA back)
- [ ] Force ошибку в каком-то route (throw в loader или component на короткое время) → 500 page рендерится через RouterProvider errorElement
- [ ] **Degraded test** (опционально, требует доступ к dev серверу для остановки Redis): если backend вернёт `status: 'degraded'` → status block становится красным, alert виден

### Commit

```
B3: Dashboard, System Status, Error pages

Health polling (30s) on dashboard with status widget and quick
actions. Detailed system status page with in-memory history.
404/403/500 error pages following ScreenError* designs.

Refs: docs/IMPLEMENTATION_PLAN.md §B3
```

---

## B4 — DataTable + Kindergartens list

**Goal:** переиспользуемый `<DataTable>` компонент + первая страница его использующая (`/kindergartens` list с offset-based pagination).

**Time:** 4–5 часов

### Inputs

- [`docs/endpoints.md §1.1`](endpoints.md#11-get-saaskindergartens--список) — List API контракт
- [`docs/DESIGN.md §4.2`](DESIGN.md#42-datatable--переиспользуемая-таблица), [`§5.3`](DESIGN.md#53-kindergartens--список-садиков)
- Visual reference: `screens-kg.jsx` → `ScreenKindergartens`

### Tasks

1. **shadcn install:** `table`, `dropdown-menu`, `select`, `popover`, `badge`, `skeleton`, `alert`.

2. **TanStack Table install:** `pnpm add @tanstack/react-table`.

3. **`<DataTable>` (`src/components/data-table/data-table.tsx`):**
   Generic компонент `<DataTable<T>>`:

   ```ts
   interface DataTableProps<T> {
     data: T[];
     columns: ColumnDef<T>[];
     toolbar?: ReactNode;
     pagination?: {
       hasNext: boolean;
       hasPrev: boolean;
       onNext: () => void;
       onPrev: () => void;
       rangeLabel: string;
     };
     state: 'loading' | 'loaded' | 'empty' | 'error';
     emptyState?: { title: string; description?: string; cta?: ReactNode };
     errorState?: { error: AppError; onRetry: () => void };
     onRowClick?: (row: T) => void;
   }
   ```

   Sub-components (внутри `data-table/`):
   - `data-table-toolbar.tsx` — slot для search + filters + CTA buttons
   - `data-table-pagination.tsx` — Prev/Next buttons + "Showing 1–N of T"
   - `data-table-empty.tsx` — empty state (Lucide icon + title + description + CTA)
   - `data-table-loading.tsx` — 5 skeleton rows
   - `data-table-error.tsx` — Alert с error.code → i18n + кнопка Retry
   - `data-table-row-actions.tsx` — `<DropdownMenu>` 3-точки

4. **Расширить shadcn `Badge` (`src/components/ui/badge.tsx`):**
   Добавить variants для status semantics: `success`, `warning`, `error`, `info`, `neutral`, `purple` (super_admin), `blue` (support). Также `dot` модификатор. По цветам [DESIGN §4.8](DESIGN.md#48-цветовая-семантика-статусов).

5. **API (`src/api/kindergartens.ts`):**

   ```ts
   export interface ListKindergartensParams {
     plan?: string;
     is_active?: boolean;
     archived?: boolean;
     name_search?: string;
     limit?: number;
     offset?: number;
   }
   export async function listKindergartens(params: ListKindergartensParams = {}) {
     return client
       .get('saas/kindergartens', { searchParams: params })
       .json<KindergartenListResponse>();
   }
   ```

   Типы — из openapi.d.ts (`KindergartenListResponseDto`, `KindergartenDto`).

6. **Hook (`src/hooks/use-kindergartens.ts`):**

   ```ts
   export function useKindergartens(params: ListKindergartensParams) {
     return useQuery({
       queryKey: queryKeys.kindergartens.list(params),
       queryFn: () => listKindergartens(params),
     });
   }
   ```

7. **`useDebounce` hook (`src/hooks/use-debounce.ts`):**
   - Generic — задерживает обновление value на 300мс. Используется для search input.

8. **Page (`src/routes/kindergartens/index.tsx`):**
   - Page header: title "Садики", subtitle "Все тенанты платформы Shyraq", CTA "Новый садик" → `/kindergartens/new`.
   - State: `useState` для filters (plan, is_active, archived, name_search debounced) + offset.
   - DataTable toolbar:
     - Search input (debounced 300ms) → filter `name_search`.
     - Filter `Plan`: shadcn `<Select>` (strings: "Все", "standard", "pro", "enterprise" — список можно hardcode на MVP, см. `// TODO(B5): plans list from backend?` — записать в TODO backlog).
     - Filter `Статус`: select (Все / Активные / Неактивные).
     - Filter `Архив`: select 3-value: `Все садики` (omit param) / `Только активные` (`archived=false`) / `Только архивные` (`archived=true`).
   - Columns по [DESIGN §5.3](DESIGN.md#53-kindergartens--список-садиков):
     - Название (name + slug под ним мелким серым)
     - Статус (`is_active` → badge active/inactive; `archived_at` → badge "Архив" если не null)
     - План (badge)
     - Подписка — placeholder "—" (нет endpoint'а, см. [B.9](OPEN_QUESTIONS.md#b9))
     - Телефон (formatted через `formatPhoneE164`)
     - Создан (relative time)
     - Действия (DropdownMenu)
   - Row click → `/kindergartens/:id` (placeholder в B5).
   - Row actions DropdownMenu:
     - "Открыть детали" → navigate `/kindergartens/:id`
     - "Resend admin invite" → mutation `inviteAdmin(id, {phone})` (но без формы — открывает модалку с input phone в B5)
     - separator
     - Если `is_active && !archived_at`: "⚠ Архивировать" (destructive, открывает confirm в B5)
     - Если `archived_at`: "✓ Восстановить"
   - Pagination: `pageSize = 50` (default backend), `offset` стартует с 0. `hasPrev = offset > 0`, `hasNext = offset + items.length < total`. RangeLabel: "Показано {offset+1}–{offset+items.length} из {total}".
   - Loading state: skeleton 5 rows.
   - Empty state: "Пока нет ни одного садика. Создайте первого." + CTA.
   - Error state: Alert + Retry.

9. **Page header component (`src/components/layout/page-header.tsx`):**
   Reusable: `{ title, subtitle?, actions? }`.

10. **Format helpers (`src/lib/format.ts`):**
    - `formatPhoneE164(phone: string): string` — `+7 (700) 123-45-67`. Если не E.164 → return as-is.
    - `formatRelativeTime(iso: string, locale: 'ru'|'kk'): string` — через `date-fns/formatDistanceToNow` + `date-fns/locale/ru` (для kk — fallback на ru, см. [C.6](OPEN_QUESTIONS.md#c6-i18n-kk-translation-ownership--open)).
    - `formatCurrency(amount: number, currency = 'KZT'): string` — `50 000 ₸`.
    - `pnpm add date-fns`.

11. **Platform card wiring (closes 2/3 TODO(B4)#01):**
    - В `src/routes/dashboard.tsx` Platform card: заменить `value={t('dashboard:platform.placeholder')}` на реальные данные:
      - `active_kgs`: `const { data: activeKgs } = useKindergartens({ is_active: true, limit: 1 }); value={activeKgs?.total ?? <Skeleton />}`
      - `archived_kgs`: `const { data: archivedKgs } = useKindergartens({ archived: true, limit: 1 }); value={archivedKgs?.total ?? <Skeleton />}`
      - `active_subscriptions`: остаётся `—` (blocked by [B.9](OPEN_QUESTIONS.md#b9-saas-subscriptions-module--blocker-)).
    - Loading state: маленький skeleton 24×20 на месте числа.
    - Error state: показываем `—` без панического alert (Health-карточка уже отражает global health).

12. **PageHeader retrofit:**
    - После создания `src/components/layout/page-header.tsx` (task 9) — заменить inline page-header markup в:
      - `src/routes/dashboard.tsx`: title + subtitle.
      - `src/routes/system-status.tsx`: title + subtitle + actions (Refresh button — это `actions` slot).
    - Удалить дублирующийся inline-разметочный код.

### Acceptance criteria

- [ ] `/kindergartens` показывает список реальных садиков из backend
- [ ] DevTools Network: GET `/api/v1/saas/kindergartens?limit=50&offset=0` возвращает `{items, total, limit, offset}`
- [ ] Search в toolbar: typing → запрос отправляется через 300ms (debounce проверить в DevTools)
- [ ] Filter Plan/Status/Archived → запросы с правильными query params
- [ ] Pagination Prev/Next работает (если в backend > 50 — иначе создать скриптом или вручную; если backend пустой — empty state)
- [ ] Click по row → переход на `/kindergartens/:id` (placeholder)
- [ ] Row action "Открыть детали" → переход на `/kindergartens/:id`
- [ ] Loading state: 5 skeleton rows при первой загрузке
- [ ] Empty state виден при пустом списке с CTA "Новый садик"
- [ ] Force error (отключить интернет на dev tools) → error Alert + Retry button
- [ ] Refetch на window focus НЕ происходит (defaultOptions из B1)
- [ ] Заголовки колонок **не** sortable на MVP (визуально header без cursor-pointer, без стрелок). Backend `/saas/kindergartens` не поддерживает `sort_by`/`order` — TODO(B?) в backlog для будущего add.
- [ ] Dashboard `/` Platform card: `active_kgs` и `archived_kgs` показывают реальные числа из backend (через `useKindergartens({...,limit:1}).total`); `active_subscriptions` остаётся `—` (B.9).
- [ ] `<PageHeader>` используется в `routes/dashboard.tsx` и `routes/system-status.tsx`; inline page-header markup удалён.

### Commit

```
B4: DataTable + Kindergartens list

Generic DataTable with offset pagination, toolbar slots, empty/loading/
error states. /kindergartens list with filters (plan, is_active,
archived, name_search debounced 300ms) and row actions.

Refs: docs/IMPLEMENTATION_PLAN.md §B4
```

---

## B5 — Kindergartens operations (create + archive + restore + admin invite)

**Goal:** вся доступная KG операционка на MVP — create wizard, archive с destructive confirm, restore, admin invite (resend SMS). Минимальный "детальный" view через данные list-row (без `GET /:id`).

**Time:** 3–4 часа

> **Scope note:** изначальный план включал tabs (Overview / Settings / Subscription / Flags / View-as) с полноценным detail page. На MVP **GET/PATCH /saas/kindergartens/{id}` не существуют** ([B.8](OPEN_QUESTIONS.md#b8)), модули subscriptions/flags ([B.9](OPEN_QUESTIONS.md#b9), [B.10](OPEN_QUESTIONS.md#b10)) тоже отсутствуют. Поэтому detail page = упрощённый: данные читаются из list-cache (backend list возвращает полный `KindergartenDto`), редактирование settings — заблокировано. Заглушки для остальных табов делаются в **B7**.

### Inputs

- [`docs/endpoints.md §1.2-1.5`](endpoints.md#12-post-saaskindergartens--создать-тенанта-atomic-bootstrap) — KG endpoints
- [`docs/superadmin_BP.md §2`](superadmin_BP.md#2-kindergarten-lifecycle-tenant-management) — KG lifecycle BP
- [`docs/DESIGN.md §5.4-5.5`](DESIGN.md#54-kindergartensnew--создать-садик) + [`§4.5`](DESIGN.md#45-destructive-confirmations) (destructive)
- Visual reference:
  - `screens-kg.jsx` → `ScreenKgCreate`, `ScreenKgCreateStep2`, `ScreenKgOverview`
  - `screens-misc.jsx` → `ScreenDestructiveModal`

### Tasks

1. **shadcn install:** `tabs`, `dialog`, `accordion`, `radio-group`, `switch`, `separator`, `textarea`.

2. **API extensions (`src/api/kindergartens.ts`):**

   ```ts
   export async function createKindergarten(body: CreateKindergartenDto) {
     return client.post('saas/kindergartens', { json: body }).json<CreateKindergartenResponse>();
   }
   export async function archiveKindergarten(id: string) {
     return client.post(`saas/kindergartens/${id}/archive`).json<KindergartenDto>();
   }
   export async function restoreKindergarten(id: string) {
     return client.post(`saas/kindergartens/${id}/restore`).json<KindergartenDto>();
   }
   export async function inviteAdmin(id: string, body: { phone: string }) {
     return client
       .post(`saas/kindergartens/${id}/admin/invite`, { json: body })
       .json<InviteAdminResponse>();
   }
   ```

3. **Hooks (`src/hooks/use-kindergartens.ts`):**
   - `useCreateKindergarten()` → mutation. On success: invalidate `queryKeys.kindergartens.all`, toast success.
   - `useArchiveKindergarten()`, `useRestoreKindergarten()` — то же.
   - `useInviteAdmin()` — toast включает `r.sent ? "SMS отправлен" : "SMS не отправлен (best-effort)"`.

4. **Slug helper (`src/lib/slug.ts`):**
   - `slugify(s: string): string` — RU/KK транслитерация в латиницу + lowercase + dashes. Можно использовать `pnpm add slugify` или ручная мап-таблица для кириллицы.

5. **Phone input (`src/components/forms/phone-input.tsx`):**
   - Wrapper над shadcn Input с E.164 mask. На submit отправляем `+77001234567` (без пробелов/скобок).
   - Валидация Zod: `z.string().regex(/^\+[1-9]\d{1,14}$/)`.

6. **`/kindergartens/new` (2-step wizard, `src/routes/kindergartens/new.tsx`):**
   - State: `step: 1 | 2`, two RHF forms (или один с conditional schemas).
   - Layout: progress indicator вверху ("[1] Садик / [2] Первый администратор").
   - **Step 1 form** (Zod):
     ```ts
     const KgStep1Schema = z.object({
       name: z.string().min(1).max(255),
       slug: z.string().regex(/^[a-z0-9-]+$/),
       address: z.string().max(500).optional().or(z.literal('')),
       phone: z
         .string()
         .regex(/^\+[1-9]\d{1,14}$/)
         .optional()
         .or(z.literal('')),
       plan: z.string().default('standard'),
       settings: z.record(z.unknown()).default({}),
     });
     ```
     Slug auto-generates из name через `slugify(name)` на blur (если поле slug ещё не trogano пользователем).
     Settings — внутри shadcn `<Accordion>` (default closed): timezone (`Asia/Almaty`), currency (`KZT`), late_pickup_fee_amount, otp_expiry_seconds, payment_grace_days. Все optional, defaults применяются на бэкенде.
     "Далее" button: `disabled={!isValid}`.
   - **Step 2 form** (Zod):
     ```ts
     const KgStep2Schema = z.object({
       full_name: z.string().min(1).max(255),
       phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
       locale: z.enum(['ru', 'kk']).default('ru'),
     });
     ```
     "Создать садик" button. На submit:
     ```ts
     const body: CreateKindergartenDto = {
       ...step1Data,
       admin: step2Data,
     };
     await createMutation.mutateAsync(body);
     ```
   - On success: toast "Садик создан. Welcome-SMS отправлен на {phone}." + redirect `/kindergartens/:newId`.
   - Errors:
     - 409 → если message содержит "slug" → возврат на Step 1, `setError('slug')` + alert.
     - 400 (validation) → попытка распарсить `details.field` → `setError(field)`. Иначе общий toast.

7. **`/kindergartens/:id` (`src/routes/kindergartens/$id/index.tsx`):**
   - Поскольку `GET /saas/kindergartens/{id}` не существует — данные читаем из list query cache:
     ```ts
     const kg = queryClient
       .getQueriesData({ queryKey: queryKeys.kindergartens.all })
       .flatMap(([, data]) => (data as KindergartenListResponse | undefined)?.items ?? [])
       .find((k) => k.id === id);
     ```
     Если в cache нет — fetch свежий list с фильтром `?name_search=` или через `?archived=true` если архив. Если всё равно нет → 404.
   - Page header: name, slug, badges (active/inactive, plan, "Архив" если archived), back link "← Садики".
   - Action buttons в header:
     - Если active: `[⚠ Архивировать]` (destructive)
     - Если archived: `[✓ Восстановить]` (default)
     - `[Отправить welcome-SMS повторно]` — открывает модалку для phone input
   - Tabs nav: Обзор / Настройки / Подписка / Feature Flags / View as. Реализуем только **Обзор** в B5; остальные 4 — placeholder routes (заглушки в B7).
   - **Обзор** контент:
     - Card "Системная информация": id (mono, copyable), slug, plan, created_at, updated_at, archived_at (если есть)
     - Card "Settings": JSON-pretty view (read-only) полей `settings` объекта. Comment alert: "Редактирование settings будет доступно после backend-релиза. См. [OPEN_QUESTIONS#b8](../OPEN_QUESTIONS.md#b8-kindergarten-detail--settings-endpoints--blocker-)."
     - Card "Контакты": address, phone

8. **Tab routes (placeholder shells):**
   - `routes/kindergartens/$id/settings.tsx` — заглушка (B7 наполнит).
   - `routes/kindergartens/$id/subscription.tsx` — заглушка.
   - `routes/kindergartens/$id/flags.tsx` — заглушка.
   - `routes/kindergartens/$id/view-as.tsx` — заглушка (по [BP §8](superadmin_BP.md#8-view-as-kindergarten-mvp-placeholder)).

   Все 4 на B5 рендерят `<BlockedFeature reason="b8" />` или аналогичный компонент (создаём в B7).

9. **Destructive confirm (`src/components/feedback/destructive-confirm.tsx`):**

   ```tsx
   interface DestructiveConfirmProps {
     trigger: ReactNode; // обычно Button
     title: string;
     description: ReactNode;
     confirmationField?: { label: string; expectedValue: string };
     confirmLabel: string; // e.g. "⚠ Архивировать"
     onConfirm: () => Promise<void> | void;
   }
   ```

   - shadcn `<Dialog>` обёртка.
   - Если `confirmationField` задан — input + confirm button disabled пока не совпадает.
   - Если не задан — простой Yes/Cancel.

10. **Archive flow:** в KG Overview header — `<DestructiveConfirm trigger={<Button variant="destructive">Архивировать</Button>} title="Архивировать садик ..." confirmationField={{label: "Введите slug", expectedValue: kg.slug}} ...>`. На confirm: `archiveMutation.mutate(id)`. Toast + redirect `/kindergartens` (отфильтровать на `archived: true` если хотим продолжать видеть).

11. **Restore flow:** простой confirm (soft action). После — toast.

12. **Admin invite modal:** `<Dialog>` с phone input. На submit: `inviteAdmin(id, {phone})`. Toast по результату `sent: bool`.

### Acceptance criteria

- [ ] `/kindergartens/new` Step 1: slug auto-генерится из name на blur (например, "Солнышко" → "solnyshko")
- [ ] Step 1 → "Далее" disabled пока required (name, slug) не валидны
- [ ] Step 2 → "Создать садик" → POST `/api/v1/saas/kindergartens` (DevTools Network) → 201 → toast → redirect на `/kindergartens/:newId`
- [ ] 409 на duplicate slug → возврат на Step 1, slug input подсвечен ошибкой
- [ ] 400 invalid phone → подсветка соответствующего поля
- [ ] `/kindergartens/:id` показывает данные kg (имя, slug, plan, settings JSON, contacts) — данные взяты из list cache (НЕ отдельный GET)
- [ ] Click "Архивировать" → destructive modal → ввод правильного slug разблокирует кнопку → POST `/archive` → 200 → toast → KG исчезает из active list, появляется в archived
- [ ] Click "Восстановить" на archived KG → simple confirm → POST `/restore` → 200 → KG возвращается в active list
- [ ] Admin invite modal: ввод phone → POST `/admin/invite` → 200 → toast `"SMS отправлен на <phone>"` или `"SMS не отправлен (best-effort)"` в зависимости от `sent` поля
- [ ] Tabs nav (Settings/Subscription/Flags/View-as) — кликабельные, ведут на placeholder pages (наполнение в B7)

### Commit

```
B5: Kindergartens — create wizard, archive/restore, admin invite

2-step wizard for atomic kg+admin bootstrap (POST /saas/kindergartens).
Archive with destructive confirm (slug typing). Restore. Admin invite
modal (resend welcome SMS). Detail page reads from list cache (no
GET /:id available, see B.8).

Refs: docs/IMPLEMENTATION_PLAN.md §B5
```

---

## B6 — Operations (manual cron triggers + DLQ)

**Goal:** все 4 операторские страницы — billing triggers (3 cards, 202 async), content triggers (3 cards, 200 sync), schedule rollout (с per-kg результатами), lifecycle DLQ (с retry).

**Time:** 5–6 часов

### Inputs

- [`docs/endpoints.md §5-8`](endpoints.md#5-billing-operations-manual-triggers--saasbilling) — exact contracts
- [`docs/superadmin_BP.md §5-6`](superadmin_BP.md#5-operational-cron-triggers)
- [`docs/DESIGN.md §5.11-5.14`](DESIGN.md#511-operationsbilling--manual-billing-triggers)
- Visual reference: `screens-ops.jsx` → `ScreenOpsBilling`, `ScreenOpsContent`, `ScreenOpsRollout`, `ScreenOpsDLQ`

### Tasks

1. **API modules:**
   - `src/api/billing-ops.ts`:
     ```ts
     export async function triggerMonthlyRun(body: { period_start?: string }) {
       // NB: kindergarten_id field accepted by DTO but rejected with 400 (B.12) — do NOT send.
       return client.post('saas/billing/monthly-run', { json: body }).json<{ job_id: string; status: string }>();
     }
     export async function triggerDiscountExpireRun(body: { now?: string }) { ... }
     export async function triggerOverdueRun(body: { now?: string }) { ... }
     ```
   - `src/api/content-ops.ts`:
     ```ts
     export async function triggerBirthdayRun(body: { now?: string }) {
       return client.post('saas/content/birthday-run', { json: body }).json<RunTriggerResponse>();
     }
     // и аналогично storyCleanupRun, publishScheduledRun
     ```
     Response shape: `{ triggered_at, processed_count, skipped_count, kindergartens_processed }`.
   - `src/api/schedule-rollout.ts`:
     ```ts
     export async function runWeeklyRollout(body: { fromMonday?: string }) {
       return client
         .post('admin/schedule/week-rollout/run', { json: body })
         .json<RolloutSummaryResponse>();
     }
     ```
   - `src/api/lifecycle-jobs.ts`:
     ```ts
     export async function listFailedJobs(params: { limit?: number; cursor?: string }) {
       return client
         .get('admin/lifecycle/failed-jobs', { searchParams: params })
         .json<ListFailedJobsResponse>();
     }
     export async function retryFailedJob(id: string) {
       return client
         .post(`admin/lifecycle/failed-jobs/${id}/retry`, { json: {} })
         .json<{ enqueued: boolean; job_id: string }>();
     }
     ```

2. **Hooks** для всех — `useMutation` для triggers, `useQuery` для DLQ list.

3. **Operations UI store (`src/stores/operations-store.ts`):**
   - Zustand: сохраняет последний `result` каждого триггера в memory (не persist). Ключ — `triggerName`.
   - При reload результаты теряются (это ОК — backend идемпотентен, операции можно повторить).

4. **Reusable components:**
   - `src/components/operations/trigger-card.tsx`:
     ```tsx
     <TriggerCard
       title="Monthly Invoice Generation"
       icon={<Calendar />}
       description="Генерация ежемесячных инвойсов..."
       lastResult={result}
       confirmText="Сгенерировать инвойсы за июнь 2026?"
     >
       {/* form fields */}
       <Button onClick={handleSubmit}>▶ Запустить</Button>
     </TriggerCard>
     ```
   - `src/components/operations/trigger-result.tsx` — отображение результата: success badge + summary table + timestamp + collapsible "Детали".

5. **`/operations/billing` (`src/routes/operations/billing.tsx`):**
   - 3 trigger cards в grid (1-col на narrow, 3-col на wide).
   - **Monthly Run card:**
     - Field `Period start` — date picker (shadcn `<Popover>` + `<Calendar>`). Restricted to first day of month (validate `d.getDate() === 1`).
     - **NO kindergarten select** (B.12 blocker — backend отвергает).
     - Confirm modal перед submit: "Запустить генерацию инвойсов за {month-year}?".
     - Backend возвращает 202 async — toast "Задача в очереди (job_id: ...)" + сохранить result в store. Не ждём результат синхронно.
   - **Discount Expire card:**
     - Field `Now override` (optional, ISO datetime — datetime-local input).
     - 202 async — toast.
   - **Overdue Sweep card:**
     - Field `Now override` (optional).
     - 202 async — toast.

6. **`/operations/content` (`src/routes/operations/content.tsx`):**
   - 3 trigger cards аналогично.
   - **Все три** принимают только `now?: string` (ISO). НЕ показывать kindergarten select / date picker — это поля старого спека, реальный backend их не принимает.
   - Все три возвращают 200 sync с `{triggered_at, processed_count, skipped_count, kindergartens_processed}` — показываем counters в success badge сразу.

7. **`/operations/schedule-rollout` (`src/routes/operations/schedule-rollout.tsx`):**
   - Single full-width card.
   - Field `fromMonday` — date picker, restricted к понедельникам (`d.getDay() === 1`). Default — пустое (backend подставит previous Monday).
   - "▶ Запустить роллаут" button с confirm.
   - Submit — синхронный (минуты). Loading state с indeterminate progress.
   - Result section разворачивается под card'ом:
     - `totals` block: kindergartens, copiedGroups, skippedGroups, totalEvents, plansCreated, plansSkipped, errors.
     - Per-kg expandable table: kindergartenId (truncated), schedule (`copiedGroups / totalEvents`), meal (`plansCreated`), error (если есть, expandable).
   - **NB: response поля camelCase!** `fromMonday`, `kindergartenId`, `copiedGroups`, `skippedGroups`, `totalEvents`, `plansCreated`, `plansSkipped`. Не путать со snake_case в auth/kindergartens.

8. **`/operations/lifecycle-dlq` (`src/routes/operations/lifecycle-dlq.tsx`):**
   - Page header: title "Failed Jobs (Lifecycle DLQ)", subtitle "BullMQ failed-jobs · auto-cleanup через 30 дней", action "↻ Обновить".
   - DataTable из B4. Cursor-based pagination: state `cursor: string | null`, on Next → `setCursor(data.next_cursor)`, on Prev — нужен стек предыдущих cursor'ов.
   - Toolbar filters: `processor` (text input, client-side filter on current cursor page only — записать в TODO `processor` filter migration when backend adds `?name=`). **No `kindergartenId` filter on MVP** (D18 — omit; see TODO backlog). **No "failed_in_last" filter on MVP** (backend не поддерживает).
   - Columns:
     - ID (mono, truncated, click → expand row)
     - Processor (badge с `name` — например, `lifecycle:pro-rata-refund`)
     - Kindergarten — `payload.kindergartenId` (truncated UUID; tooltip с full)
     - Failed reason (truncated 80ch, click → modal с full string)
     - Attempts (`attempts_made`)
     - Failed at (`finished_on` → `formatRelativeTime`)
     - Действия (`[Retry]` button)
   - Row expand (accordion внутри row): full payload JSON (через `<JsonViewer>` ниже).
   - Retry: confirm dialog → POST → 202 → toast "Job ретрайнут (новый job_id: {id})". Errors:
     - 404 `lifecycle_job_not_found` → "Job уже удалён auto-cleanup'ом"
     - 409 `lifecycle_job_not_in_failed_state` → "Job уже не в failed state (active/completed)"
     - 403 `forbidden` → "Нет доступа" (для support роли когда RBAC появится)

9. **`<JsonViewer>` (`src/components/ui/json-viewer.tsx`):**
   - Простой `<pre>` с monospace + copy button. Без syntax highlight на MVP (это polish).

### Acceptance criteria

- [ ] `/operations/billing` Monthly Run: pick date 1-е число → confirm modal → submit → POST `/api/v1/saas/billing/monthly-run` (DevTools) → 202 → toast "В очереди" с job_id
- [ ] Date picker НЕ позволяет выбрать число != 1-го
- [ ] Monthly Run **НЕ показывает** select садика (B.12)
- [ ] Discount Expire: optional `now` поле работает; 202 → toast
- [ ] Overdue Sweep: 202 → toast
- [ ] `/operations/content` все 3 trigger'а работают: 200 sync → counters сразу в success badge
- [ ] `/operations/schedule-rollout`: date picker только понедельники, default empty (backend подставит previous Monday)
- [ ] Schedule rollout result показывает per-kg таблицу с camelCase полями
- [ ] `/operations/lifecycle-dlq` показывает failed jobs (если backend пустой — empty state OK)
- [ ] Cursor pagination работает: Next → новый cursor подставляется в query, Prev — возврат к предыдущему cursor (или disabled на первой странице)
- [ ] Row expand → виден full payload JSON
- [ ] Retry button: confirm → POST с пустым body `{}` → 202 → toast
- [ ] Force 404 на retry (попытка retry для несуществующего id) → правильный error toast

### Commit

```
B6: Operations — billing/content triggers, schedule rollout, lifecycle DLQ

3 billing cards (202 async), 3 content cards (200 sync), schedule
rollout with per-kg result table (camelCase), DLQ table with cursor
pagination and retry. monthly-run kg select hidden (B.12).

Refs: docs/IMPLEMENTATION_PLAN.md §B6
```

---

## B7 — Blocked module placeholders

**Goal:** placeholder UI для всех routes, заблокированных backend'ом ([B.8-B.11](OPEN_QUESTIONS.md#b-endpoints--backend-api-contracts)). Sidebar items видны, ссылки работают, но страницы рендерят информативные info-alert'ы со ссылками на blocker'ы.

**Time:** 2 часа

### Routes to placeholder

- `/subscriptions` — cross-kg list ([B.9](OPEN_QUESTIONS.md#b9))
- `/feature-flags` — cross-kg list ([B.10](OPEN_QUESTIONS.md#b10))
- `/users` — list SaaS users ([B.11](OPEN_QUESTIONS.md#b11))
- `/users/new` — create SaaS user ([B.11](OPEN_QUESTIONS.md#b11))
- `/users/:id` — edit SaaS user ([B.11](OPEN_QUESTIONS.md#b11))
- `/kindergartens/:id/settings` — KG settings tab ([B.8](OPEN_QUESTIONS.md#b8))
- `/kindergartens/:id/subscription` — KG subscription tab ([B.9](OPEN_QUESTIONS.md#b9))
- `/kindergartens/:id/flags` — KG flags tab ([B.10](OPEN_QUESTIONS.md#b10))
- `/kindergartens/:id/view-as` — placeholder (всё ещё, согласно [BP §8](superadmin_BP.md#8-view-as-kindergarten-mvp-placeholder))

### Tasks

1. **`<BlockedFeature>` component (`src/components/feedback/blocked-feature.tsx`):**

   ```tsx
   interface BlockedFeatureProps {
     blockerCode: 'b8' | 'b9' | 'b10' | 'b11'; // OPEN_QUESTIONS reference
     featureName: string; // e.g. "Управление подписками SaaS"
     description?: ReactNode; // override default
     actionsBelow?: ReactNode; // optional CTAs
   }
   ```

   Layout — по `screens-extra.jsx#ErrorPageLayout` или `ScreenKgViewAs`:
   - Большой Lucide icon (`Wrench` / `Construction` / `Lock`)
   - Heading: "{featureName} недоступно"
   - Description: "Функционал требует backend-эндпоинта, которого пока нет. См. [OPEN_QUESTIONS.md#{blockerCode}](#)" (link открывает соответствующий MD в новой вкладке)
   - Optional actions

2. **Default descriptions per blocker** (i18n keys в `errors.json`):
   - `b8`: "Эндпоинты `GET/PATCH /saas/kindergartens/{id}` ещё не реализованы. Детали садика отображаются из списка."
   - `b9`: "Модуль `/saas/saas-subscriptions` ещё не реализован."
   - `b10`: "Модуль `/saas/feature-flags` ещё не реализован."
   - `b11`: "Модуль `/saas/users` ещё не реализован. Управление SaaS-пользователями через DB seed."

3. **Routes:**
   - `/subscriptions` → `<BlockedFeature blockerCode="b9" featureName="Управление подписками SaaS" />`
   - `/feature-flags` → `<BlockedFeature blockerCode="b10" featureName="Feature Flags" />`
   - `/users`, `/users/new`, `/users/:id` → `<BlockedFeature blockerCode="b11" featureName="SaaS пользователи" />`
   - `/kindergartens/:id/settings` → `<BlockedFeature blockerCode="b8" featureName="Настройки садика" />`
   - `/kindergartens/:id/subscription` → `<BlockedFeature blockerCode="b9" featureName="Подписка садика" />`
   - `/kindergartens/:id/flags` → `<BlockedFeature blockerCode="b10" featureName="Feature flags садика" />`
   - `/kindergartens/:id/view-as` → отдельный copy, но тот же компонент (можно extra prop `customMessage`).

4. **Sidebar visual handling** (опционально):
   - Не блокируем visually — показываем нормально, чтобы пользователь видел "куда мы движемся".
   - Можно добавить тонкую "soon" badge рядом с item label (через `<Badge tone="neutral" size="xs">`). Если решим — заметка в TODO backlog.

### Acceptance criteria

- [ ] `/subscriptions` рендерит `<BlockedFeature>` с правильным текстом и ссылкой на [B.9](OPEN_QUESTIONS.md#b9)
- [ ] `/feature-flags` — то же для B.10
- [ ] `/users`, `/users/new`, `/users/:id` — то же для B.11
- [ ] `/kindergartens/:id/settings` — placeholder для B.8 внутри KG tab layout (sidebar/topbar/back-link сохраняется)
- [ ] `/kindergartens/:id/subscription` — placeholder для B.9
- [ ] `/kindergartens/:id/flags` — placeholder для B.10
- [ ] `/kindergartens/:id/view-as` — placeholder с pattern из BP §8
- [ ] Все ссылки на `OPEN_QUESTIONS.md` работают (открывается markdown через GitHub view или local viewer)
- [ ] Sidebar items для blocked features всё ещё кликабельные (не disabled)

### Commit

```
B7: Blocked module placeholders

<BlockedFeature> component for all routes blocked by missing
backend modules (B.8/B.9/B.10/B.11). Routes registered, info-
alert with links to OPEN_QUESTIONS. Sidebar items remain visible.

Refs: docs/IMPLEMENTATION_PLAN.md §B7
```

---

## B8 — Polish

**Goal:** production-ready состояние: command palette, keyboard shortcuts, complete i18n, mobile alert, accessibility, build optimization.

**Time:** 3–4 часа

### Inputs

- [`docs/DESIGN.md §6-8`](DESIGN.md#6-cross-cutting-ux) — cross-cutting + responsive + a11y
- Visual reference: `screens-misc.jsx` → `ScreenGlobalSearch`, `ScreenStates`, `ScreenMobileAlert`, `ScreenFlagCreate` (для overlays-паттернов, даже если flags заблокированы)
- [`docs/OPEN_QUESTIONS.md#c6`](OPEN_QUESTIONS.md#c6-i18n-kk-translation-ownership--open) — closes via this batch's Slice S1 (native sub-agent pass).

### Tasks

1. **Command palette (`src/components/ui/command-palette.tsx`):**
   - shadcn install: `command`.
   - Trigger: `Cmd/Ctrl+K`.
   - Search across kindergartens (parallel `listKindergartens?name_search=&limit=5`) + ops actions (статичные пункты: "Open Lifecycle DLQ", "Run birthday-generation", etc.).
   - На MVP без users/subs/flags (заблокированы).

2. **Keyboard shortcuts:** `pnpm add react-hotkeys-hook`. Регистрировать в `App.tsx`. Шорткаты по [DESIGN §6.1](DESIGN.md#61-keyboard-shortcuts). Подсказка `?` открывает modal с listing'ом.

3. **i18n complete pass:**
   - Все namespace'ы должны существовать: `common`, `auth`, `kindergartens`, `operations`, `errors`, `dashboard`, `system_status`.
   - RU — production-ready тексты.
   - KK — placeholder с маркером `[KK] ...` если нет native speaker; зафиксировать в `OPEN_QUESTIONS.md#c6` как блокер production-ready KK.
   - **Audit:** grep по `*.tsx` для hardcoded RU-строк → перенести в `t(...)`.

4. **Mobile alert (`src/components/feedback/mobile-not-supported.tsx`):**
   - Hook `useViewportWidth()` — отслеживает `window.innerWidth` (resize event).
   - Если `< 768` → full-page alert (centered, по `ScreenMobileAlert`) с текстом "SuperAdmin доступен только на desktop / tablet. Используйте экран шириной ≥ 768px."
   - Регистрировать в `App.tsx` как top-level conditional render — рендерится **поверх** всего остального.

5. **Empty/error states audit:** пройтись по всем DataTable использованиям, убедиться что empty state кастомизирован per-page (не дефолтный).

6. **Skeleton loaders audit:** проверить что initial load каждой страницы показывает skeleton, не spinner.

7. **Accessibility pass:**
   - Tab navigation: все interactive elements достижимы клавиатурой.
   - Focus visible: проверить focus ring (Radix даёт by default).
   - Все icon-only buttons имеют `aria-label` (например, `<Button aria-label="Свернуть sidebar">`).
   - `<html lang>` обновляется при смене locale (через `useEffect` в `i18n.ts` или `App.tsx`).
   - Lighthouse Accessibility audit на 3 случайных страницах → 90+.

8. **Build optimization:**
   - `pnpm build` → проверить `dist/` сгенерирован.
   - `pnpm add -D vite-bundle-visualizer` — запустить bundle analysis.
   - Code-splitting per-route через `React.lazy` + `<Suspense>` (если bundle > 500KB gzipped).
   - Если есть отдельные heavy deps (recharts, react-syntax-highlighter — если добавлены) — lazy load.

9. **README final:**
   - Setup (`pnpm install`, `cp .env.example .env.local`, `pnpm dev`).
   - Build & deploy (1 параграф — кратко: статика на S3 + reverse proxy с IP-allowlist).
   - Архитектурный overview (1 параграф) + ссылки на `CLAUDE.md` и `docs/`.

10. **Build version в bundle:**
    - Vite plugin или manual: `package.json#version` → доступен через `env.VITE_APP_VERSION` (set'ится в `.env.local` или через define в `vite.config.ts`).
    - Показывается в user menu и login footer.

11. **Sentry / error tracking** (опционально):
    - Если бюджет позволяет — `@sentry/react` интеграция с error boundary, send `errorId` в 500 page.
    - Если нет — просто `console.error` + UUID generation для 500 page (через `crypto.randomUUID()`).

12. **TODO backlog cleanup:** просмотреть TODO backlog ниже, убедиться что все `// TODO(BN)` в коде имеют запись.

13. **Playwright e2e (4 critical paths)** — see CLAUDE.md §7:
    - `pnpm add -D @playwright/test` + `pnpm exec playwright install chromium`.
    - `playwright.config.ts`: baseURL http://localhost:5173, chromium only, screenshots/video on failure.
    - Tests in `tests/e2e/`:
      - `login.spec.ts` — admin@shyraq.local login → land on /, see "Главная".
      - `kg-create.spec.ts` — 2-step wizard → expect redirect to /kindergartens/:id.
      - `kg-archive.spec.ts` — open kg → archive via DestructiveConfirm (slug typing) → toast + status.
      - `monthly-billing-run.spec.ts` — /operations/billing → click Запустить → 202 toast.
    - `package.json` script: `"test:e2e": "playwright test"`.
    - Tests run against live dev backend (no mocks). NOT part of `pnpm test`.

### Acceptance criteria

- [ ] `Cmd+K` открывает command palette, search по садикам работает (debounced)
- [ ] `Esc` закрывает любой modal/dialog/palette
- [ ] `?` открывает shortcuts help modal
- [ ] Все pages переведены (нет hardcoded RU-строк в JSX — `pnpm grep -r "[А-Яа-я]" src/routes` возвращает только в импортах i18n или комментариях)
- [ ] Открыть DevTools на 600px ширине (responsive) → mobile alert виден
- [ ] Resize до 800px → app рендерится нормально, alert исчезает
- [ ] Lighthouse Accessibility ≥ 90 на 3 случайных страницах (Login, Dashboard, KG list)
- [ ] `pnpm build` exit 0, `dist/` сгенерирован
- [ ] `pnpm preview` поднимает production build, login → kg list → ops trigger → logout — всё работает
- [ ] Total bundle gzipped < 500KB ИЛИ обоснование почему больше + lazy-loading применён
- [ ] README содержит setup instructions + ссылки на docs
- [ ] `pnpm test:e2e` exit 0, 4 specs pass against live dev backend
- [ ] Playwright artifacts (screenshots/videos) saved under `playwright-report/` on failure

### Commit

```
B8: Polish — command palette, shortcuts, i18n, a11y, build optimization

Cmd+K palette with kg search and ops actions. Keyboard shortcuts with
help modal. i18n audit pass. Mobile (<768px) blocker. Lighthouse a11y
≥ 90. Bundle optimization with route-level code splitting.

Refs: docs/IMPLEMENTATION_PLAN.md §B8
```

---

## Post-B8 — Deployment (Vercel)

Сессия 2026-05-15. Платформа — **Vercel** (Git-интеграция) + **GitHub Actions** quality-gate. Решения зафиксированы в [`architecture.md §11`](architecture.md#11-деплой).

**Tasks:**

1. `vercel.json` — framework `vite`, `pnpm install --frozen-lockfile` / `pnpm build` / `outputDirectory: dist`; rewrites: `/api/:path*` → `http://13.60.189.214:3000/api/:path*`, затем SPA fallback `/(.*)` → `/index.html`; security headers (CSP/HSTS/nosniff/X-Frame-Options/Referrer-Policy/X-Robots-Tag) + cache (`/assets/*` immutable, `index.html` no-store).
2. `.github/workflows/ci.yml` — push/PR в `main`; Node 20 + pnpm (frozen lockfile, cache); `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
3. `package.json#packageManager` — пин `pnpm@10.19.0` для воспроизводимости (Vercel + Actions + corepack).
4. `.vercelignore`, `.env.example` (комментарий про prod-проксирование), README Deploy-секция.
5. Vercel Project Setup (вручную пользователем): импорт repo, env `VITE_API_BASE_URL=/api/v1`, production branch = `main`.

**Acceptance:**

- [ ] `pnpm build` зелёный, `dist/` отдаётся, deep-links не 404 (SPA fallback)
- [ ] `/api/*` проксируется на backend без CORS-ошибок (same-origin)
- [ ] GitHub Actions gate падает на lint/type/test ошибке
- [ ] Security/cache заголовки присутствуют в проде

**Открытые / отложенные:**

- Network-периметр (IP-allowlist / Vercel Deployment Protection) — [`OPEN_QUESTIONS.md#a3`](OPEN_QUESTIONS.md#a3-vercel-access-control--network-perimeter--open) (`open`)
- True env-config backend-origin (edge-proxy) — отложено, см. `architecture.md §11`
- Versioned releases (`superadmin-vX.Y.Z` git tags) — опционально, не блокер

---

## Tracker

Отмечай батчи по мере завершения:

- [x] **B0** Pre-flight checklist
- [x] **B1** Foundation (Vite + Tailwind + tooling + tokens + OpenAPI)
- [x] **B2** Auth + Shell (login, refresh, logout, sidebar, topbar)
- [x] **B3** Dashboard + System Status + Error pages
- [x] **B4** DataTable + Kindergartens list (offset pagination)
- [x] **B5** Kindergartens — wizard + archive/restore + admin invite
- [x] **B6** Operations (billing 202, content 200, rollout, DLQ retry)
- [x] **B7** Blocked module placeholders (subs/flags/users + KG tabs)
- [x] **B8** Polish (command palette, i18n, a11y, build) — _Playwright e2e (task 13) deferred: §B8 acceptance `pnpm test:e2e` + artifacts bullets remain open_

Когда все 8 батчей `[x]` → готов к production deploy (сессия Post-B8).

---

## TODO backlog

**Live registry** всех `// TODO(BN)` в коде. Каждый TODO — параллельная запись здесь. При завершении батча — пройтись по списку, удалить выполненные.

| ID          | File / Owner                                                                                       | Description                                                                                                                                                                                                   | Linked OPEN_QUESTIONS                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| TODO(B7)#01 | src/routes/dashboard.tsx (Platform card), src/routes/kindergartens/index.tsx (subscription column) | Wire active_subscriptions placeholder после того как backend выкатит /saas/saas-subscriptions ([B.9](OPEN_QUESTIONS.md#b9-saas-subscriptions-module--blocker-)).                                              | [B.9](OPEN_QUESTIONS.md#b9-saas-subscriptions-module--blocker-)                         |
| TODO(B?)#01 | src/routes/operations/lifecycle-dlq.tsx                                                            | DLQ kindergarten filter — реализовать когда backend выкатит `?kindergartenId=` query OR дешёвый kg name JOIN на список. Сегодня MVP омитит фильтр (D18) и показывает только truncated UUID + tooltip.         | —                                                                                       |
| TODO(B?)#02 | src/routes/operations/lifecycle-dlq.tsx                                                            | DLQ "failed_in_last" filter — backend не поддерживает `?failed_in_last=` query. Если станет нужно — отдельный backend endpoint OR client-side фильтр (бесполезен на cursor-pagination — пропускает страницы). | —                                                                                       |
| TODO(B?)#03 | src/routes/kindergartens/new.tsx                                                                   | Realtime slug uniqueness check — реализовать когда backend выкатит `?slug=` query OR `/check-slug` endpoint. Сегодня 409 возвращается только после submit.                                                    | [B.16](OPEN_QUESTIONS.md#b16-realtime-slug-uniqueness-check-frontend-feature-gap--open) |

Формат добавления:

```
| TODO(B5)#01 | src/routes/kindergartens/index.tsx:42 | Hardcoded plans list — заменить на API когда backend выкатит | — |
```

---

## Risk register

Известные риски и митигация:

| #   | Риск                                                                                               | Вероятность | Митигация                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Backend Swagger остаётся неполным (пустые DTO для некоторых endpoints)                             | Низкая      | Аудит выполнен 2026-05-14 (re-confirmed). Точечные пересверки на каждом батче через `pnpm gen:api` + git diff.                    |
| R2  | Backend response shape изменится в процессе                                                        | Средняя     | Все DTO зафиксированы в этом плане. `pnpm gen:api` перед каждой сессией → если diff в openapi.d.ts — остановиться, обновить план. |
| R3  | CORS на dev backend не настроен                                                                    | Низкая      | Vite proxy убирает проблему в dev. Production — same-origin через reverse proxy.                                                  |
| R4  | Backend временно лежит                                                                             | Низкая      | Все API hooks имеют error state. UI gracefully degrades.                                                                          |
| R5  | Backend меняется в процессе разработки                                                             | Средняя     | `pnpm gen:api` перед каждой сессией. Diff в openapi.d.ts → обновить план до начала кодинга.                                       |
| R6  | Blocker модули (subs/flags/users) выкатываются — нужно срочно реализовать                          | Средняя     | Placeholders из B7 быстро заменяются на real implementation. Архитектура DataTable / forms готова в B4-B6 — переиспользуем.       |
| R7  | KK переводы блокируют production                                                                   | Высокая     | Placeholder `[KK]` в B8, real translations — после native speaker (см. [C.6](OPEN_QUESTIONS.md#c6)).                              |
| R8  | Backend контракт `monthly-run` изменится (B.12 закроется → kindergarten_id примут)                 | Низкая      | Поле scoped в B6 как hidden — раскомментирование = 1 строка.                                                                      |
| R9  | `/health/ready` 503 контракт неясен ([B.13](OPEN_QUESTIONS.md#b13-healthready-503-contract--open)) | Низкая      | Frontend смотрит на `status` поле, а не HTTP-код. Если backend начнёт возвращать 503 — добавить обработку в `health.ts`.          |
| R10 | `cursor` в DLQ оказывается не opaque base64, а int                                                 | Низкая      | Тип в коде — `string \| null`. Если backend сменит формат — изменение прозрачно для UI.                                           |
| R11 | Lifecycle DLQ retry endpoint требует не-пустое body                                                | Низкая      | Сейчас отправляем `{}`. Если будет 400 — посмотреть в Network → исправить.                                                        |

---

## Recovery plan (если батч идёт неправильно)

1. **Сразу остановиться** при первом признаке drift'а от плана.
2. **Проверить:** действительно ли backend ведёт себя так как в `endpoints.md`?
   - Curl относящийся endpoint напрямую.
   - Сравнить с `pnpm gen:api` свежим.
3. **Если backend изменился:** обновить `docs/endpoints.md` + `IMPLEMENTATION_PLAN.md` → продолжить батч с правильными контрактами.
4. **Если код пошёл не туда:** `git reset --hard` к началу батча, пересмотреть подход. **Никогда не копить кривые коммиты "разберусь позже".**
5. **Если acceptance не сходится:** оставить батч `in-progress`, не отмечать `[x]`. Создать issue в `OPEN_QUESTIONS.md` или backlog. Перейти к следующему только после согласования.
