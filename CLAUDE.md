# CLAUDE.md — Shyraq SuperAdmin Frontend

Onboarding for any Claude Code session in this repo. **Read top to bottom before editing anything.**

---

## 1. Project

**Shyraq SuperAdmin** — внутренний веб-инструмент команды Shyraq для управления SaaS-платформой детских садов: тенанты, подписки, фичефлаги, операторские триггеры (cron'ы), DLQ.

**Не путать:**

- **Admin Web** (отдельный проект) — для сотрудников ОДНОГО садика (`role=admin`)
- **Parent App / Staff App** — мобильные приложения (Expo)
- **SuperAdmin** (этот репо) — для команды Shyraq (`role=super_admin` / `support`)

Audience: 5–20 internal users. За VPN/IP-allowlist. Desktop-first (≥768px), light theme only на MVP.

---

## 2. Sources of truth

**Read THESE before guessing.** Никогда не выдумывать endpoint'ы, поля DTO или бизнес-логику.

| Аспект                                                               | Файл                                                                                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Архитектура фронта (стек, folder structure, deployment, conventions) | [`docs/architecture.md`](docs/architecture.md)                                                                         |
| Endpoints (полный референс backend API для super-admin)              | [`docs/endpoints.md`](docs/endpoints.md)                                                                               |
| Бизнес-процессы super-admin                                          | [`docs/superadmin_BP.md`](docs/superadmin_BP.md)                                                                       |
| Дизайн-спека (страницы, контент, функционал)                         | [`docs/DESIGN.md`](docs/DESIGN.md)                                                                                     |
| Открытые вопросы (что НЕ делать без решения)                         | [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md)                                                                     |
| Implementation tracker (батчи, acceptance, открытые TODO)            | [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)                                                           |
| Дизайн-handoff (HTML/CSS/JS прототип всех экранов)                   | [`docs/design/handoff/shyraq-superadmin/`](docs/design/handoff/shyraq-superadmin/)                                     |
| Design tokens (palette, typography, radii, shadows)                  | [`docs/design/handoff/shyraq-superadmin/project/tokens.css`](docs/design/handoff/shyraq-superadmin/project/tokens.css) |
| Backend OpenAPI (live JSON)                                          | `http://13.60.189.214:3000/docs-json`                                                                                  |
| Backend Swagger UI (live)                                            | `http://13.60.189.214:3000/docs`                                                                                       |

**Backend code reference** (читать ТОЛЬКО при критических неопределённостях):

| Аспект              | Файл                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Backend архитектура | [`../backend_shyraq_v2/docs/architecture.md`](../backend_shyraq_v2/docs/architecture.md) |
| Backend endpoints   | [`../backend_shyraq_v2/docs/endpoints.md`](../backend_shyraq_v2/docs/endpoints.md)       |
| Backend BP          | [`../backend_shyraq_v2/docs/Shyraq BP.md`](../backend_shyraq_v2/docs/Shyraq%20BP.md)     |
| Backend DB schema   | [`../backend_shyraq_v2/docs/schema.dbml`](../backend_shyraq_v2/docs/schema.dbml)         |
| Backend module code | `../backend_shyraq_v2/src/modules/<x>/`                                                  |

**Правило:** локальные docs в `docs/` — первичны. Backend repo читать только если в наших docs нет ответа ИЛИ есть подозрение на расхождение со spec'ом. После расхождения — обновить наши docs.

**Документы первичны, код вторичен (first-document approach).** Никогда не реализуем фичу до того, как в docs зафиксировано однозначное решение. Порядок изменений в любом не-тривиальном изменении:

1. Обновить **`docs/DESIGN.md`** / **`docs/endpoints.md`** / **`docs/OPEN_QUESTIONS.md`** — решить архитектуру, контракты, edge-cases, открытые вопросы.
2. Обновить **`docs/IMPLEMENTATION_PLAN.md`** — добавить task/acceptance в нужный батч.
3. **Код** — субагенты (или main agent в обычном режиме) реализуют строго по обновлённым docs.

Если в процессе разработки обнаружено противоречие docs ↔ код или внутри самих docs — **остановить батч**, добавить запись в `OPEN_QUESTIONS.md`, обсудить с пользователем, обновить docs, **потом** продолжить. "Закодим как удобнее, потом обновим docs" — антипаттерн.

---

## 3. Backend integration

**Dev server:** `http://13.60.189.214:3000`

| Что                               | URL                                   |
| --------------------------------- | ------------------------------------- |
| API base (все endpoints)          | `http://13.60.189.214:3000/api/v1/`   |
| Swagger UI                        | `http://13.60.189.214:3000/docs`      |
| OpenAPI JSON (для `pnpm gen:api`) | `http://13.60.189.214:3000/docs-json` |

**Полный путь endpoint'а** — `/api/v1/<route>`. Например, super-admin login: `POST http://13.60.189.214:3000/api/v1/saas/auth/login`. Префикс `/api/v1/` глобальный для **всех** endpoints. Swagger UI/JSON — на корне домена, **не** под `/api/v1/`.

**SuperAdmin seed creds:** `admin@shyraq.local` / `CHANGE_ME_ADMIN_PASSWORD` (см. `SUPER_ADMIN_SEED_*` env на сервере — может быть переопределён).

**CORS:** в dev используем **Vite dev proxy** (`vite.config.ts`) — `/api/*` тоннелится на `http://13.60.189.214:3000`. Это убирает CORS-проблемы и позволяет писать `fetch('/api/v1/...')` без конфигурации origin'а.

**OpenAPI types:** генерируются командой `pnpm gen:api` из live Swagger JSON. Артефакт `src/api/types/openapi.d.ts` коммитим (чтобы CI без backend connection мог собрать фронт).

**Когда backend меняется:** дёрнуть `pnpm gen:api` локально + проверить, что `pnpm typecheck` не падает. Если падает — обновить hooks/components.

---

## 4. Layer rules (lint-checked + code-review)

Структура папок и обоснование — [`docs/architecture.md §3`](docs/architecture.md#3-структура-проекта).

| Слой                                                        | Что разрешено                                             | Что запрещено                                              |
| ----------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `api/`                                                      | `ky`, openapi-types, чистые async-функции                 | TanStack Query hooks, React, JSX, i18n                     |
| `hooks/`                                                    | TanStack Query, вызовы `api/*`, query keys                | прямой `fetch`, JSX                                        |
| `routes/`                                                   | React, JSX, `hooks/*`, `components/*`, `react-router-dom` | прямой `fetch`, прямой импорт `api/*` (только через hooks) |
| `components/ui/`                                            | shadcn primitives                                         | бизнес-логика, прямой backend-доступ                       |
| `components/{layout,data-table,forms,feedback,operations}/` | UI + переиспользуемые wrappers                            | бизнес-логика домена (это в routes)                        |
| `lib/`                                                      | чистые функции, без React                                 | TanStack Query, JSX                                        |
| `stores/`                                                   | Zustand UI state                                          | сервер-state (он в TanStack Query)                         |

Нарушения — `eslint-plugin-import/no-restricted-paths` + code-review.

---

## 5. Coding rules

### 5.1 DRY — не повторяться

- Если один и тот же UI-паттерн используется в 2+ местах → **вынести в компонент** в `components/`.
- Если одна и та же логика валидации/формата → **вынести в `lib/`** или `forms/`.
- Если один и тот же query/mutation вызывается в 2+ местах → **обернуть в hook** в `hooks/`.
- Не дублировать строки UI — все через `t('namespace.key')` в i18next.

### 5.2 Нет хардкоду

| Хардкод запрещён                           | Где жить должно                                            |
| ------------------------------------------ | ---------------------------------------------------------- |
| `'http://13.60.189.214:3000'` в коде       | `import.meta.env.VITE_API_BASE_URL` через `env.ts`         |
| Магические числа (TTL, лимиты, offsets)    | Константы в `lib/constants.ts` или TS-enum                 |
| Цвета `#fafaf9`                            | CSS variables через Tailwind theme                         |
| Пиксели `padding: 28` без причины          | Tailwind spacing utilities                                 |
| Backend error codes как строки в UI        | Через `lib/error-map.ts` → i18n                            |
| URL-пути `/saas/kindergartens/${id}` в JSX | `routes.kindergartens.detail(id)` helper в `lib/routes.ts` |

**Допустимый хардкод:** константы спецификаций, которые не меняются (E.164 regex, ISO 8601 формат). Это OK.

### 5.3 Naming

- **Файлы:** `kebab-case.ts` / `kebab-case.tsx`
- **React компоненты:** `PascalCase`
- **Хуки:** `useCamelCase`
- **API функции:** `camelCase` глагол: `listKindergartens`, `createKindergarten`, `getKindergarten`
- **Query keys:** массив с string-prefix: `['kindergartens', 'list', filters]`
- **Zod schemas:** suffix `Schema`: `LoginSchema`
- **Type aliases:** suffix `Type` запрещён — type inference достаточно. Используй имя как есть: `Kindergarten`, не `KindergartenType`.

### 5.4 React patterns

- **Components:** function components only. No class components.
- **Files:** один экспортируемый компонент на файл (плюс private sub-components в том же файле — OK).
- **State:** start с local `useState`. Поднимать вверх по дереву только при шаринге. Глобальный store (Zustand) только если 3+ компонента используют.
- **Effects:** избегать `useEffect` где возможно. Server data — через TanStack Query. Sync с external systems (URL params, localStorage) — OK.
- **Memoization:** не префьюм `useMemo`/`useCallback` без бенчмарка. React 19 быстрый.

### 5.5 Forms

- **Always** через React Hook Form + Zod.
- **Schema** в том же файле, что и компонент, ИЛИ в `routes/<feature>/schemas.ts` если переиспользуется.
- **Server validation errors** (422) → `setError('field', { message })` через mapping helper.
- **Default values** — обязательно (избегать "uncontrolled to controlled" warning).

### 5.6 Error handling

- **Backend errors** → `AppError(code, status, details)` парсится в `api/client.ts`.
- В UI — ловим через `useMutation({ onError })` или `useQuery({ throwOnError: false })`.
- Показываем через `toast.error(t(`errors.${err.code}`))` — НЕ `err.message`.
- Если код неизвестен → fallback `t('errors.unknown_error')` + console.error для дебага.
- Никогда не показывать stack trace пользователю.

### 5.7 Comments and TODOs

- **Default: no comments.** Хорошие имена покрывают 95% случаев.
- Комментарий в коде только когда:
  - WHY не очевиден (workaround для бага, неинтуитивная инверсия)
  - Скрытое требование (RLS, advisory-lock, race-condition)
  - Внешний контракт (формат токена, OFD-API peculiarity)
- Не писать комментарии про WHAT (`// fetch users` над `useUsers()`).

**TODOs и памятки на будущее — разрешены и ожидаемы.** Правила:

- Каждый `// TODO` в коде должен иметь parallel-запись в [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) → раздел "TODO backlog" с тем же текстом, ссылкой на файл/строку, и owner'ом (по умолчанию — current batch).
- Формат: `// TODO(B5): wire to /admin/* when backend supports super-admin scope (see OPEN_QUESTIONS#b3)`.
- При завершении батча — пройтись по TODO'шкам, удалить выполненные, открытые синкнуть в `IMPLEMENTATION_PLAN.md`.
- TODO без backlog-записи в `IMPLEMENTATION_PLAN.md` будет удалён в code-review.

---

## 6. Style and tokens

**Источник палитры/типографики:** [`docs/design/handoff/shyraq-superadmin/project/tokens.css`](docs/design/handoff/shyraq-superadmin/project/tokens.css).

**Перенос в наш Tailwind:**

- Все `--bg-*`, `--text-*`, `--border-*`, `--brand*`, semantic (`--success/warning/error/info`), role colors, radii, shadows — копируем в `src/styles/globals.css`.
- Tailwind theme extend читает CSS variables: `colors: { brand: 'var(--brand)' }`.
- Никаких inline `style={{...}}` в коде, кроме случаев когда Tailwind не покрывает (сложные dynamic transforms, animations).

**Типография:** Geist (sans + mono) через Google Fonts. Lic: OFL/MIT. Подключаем в `index.html`.

**Иконки:** не копируем `Icon.*` из handoff — используем **Lucide React** (`<Home/>`, `<Building2/>`, `<Activity/>`). Mapping handoff icon → Lucide делаем в `components/ui/icon.ts`.

---

## 7. Testing

**Минимальный gate перед merge:**

- `pnpm typecheck` — exit 0
- `pnpm lint` — exit 0
- `pnpm test` — все unit suites green

**Unit tests (Vitest):**

- Чистые функции в `lib/` — обязательно (`format.ts`, `error-map.ts`, `jsonb-i18n.ts`).
- Сложные хуки (например, `use-debounce`) — да.
- Простые компоненты с render — нет (e2e покрывает).

**E2E (Playwright) — только critical paths:**

1. Login + logout
2. Создание садика (atomic bootstrap)
3. Деактивация садика (destructive confirm)
4. Trigger monthly billing run

E2E пишем в Batch 8 (Polish). Не блокируют разработку.

---

## 8. Adding a new screen (template)

1. **Update docs first:** Если меняется scope — править `docs/DESIGN.md` + `docs/endpoints.md` (если новый endpoint).
2. **API function:** `src/api/<entity>.ts` — async function с типами из openapi.
3. **Hook:** `src/hooks/use-<entity>.ts` — `useQuery` / `useMutation` с query key из `query-keys.ts`.
4. **Schema** (если форма): Zod schema в файле компонента или `schemas.ts`.
5. **Component:** `src/routes/<path>/<name>.tsx` — JSX с использованием hook + shadcn UI.
6. **i18n keys:** добавить в `src/locales/ru/<namespace>.json` + `kk/<namespace>.json` (хотя бы placeholder для KK).
7. **Route registration:** `src/main.tsx` (или `src/router.tsx`) — добавить в дерево.
8. **Visual reference:** найти соответствующий `Screen*` в `docs/design/handoff/.../project/screens-*.jsx`.

---

## 9. Do not

- Не создавать файлы вне folder structure из [`docs/architecture.md §3`](docs/architecture.md#3-структура-проекта) без подтверждения.
- Не делать прямой `fetch` или `axios` мимо `api/client.ts`.
- Не хранить access token в localStorage / sessionStorage / cookie. Только in-memory (`lib/token-storage.ts`).
- Не использовать `any` без подтверждения. Если type generation не покрывает поле — генерить типы или использовать `unknown` + Zod parse.
- Не игнорировать backend error codes — всегда мапим через `error-map.ts`.
- Не показывать сырой `err.message` пользователю. Только через i18n.
- Не дублировать UI strings в коде. Только через `t()`.
- Не запускать `pnpm gen:api` против production backend. Только dev-server.
- Не комитить `.env*` файлы (только `.env.example`).
- Не амендить опубликованные коммиты / force-push в `main` без явной просьбы.
- Не пропускать husky pre-commit (`--no-verify`) без явной просьбы.
- Не реализовывать фичи из [`OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) до их `resolved` статуса.
- Не оставлять `// TODO` без parallel-записи в `IMPLEMENTATION_PLAN.md` (см. §6.7).

---

## 10. Pointers

- [`docs/architecture.md`](docs/architecture.md) — стек, folder structure, deployment
- [`docs/endpoints.md`](docs/endpoints.md) — backend endpoint reference
- [`docs/superadmin_BP.md`](docs/superadmin_BP.md) — бизнес-процессы
- [`docs/DESIGN.md`](docs/DESIGN.md) — UI спека (per-page)
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — что НЕ делать
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — батчи + acceptance + TODO backlog
- [`docs/design/handoff/shyraq-superadmin/`](docs/design/handoff/shyraq-superadmin/) — visual reference
- `../backend_shyraq_v2/` — backend repo (read-only reference)

---

## 11. Sub-agentic workflow of batches

**Когда активируется:** **ТОЛЬКО** по явному триггеру от пользователя. Фразы вроде "работай в субагентном воркфлоу", "оркестрируй батч", "сделай B5 через субагентов", "делегируй субагентам", "subagent workflow", "subagent mode" — включают этот режим. Без триггера — работаешь обычным режимом (сам пишешь код). Никогда не переключайся самостоятельно.

**Зачем:** разгрузить контекст оркестратора и распараллелить тактическую работу по батчу из [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md). Главный агент держит план + acceptance в голове, не тратит токены на чтение/правку исходников. Тактика отдаётся субагентам через `Agent` tool.

### 11.1 Роли

**Главный агент (orchestrator) — НЕ исполнитель.** В этом режиме **запрещено**:

- Открывать/править/писать код руками в `src/` (Read/Edit/Write на исходниках текущего батча).
- Грепать по `src/` чтобы понять "как сделано" — это работа субагента.
- Запускать `pnpm dev`/`typecheck`/`lint`/`test` руками **до** финальной верификации (§11.6) — это делают субагенты в своих слайсах.

**Разрешено / обязательно:**

- Читать `CLAUDE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DESIGN.md`, `docs/endpoints.md`, `docs/OPEN_QUESTIONS.md` — чтобы понять scope батча и контекст.
- Декомпозировать батч на независимые/последовательные слайсы (§11.3).
- Запускать субагентов через `Agent` tool и собирать их репорты.
- **Финальная верификация** (после всех субагентов): один прогон `pnpm typecheck && pnpm lint && pnpm test` + ручная проверка golden path по acceptance criteria. Это единственный момент, когда оркестратор сам касается репозитория.
- Финальный коммит по шаблону `B<N>: <title>` из [`IMPLEMENTATION_PLAN.md §0`](docs/IMPLEMENTATION_PLAN.md#0-working-agreement-правила-игры) — **только после** того как все acceptance items зелёные.

**Субагент (executor) — самодостаточный исполнитель.**

- Получает self-contained бриф (см. §11.4), потому что переписку оркестратора с пользователем не видит.
- Делает свой слайс — создаёт/правит только указанные файлы.
- **Сам убеждается, что код работает** до того как репортит "done": `pnpm typecheck` + `pnpm lint` (на тронутых файлах минимум), `pnpm test` если добавлял тесты, ручной запуск `pnpm dev` + browser-проверка golden path если трогал UI.
- Сам фиксит свои lint/type/test ошибки. "Закончил, но typecheck падает" — недопустимо.
- Не выходит за границы слайса (не правит чужие файлы, не делает "заодно refactor").
- Возвращает короткий отчёт (≤200 слов): что сделал, какие acceptance items закрыл, любые blocker'ы.

### 11.2 Выбор модели субагента

Оркестратор сам выбирает модель по сложности слайса. **Главный агент всегда остаётся на Opus 4.7** — это уровень оркестратора. Субагентам Opus 4.7 **не отдаём** (это перерасход; решает чуть лучше, но стоит дороже и медленнее).

| Сложность слайса                                                                                         | Модель субагента          | Когда применять                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Высокая** — multi-file, новая абстракция, нужна архитектурная мысль, есть "решить как лучше"           | **`claude-opus-4-6[1m]`** | Generic `<DataTable>` + sub-components; `<DestructiveConfirm>` + integration; refresh-flow с single-flight mutex; 2-step wizard kindergarten/new с правильной error/redirect логикой; новая reusable инфраструктура forms                                      |
| **Низкая** — точечная правка, strict execution по подробному брифу, изолированный модуль, чистые функции | **`claude-sonnet-4-6`**   | Чистые функции в `lib/` (`formatPhoneE164`, `slugify`) + Vitest tests; добавить колонку в существующий DataTable; перевод i18n-namespace; добавить shadcn компонент через CLI + минимальная wrapper-настройка; зарегистрировать роут с placeholder-компонентом |

**Правило отбраковки:** если бриф содержит фразу "реши как лучше / выбери паттерн / спроектируй" — это **Opus 4.6**. Sonnet 4.6 — только когда бриф настолько детальный, что от субагента требуется буквально "сделай ровно вот это".

**Готовые проектные субагенты** в [`.claude/agents/`](.claude/agents/) — используй через параметр `subagent_type` в `Agent` tool (имя без `.md`):

| `subagent_type`   | Model                                 | Назначение                                                                                                                                        | Tools                                                  |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `coder-opus`      | `claude-opus-4-6[1m]`                 | Архитектурные/multi-file/design-decisions слайсы. DataTable generic, wizard, refresh-flow, новая инфраструктура                                   | Read/Edit/Write/Glob/Grep/Bash + Notebook + ToolSearch |
| `coder-sonnet`    | `claude-sonnet-4-6`                   | Strict-execution/tactical слайсы. Pure функции в `lib/` + тесты, добавить колонку, i18n-namespace, deps install, placeholder route                | Read/Edit/Write/Glob/Grep/Bash + Notebook + ToolSearch |
| `reviewer-opus`   | `claude-opus-4-6[1m]`                 | Глубокий review после coder'а или перед коммитом нетривиального изменения. Layer rules + spec drift + security + acceptance                       | Read/Glob/Grep/Bash (READ-ONLY)                        |
| `reviewer-sonnet` | `claude-sonnet-4-6`                   | Лёгкий review для tactical слайсов. Эскалирует на `reviewer-opus` если упёрся в архитектурный вопрос                                              | Read/Glob/Grep/Bash (READ-ONLY)                        |
| `reviewer-codex`  | Codex CLI (отдельная модельная семья) | **Second-opinion** review через локальный `codex review` CLI. Запускай когда хочешь независимую точку зрения / sanity check после `reviewer-opus` | Bash + Read/Glob/Grep (READ-ONLY)                      |

**Использование** (пример):

```
Agent({
  subagent_type: "coder-opus",
  description: "B4 generic DataTable + sub-components",
  prompt: "<self-contained brief per §11.4>"
})
```

**Главный агент всегда остаётся на Opus 4.7** — это уровень оркестратора. Субагентам Opus 4.7 **не отдаём** (перерасход; решает чуть лучше, но дороже/медленнее). Если по какой-то причине проектных агентов в `.claude/agents/` нет (новый клон репо без них), а пользователь просит субагентный режим — сначала переустанови агентов из этой таблицы (или попроси пользователя), затем работай. Не запускай family-level `opus`/`sonnet` без агент-файла — рискуешь поднять 4.7.

**Codex second-opinion** (`reviewer-codex`): использует локальный `codex` CLI (`codex review --base main "<prompt>"` или `--uncommitted` / `--commit <sha>`). Codex — отдельная модельная семья (не Claude), потому его review — реально независимая точка зрения, не самореферентная. Не запускает `codex apply` и не пишет код — только relay findings. Если на машине пользователя `codex` не установлен — субагент сообщит об этом, ставить надо вручную.

### 11.3 Декомпозиция батча

Перед первым `Agent` вызовом:

1. Прочитай секцию `IMPLEMENTATION_PLAN.md §B<N>` — Tasks + Acceptance + Inputs.
2. Разбей Tasks на **слайсы** так, чтобы каждый слайс:
   - Имел чёткие вход/выход (какие файлы создаёт/правит).
   - Не зависел от ещё-не-сделанного слайса (или явно ставится после него).
   - Покрывался 1–3 acceptance criteria.
3. Реши параллель vs последовательно:
   - **Параллель** (один message с несколькими `Agent` блоками): слайсы трогают разные файлы и не делят state. Лимит — 3–4 одновременно, больше тяжело координировать.
   - **Последовательно**: слайс B читает артефакт слайса A (новые типы из `pnpm gen:api`, новый компонент, новый hook).

**Пример декомпозиции B4 (DataTable + KG list):**

- Слайс 1 (Sonnet 4.6, можно параллельно с 4): `pnpm add @tanstack/react-table` + shadcn install `table dropdown-menu badge skeleton alert select popover`. Чистая механика.
- Слайс 2 (Opus 4.6): generic `<DataTable<T>>` + sub-components (`toolbar`, `pagination`, `empty`, `loading`, `error`, `row-actions`). Архитектурный слайс — куча design decisions.
- Слайс 3 (Sonnet 4.6, после 1): `src/api/kindergartens.ts#listKindergartens` + `useKindergartens` hook + `useDebounce`. Строго по `endpoints.md §1.1`.
- Слайс 4 (Sonnet 4.6, параллельно с 1/2/3): `src/lib/format.ts` (`formatPhoneE164`, `formatRelativeTime`, `formatCurrency`) + Vitest unit-tests. Чистые функции, никаких зависимостей.
- Слайс 5 (Opus 4.6, после 2+3+4): `/kindergartens` route собирающий DataTable + hook + format. Композиция, error/empty/loading states, row actions.

### 11.4 Бриф для субагента

Субагент **не видит** твою переписку с пользователем и предыдущие сообщения сессии — пиши self-contained prompt. Минимум:

1. **Что делаем и зачем** (1–2 предложения). Без них субагент не поймёт edge-cases.
2. **Конкретные файлы** — paths которые создать/изменить + что в них должно появиться (тип, компонент, функция).
3. **Какие docs прочитать в первую очередь:**
   - `CLAUDE.md` (всегда, §4 Layer rules + §5 Coding rules).
   - `docs/IMPLEMENTATION_PLAN.md §B<N>` (целевая секция батча + Tasks для слайса).
   - `docs/DESIGN.md §<Y>` (если UI-слайс).
   - `docs/endpoints.md §<Z>` (если API-слайс).
   - `docs/OPEN_QUESTIONS.md` (если рядом есть blocker).
4. **Какие acceptance criteria покрыть** — цитируй буквально из IMPLEMENTATION_PLAN.md.
5. **Self-verification mandate** (включать в каждый бриф): "Перед reporting done запусти `pnpm typecheck` + `pnpm lint --max-warnings=0` + `pnpm test` (если добавил тесты) — все exit 0. UI-изменения — открой `pnpm dev`, пройди golden path в браузере, опиши что увидел. Не репортуй done пока всё зелёное."
6. **Лимит репорта**: "≤ 200 слов: список созданных/изменённых файлов, какие acceptance items закрыл, любые blocker'ы."
7. **`description` параметр Agent tool** — 3–5 слов, отражают именно слайс ("DataTable generic + sub-components", не "B4 work").

### 11.5 Failure handling

- **Lint/type/test fail у субагента** → субагент сам фиксит до отчёта. Не возвращает с красным.
- **Реальный blocker** (отсутствует endpoint, противоречие в docs, неясный design intent) → субагент записывает в `docs/OPEN_QUESTIONS.md` (новая запись со статусом `open` в правильной секции A/B/C) и возвращает "blocked: <reason>, see OPEN_QUESTIONS#<id>". Оркестратор решает — заморозить батч или продолжить без блокирующего куска.
- **Субагент сделал не то** → оркестратор **НЕ переделывает руками**. Перевыпускает того же или другого субагента с уточнённым брифом ("предыдущий слайс сделал X, но это не подходит, потому что Y; переделай Z"). Только в самом конце батча допустимы мелкие правки оркестратором (1–2 строки) если иначе теряется время на повторный полный run.
- **Субагент вылез за слайс** (тронул чужие файлы / refactor "заодно") → отдельный `Agent` чтобы откатить лишнее ИЛИ оркестратор обсуждает с пользователем перед merge.

### 11.6 Финальная верификация (только оркестратор, только в конце)

После того как все субагенты вернулись с "done":

1. `pnpm typecheck && pnpm lint && pnpm test` — все exit 0. Если красный — определи какой слайс виноват, перевыпусти субагента с fix-брифом.
2. `pnpm dev` + ручная проверка golden path в браузере по acceptance criteria батча. Для UI-фич — пройти основной сценарий (login → list → create → archive и т.п.). Если окружение не позволяет запустить браузер — явно скажи пользователю "browser-проверка не выполнена, требуется ручной QA".
3. Скомпилировать commit-сообщение по шаблону `B<N>: <title>` из [`IMPLEMENTATION_PLAN.md §0`](docs/IMPLEMENTATION_PLAN.md#0-working-agreement-правила-игры). `Acceptance:` — `[x]` только реально проверенные пункты (не "наверное работает").
4. Commit — только после явного "да, коммить" от пользователя (см. [§9 Do not](#9-do-not): не коммитим без просьбы).
5. Отметить `[x]` в Tracker секции `IMPLEMENTATION_PLAN.md`.

### 11.7 Что НЕ делать в субагентном воркфлоу

- **Оркестратор НЕ пишет код** в `src/` текущего батча. Исключение: §11.6 финальная верификация и крошечные fixup'ы (1–2 строки) если выпускать ещё одного субагента дороже.
- **Оркестратор НЕ читает `src/`** чтобы понять "как сделано". Достаточно репортов субагентов. Если репорт мутный — задай уточняющий вопрос субагенту через новый `Agent` вызов (или `SendMessage` если контекст ещё жив), не лезь в код сам.
- **Субагент НЕ выходит за границы слайса.** Не правит чужие файлы, не делает refactor "заодно", не "улучшает" соседний код.
- **Не запускай > 3–4 субагентов параллельно** без необходимости — координация становится дороже параллелизма.
- **Не используй субагентный воркфлоу без явного триггера от пользователя.** Обычный режим (сам пишешь код) — дефолтный. При сомнениях — спроси: "перейти в субагентный режим?"
- **Не отправляй субагенту Opus 4.7.** Это уровень оркестратора; для тактики достаточно Opus 4.6 / Sonnet 4.6.
