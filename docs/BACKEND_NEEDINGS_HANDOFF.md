# Backend Needings Handoff — Shyraq SuperAdmin Frontend

**Аудитория:** backend-команда `backend_shyraq_v2`.
**Цель:** один документ, описывающий что SuperAdmin frontend **ожидает** от backend'а — что уже потребляет (контракты, которые нельзя ломать), что заблокировано (фронт построен, но не функционален без backend'а), и какие доработки/новые модули нужны.

**Контекст:** SuperAdmin frontend полностью реализован (батчи B0–B8, см. [`IMPLEMENTATION_PLAN.md` Tracker](IMPLEMENTATION_PLAN.md#tracker)). Production-ready **кроме** фич, заблокированных отсутствующими backend-эндпойнтами. Несколько страниц задеплоены как placeholder'ы и ждут backend.

**Источники истины:** [`endpoints.md`](endpoints.md) (полный контракт-референс, сверен с live Swagger 2026-05-14), [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) (открытые вопросы по областям). Этот файл — производный, для backend-команды; при расхождении первичны `endpoints.md` / `OPEN_QUESTIONS.md`.

---

## 0. TL;DR — что нужно от backend'а, по приоритетам

| Приоритет | Что                                                                                 | Эффект для фронта                                                                                                                                                 | Ref           |
| --------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **P0**    | Fix RBAC: `GET/POST /admin/lifecycle/failed-jobs*` отдаёт **403** для `super_admin` | Построенная страница `/operations/lifecycle-dlq` нефункциональна (баг)                                                                                            | [B.17](#p0-1) |
| **P0**    | `GET /saas/kindergartens/{id}` + `PATCH /saas/kindergartens/{id}`                   | Detail + Settings садика — заглушки _(🟡 `/admins` доставлен 2026-05-18 → вкладка «Администраторы» разблокирована, front-батч B9; overview/settings остаются P0)_ | [B.8](#p0-2)  |
| **P0**    | Модуль `/saas/saas-subscriptions` (list/create/update)                              | Раздел "Подписки" — заглушка                                                                                                                                      | [B.9](#p0-3)  |
| **P0**    | Модуль `/saas/feature-flags` (list/upsert/delete)                                   | Раздел "Фичефлаги" — заглушка                                                                                                                                     | [B.10](#p0-4) |
| **P0**    | Модуль `/saas/users` (CRUD)                                                         | Раздел "Пользователи" — заглушка; новых SaaS-юзеров заводят SQL-seed'ом                                                                                           | [B.11](#p0-5) |
| **P1**    | Статус async-джоб биллинга (`GET /saas/billing/jobs/{job_id}` или аналог)           | Биллинг-триггеры не показывают прогресс/итог — только "поставлено в очередь"                                                                                      | [§4.1](#p1-1) |
| **P1**    | `monthly-run` принимает `kindergarten_id` без 400                                   | Поле single-kg скрыто на UI                                                                                                                                       | [B.12](#p1-2) |
| **P1**    | Slug-uniqueness probe (`?slug=` или `/check-slug`)                                  | 409 на slug всплывает только после submit                                                                                                                         | [B.16](#p1-3) |
| **P1**    | `GET /saas/metrics/overview` (cross-kg агрегаты)                                    | Dashboard KPI собираются костылём / отсутствуют                                                                                                                   | [B.6](#p1-4)  |
| **P1**    | `GET /saas/cron-jobs` (статус repeatable jobs)                                      | Нет видимости last_run/next_run/last_error                                                                                                                        | [B.7](#p1-5)  |
| **P1**    | DLQ filter query (`?kindergartenId=`) + kg-name JOIN                                | Фильтр по садику в DLQ омитнут, видно только UUID                                                                                                                 | [§4.6](#p1-6) |
| **P2**    | View-as / read-only impersonation к `/admin/*`                                      | Страница `/kindergartens/:id/view-as` — info-stub                                                                                                                 | [B.3](#p2-1)  |
| **P2**    | Audit log infra + `GET /saas/audit-logs`                                            | Нет "кто/когда/что менял"                                                                                                                                         | [B.4](#p2-2)  |
| **P2**    | Webhook audit (`GET /saas/payment-webhooks`)                                        | Нет troubleshooting платёжных webhook'ов                                                                                                                          | [B.5](#p2-3)  |
| **P2**    | WS / SSE system-events для super_admin                                              | Нет real-time по failed cron'ам / нагрузке                                                                                                                        | [A.2](#p2-4)  |
| **P2**    | httpOnly cookie auth-flow (опц., при compliance)                                    | Сейчас refresh в localStorage                                                                                                                                     | [A.1](#p2-5)  |

**Гейты от продукта/бизнеса** (без них часть backend-работы не имеет смысла начинать): [§7](#7-бизнес-решения-гейтящие-backend-работу) — SaaS-биллинг процесс (C.1), audit compliance (C.2), RBAC super_admin↔support (C.3), scope view-as (C.4), KPI dashboard (C.5).

---

## 1. Легенда приоритетов

- **P0 — блокер.** Фронт-страница построена и задеплоена, но **не работает** без backend'а (заглушка или баг). Максимальная отдача: код фронта готов, нужен только endpoint.
- **P1 — доработка.** Существующая фича работает, но UX неполноценен без backend-доработки.
- **P2 — новый модуль / инфраструктура.** Новая ценность, требует значимой backend-работы и/или продуктового решения.

---

## 2. Что уже работает — контракты, которые НЕЛЬЗЯ ломать

Эти эндпойнты frontend потребляет в проде. Изменение request/response shape сломает фронт без предупреждения. Полные контракты — [`endpoints.md`](endpoints.md). Сводка:

| Method | Path (`/api/v1` prefix)                   | Frontend usage                        | Контрактные тонкости                                                                                             |
| ------ | ----------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| POST   | `/saas/auth/login`                        | `/login`                              | resp `snake_case`; `roles[].kindergarten_id=null` для super_admin; поле `kindergartens[]` НЕ возвращать          |
| POST   | `/saas/auth/refresh`                      | silent refresh                        | req `{ refreshToken }` — **camelCase**, ровно 64 символа                                                         |
| POST   | `/saas/auth/logout`                       | logout                                | req `{ refreshToken }` — camelCase, **обязательное** даже в logout; resp 204                                     |
| GET    | `/saas/kindergartens`                     | `/kindergartens` list                 | **offset-based** (`limit`/`offset`/`total`); фильтры `plan,is_active,archived,name_search`                       |
| POST   | `/saas/kindergartens`                     | wizard create                         | atomic TX; required `name,slug,admin`; `admin.locale` enum `ru\|kk` (**не** `kz`); 409 `kindergarten_slug_taken` |
| POST   | `/saas/kindergartens/{id}/archive`        | archive dialog                        | идемпотентен; resp `KindergartenDto`                                                                             |
| POST   | `/saas/kindergartens/{id}/restore`        | restore dialog                        | идемпотентен; staff НЕ реактивируются                                                                            |
| POST   | `/saas/kindergartens/{id}/admin/invite`   | invite dialog                         | `{ phone }`; resp `{ sent: bool }` (false ⇒ warning, не error)                                                   |
| POST   | `/saas/billing/monthly-run`               | `/operations/billing`                 | **202** async; фронт НЕ шлёт `kindergarten_id` (см. B.12)                                                        |
| POST   | `/saas/billing/discount-expire-run`       | `/operations/billing`                 | **202** async; `{ now? }`                                                                                        |
| POST   | `/saas/billing/overdue-run`               | `/operations/billing`                 | **202** async; `{ now? }`                                                                                        |
| POST   | `/saas/content/birthday-run`              | `/operations/content`                 | **200** sync; resp counters `processed/skipped/kindergartens_processed`                                          |
| POST   | `/saas/content/story-cleanup-run`         | `/operations/content`                 | **200** sync                                                                                                     |
| POST   | `/saas/content/publish-scheduled-run`     | `/operations/content`                 | **200** sync                                                                                                     |
| POST   | `/admin/schedule/week-rollout/run`        | `/operations/schedule-rollout`        | sync (минуты); req/resp **camelCase** (`fromMonday`, `copiedGroups`…); 429 `too_many_requests`                   |
| GET    | `/admin/lifecycle/failed-jobs`            | `/operations/lifecycle-dlq`           | **opaque base64 `cursor`**; `next_cursor: string\|null`; ⚠️ см. [B.17](#p0-1)                                    |
| POST   | `/admin/lifecycle/failed-jobs/{id}/retry` | DLQ retry                             | пустое тело `{}`; resp `{ enqueued, job_id }`; ⚠️ см. [B.17](#p0-1)                                              |
| GET    | `/health`                                 | dashboard / footer / `/system-status` | resp `{ status, version, uptime_seconds, timestamp }`                                                            |
| GET    | `/health/ready`                           | dashboard polling 30s                 | всегда **200**; degraded через `body.status`, НЕ через HTTP-код (resolved, см. B.13)                             |

**Общие соглашения, на которые фронт закладывается:** errors `{ error, message, details? }`; timestamps ISO 8601; IDs UUID v4; локализованные поля JSONB `{ru,kz}` (внимание: `kz` в данных, `kk` в DTO-locale enum); деньги `decimal(12,2)` `KZT`; входящие поля snake_case **кроме** `refreshToken` и `fromMonday`. Заголовок `x-custom-lang` фронт всегда ставит `ru`/`kk` из i18n-локали (не `en`). Error codes маппятся в i18n — **не менять коды** без синка с фронтом (`src/locales/<lang>/errors.json`). Полный реестр кодов — [`endpoints.md §11`](endpoints.md#11-error-code-reference-cross-endpoint).

---

## 3. P0 — Блокеры (фронт построен, но не работает без backend'а)

### <a id="p0-1"></a>P0.1 — Fix RBAC: lifecycle DLQ отдаёт 403 для super_admin `[B.17]`

**Симптом (подтверждён в проде, seed-юзер `admin@shyraq.local`):**

```
GET /api/v1/admin/lifecycle/failed-jobs?limit=50
→ 403 {"message":"Forbidden resource","error":"Forbidden","statusCode":403}
```

**Природа:** это **баг**, не отсутствующая фича. Страница `/operations/lifecycle-dlq` полностью построена (DataTable, retry-кнопка, cursor-пагинация, error state) и задеплоена. Сейчас деградирует в error-state. `POST .../retry` вероятно отдаёт тот же 403.

**Вероятная причина:** routes под `/admin/*` заскоплены на kindergarten-`admin` роль; RBAC-слой не признаёт `super_admin` суперсетом. Lifecycle DLQ — platform-ops concern, требует cross-kg видимости → super_admin должен проходить.

**Что нужно от backend (одно из двух):**

1. Расширить RBAC-guard `/admin/lifecycle/*` чтобы пропускал `super_admin` (cross-kg, как описано в [`endpoints.md §8`](endpoints.md#8-lifecycle-dlq-cross-kg-view--adminlifecyclefailed-jobs)).
2. Перенести lifecycle-эндпойнты под `/saas/lifecycle/*` (super_admin scope). Тогда фронт обновит пути — нужен синк `endpoints.md §8`.

**Готовность фронта:** 100%. Как только super_admin проходит — страница оживает без изменений кода (вариант 1) или со сменой 2 путей (вариант 2).

---

### <a id="p0-2"></a>P0.2 — Kindergarten detail + settings endpoints `[B.8]`

> **🟡 Частично доставлено (2026-05-18).** Backend выкатил `GET / POST /saas/kindergartens/:id/admins` (ветка `superadmin/kg-admins`, merged + deployed) → разблокировал отдельную вкладку «Администраторы» (front-батч **B9**, `endpoints.md §1.7`). **Остаётся P0:** `GET /saas/kindergartens/{id}` (overview) + `PATCH` (settings) — по-прежнему отсутствуют. **Новые follow-up backend-asks** (не блокеры, открыть при продуктовой нужде): нет remove/demote админа; нет реактивации деактивированного админа (`OPEN_QUESTIONS.md#b8`).

**Отсутствует:** `GET /saas/kindergartens/{id}`, `PATCH /saas/kindergartens/{id}`.

**Что заблокировано:**

- `/kindergartens/:id` (tab "Обзор") — сейчас показываем только то, что прилетело в list-row.
- `/kindergartens/:id/settings` (tab "Настройки") — placeholder с info-alert "редактирование недоступно".
- Базовая overview садика для support-сценариев.

**Запрошенный контракт:**

- `GET /saas/kindergartens/{id}` → расширенный DTO: всё из `KindergartenDto` + (желательно) текущая подписка, агрегатная статистика (кол-во детей/групп/staff), `settings` JSONB развёрнуто. Минимум — тот же `KindergartenDto`, что в list.
- `PATCH /saas/kindergartens/{id}` → частичное обновление `settings` / `plan` / `is_active`. Структура `settings` JSONB — [`endpoints.md §1.6`](endpoints.md#16-kindergartenssettings--структура-jsonb).
- 404 `kindergarten_not_found`.

**Готовность фронта:** DataTable/forms-инфраструктура из B4–B6 переиспользуема. Detail-страница быстро собирается из готовых компонентов.

---

### <a id="p0-3"></a>P0.3 — SaaS Subscriptions module `[B.9]`

**Отсутствует:** весь модуль `/saas/saas-subscriptions`. Таблица `saas_subscriptions` в БД есть (`schema.dbml#L1335-1347`), REST-controller не написан.

**Что заблокировано:**

- `/subscriptions` — cross-kg список подписок.
- `/kindergartens/:id/subscription` — tab подписки в detail.
- Dashboard MRR-виджет.

**Запрошенный контракт (минимум):**

- `GET /saas/saas-subscriptions` — **offset-based** shape `{ items, total, limit, offset }` (консистентно с `/saas/kindergartens`, см. [B.1 resolved](OPEN_QUESTIONS.md#b1-унификация-list-response-shape--resolved-2026-05-14)). Фильтры по kg / статусу / `next_billing_at`.
- `POST /saas/saas-subscriptions` — создать подписку для садика.
- `PATCH /saas/saas-subscriptions/{id}` — изменить план/статус.

**Гейт:** продуктовое решение [C.1](#c1) (как Shyraq биллит садики) определяет поля DTO (`next_billing_at`, `billing_channel`, etc.). Желательно решить C.1 до финализации контракта.

---

### <a id="p0-4"></a>P0.4 — Feature Flags module `[B.10]`

**Отсутствует:** весь модуль `/saas/feature-flags`. Таблица `feature_flags` в БД есть, controller не написан.

**Что заблокировано:** `/feature-flags` (cross-kg список + create), `/kindergartens/:id/flags` (per-kg tab).

**Запрошенный контракт (минимум):**

- `GET /saas/feature-flags` — list, фильтр по `kindergarten_id` (nullable = глобальные).
- `POST /saas/feature-flags` — upsert по `(kindergarten_id, key)`. Поля: `key`, `value` (JSONB), `kindergarten_id` (nullable).
- `DELETE /saas/feature-flags/{id}`.

**Готовность фронта:** placeholder route; быстро заменяется на DataTable + create-modal по готовой инфраструктуре.

---

### <a id="p0-5"></a>P0.5 — SaaS Users module `[B.11]`

**Отсутствует:** весь модуль `/saas/users`. `saas_users` используется для логина, но CRUD-controller'а нет.

**Операционная боль:** новых `super_admin`/`support` сейчас заводят **только SQL-seed'ом** — любой кадровый change требует SRE. На MVP (5–20 internal users) терпимо, но это технический долг с операционным риском.

**Запрошенный контракт:**

- `GET /saas/users` — list (offset-based).
- `POST /saas/users` — создать (`email`, `full_name`, `role`, временный пароль / invite-flow).
- `PATCH /saas/users/{id}` — редактирование, смена роли, `is_active` (деактивация).
- Смена пароля (свой / админский reset).

**Гейт:** [C.3](#c3) (разделение прав super_admin↔support) влияет на то, кто может вызывать write-операции этого модуля.

---

## 4. P1 — Доработки существующих эндпойнтов

### <a id="p1-1"></a>4.1 — Статус async-джоб биллинга

**Проблема:** `/saas/billing/{monthly,discount-expire,overdue}-run` отдают **202** `{ job_id, status:"enqueued" }`. Итоги (`invoices_created` и т.п.) доступны **только в worker-логах** ([`endpoints.md §5`](endpoints.md#5-billing-operations-manual-triggers--saasbilling)). Фронт показывает toast с `job_id` и НЕ показывает прогресс/результат — оператор не знает, отработал ли прогон.

**Запрошенное (одно из):**

1. `GET /saas/billing/jobs/{job_id}` → `{ status: queued|active|completed|failed, result?: {...counters}, failed_reason? }`. Фронт поллит после enqueue.
2. Или общий `GET /saas/jobs/{job_id}` поверх BullMQ (переиспользуемо и для lifecycle-retry).

**Эффект:** биллинг-операции получают честный прогресс/итог вместо "поставлено в очередь, смотрите логи". Контраст с content-триггерами (200 sync со счётчиками) — там UX уже полноценный.

> Не зафиксировано в OPEN_QUESTIONS как отдельный пункт — выявлено из UX-разрыва §5 vs §6 `endpoints.md`. Предлагаю завести как новый вопрос B-серии при принятии в работу.

### <a id="p1-2"></a>4.2 — `monthly-run` принимает `kindergarten_id` `[B.12]`

`POST /saas/billing/monthly-run` имеет `kindergarten_id` в DTO, но backend **возвращает 400** если передано (single-kg отложен на backend B22). Фронт скрыл поле "Только для одного садика". Когда backend начнёт принимать `kindergarten_id` без 400 — фронт раскомментирует optional select (≈1 строка, поле уже scoped в B6).

### <a id="p1-3"></a>4.3 — Slug-uniqueness probe `[B.16]`

Wizard создания садика собирает всё и шлёт разом; 409 `kindergarten_slug_taken` возвращает на Step 1 после полного round-trip. `GET /saas/kindergartens` принимает `name_search`, но **не** `slug=` exact — дешёвой client-side проверки нет.

**Запрошенное (одно из):**

1. `GET /saas/kindergartens?slug=<exact>` → `{ items, total: 0|1 }`.
2. `GET /saas/kindergartens/check-slug?slug=<value>` → `{ available: bool }` (дешевле).

Фронт дебаунсит 300ms на blur slug-поля, показывает inline-ошибку до submit. До этого — текущее MVP-поведение (deferred 409).

### <a id="p1-4"></a>4.4 — Cross-kg metrics aggregation `[B.6]`

Dashboard `/` хочет: Total MRR, invoices this month, total active children, growth chart (new kgs/month). Всё требует cross-kg SQL-агрегатов; backend-агрегата нет. Сейчас фронт читает только `total` из `GET /saas/kindergartens?limit=1`.

**Запрошенное:** `GET /saas/metrics/overview` → единый агрегат-DTO. Один endpoint дешевле, чем N клиентских запросов + локальная агрегация.

**Гейт:** [C.5](#c5) (какие именно KPI) + [C.1](#c1)/B.9 (MRR невозможен без подписок).

### <a id="p1-5"></a>4.5 — Cron schedule visibility `[B.7]`

Много BullMQ repeatable jobs (`weekly-rollout`, `billing-cron`, `birthday-generation`, `story-cleanup`, `content-publish`, `notification-outbox-poll`, …). Super_admin может только ручками триггерить, но не видит `last_run/next_run/last_error`. Сейчас ответ на "monthly-run сегодня отработал?" — только `kubectl logs worker`.

**Запрошенное:** `GET /saas/cron-jobs` → агрегированный статус каждой repeatable (читает BullMQ-метаданные). Фронт построит read-only таблицу на `/system-status` или новой странице.

### <a id="p1-6"></a>4.6 — DLQ kindergarten filter + kg-name JOIN

`GET /admin/lifecycle/failed-jobs` не принимает `?kindergartenId=`; `payload.kindergartenId` — сырой UUID без имени садика. Фронт сейчас показывает truncated UUID + tooltip, фильтр по садику омитнут (cursor-пагинация делает client-side фильтр бесполезным — пропускает страницы).

**Запрошенное (одно из):**

1. Query `?kindergartenId=<uuid>` на `GET /admin/lifecycle/failed-jobs`.
2. Или server-side JOIN: добавить `kindergarten_name` в `FailedJobItemDto`.

Связано с фиксом [P0.1/B.17](#p0-1) — пока DLQ отдаёт 403, эта доработка вторична.

---

## 5. P2 — Новые модули / инфраструктура

### <a id="p2-1"></a>5.1 — View-as / read-only impersonation `[B.3 / C.4]`

Большинство `/admin/*` требуют JWT с `kindergarten_id` claim; super_admin JWT — без него. `/kindergartens/:id/view-as` сейчас info-stub.

**Варианты (backend-решение):**

1. Расширить `/admin/*` controllers: `@SuperAdminScope({ allowExplicitKgQueryParam: true })`, super_admin шлёт `?kindergarten_id=<uuid>`. POST/PATCH/DELETE остаются заблокированы (audit-safety).
2. Short-lived impersonation JWT: `POST /saas/impersonate { kindergarten_id }` → 5-мин JWT с подмешанным claim + запись в audit_logs.

**Гейт:** [C.4](#c4) определяет scope данных (дети/группы/инвойсы/…) и PII-ограничения. Без продуктового решения объём не зафиксировать.

### <a id="p2-2"></a>5.2 — Audit log infrastructure `[B.4 / C.2]`

В `schema.dbml` нет `audit_logs`. Super_admin хочет "кто/когда что менял" (тарифы, деактивации, mark-paid, refund).

**Запрошенное:** таблица `audit_logs` (`actor_id, action, entity, before/after JSONB, timestamp`) + `GET /saas/audit-logs` (offset-based, фильтры по actor/entity/дате).

**Гейт:** [C.2](#c2) (compliance-стандарт, какие операции логируем, retention).

### <a id="p2-3"></a>5.3 — Webhook audit `[B.5]`

Payment-провайдеры (Halyk/TipTopPay/Kaspi) + ОФД шлют webhooks; backend их принимает, но видимости failed/succeeded через UI нет.

**Use case:** "родитель заплатил, статус не обновился" → super_admin смотрит webhook-лог → видит, что упал на retry'ях.

**Запрошенное:** storage failed/succeeded webhooks + `GET /saas/payment-webhooks?status=failed&from=...`.

### <a id="p2-4"></a>5.4 — WS / SSE system-events для super_admin `[A.2]`

WS-gateway автоподписывает super_admin только на `user:{id}` room; cross-kg system-events не транслируются. Real-time по failed cron'ам / OOM / DB-load отсутствует.

**Варианты:** WS room `saas:system` (`NotificationPort.notifySystemEvent()`) / REST polling `GET /saas/system-events?since=` / SSE. Триггер — запрос DevOps на real-time видимость. До этого фронт обходится polling'ом health 30s.

### <a id="p2-5"></a>5.5 — httpOnly cookie auth-flow `[A.1]`

Сейчас refresh-токен в `localStorage` (приемлемо за VPN/IP-allowlist на MVP). Миграция на `Set-Cookie: refresh_token; HttpOnly; Secure; SameSite=Strict; Path=/saas/auth` + CSRF-token потребует backend-изменений в `/saas/auth/*`. Триггер — первый внешний security-аудит (SOC2/ISO 27001) или вынос фронта из-за VPN. Связано с [A.3](OPEN_QUESTIONS.md#a3-vercel-access-control--network-perimeter--open) (Vercel network perimeter, решение отложено 2026-05-15).

---

## 6. Контрактные уточнения / verification

- **B.2 — OpenAPI completeness.** Фронт генерит типы из `/docs-json` (`pnpm gen:api`). Нужна гарантия, что **все** in-scope `/saas/*` controllers имеют `@ApiProperty` на всех полях и `@ApiResponse` со схемами для 2xx/4xx. Если в сген. типах появятся `any` — фронт заведёт backend-issue со списком под-эндпойнтов. **Action backend:** держать Swagger-annotations полными при добавлении новых эндпойнтов из §3–§5.
- **B.13 — `/health/ready` 503 — RESOLVED (2026-05-14).** Backend всегда отдаёт **200**, degraded через `body.status`. Менять на 503 нельзя без синка — фронт смотрит на `body.status`, не на HTTP-код. Зафиксировано как контракт.
- **`x-custom-lang`.** Backend поддерживает `ru`/`kk`; Swagger `example:"en"` — плейсхолдер, фронт `en` не шлёт. Не делать `en` обязательным/дефолтным.
- **List shape consistency.** Новые cross-tenant `/saas/*` list-эндпойнты (subscriptions/flags/users) — **offset-based** `{ items, total, limit, offset }`, как `/saas/kindergartens`. Cursor-based оставить только для BullMQ-backed (`/admin/lifecycle/*`). См. [B.1 resolved](OPEN_QUESTIONS.md#b1-унификация-list-response-shape--resolved-2026-05-14).
- **Error codes.** При добавлении эндпойнтов §3–§5 — новые коды документировать в Swagger и синкать с фронтом (`src/locales/<lang>/errors.json`). Старые коды `invalid_slug_format`/`invalid_phone_format`/`email_already_taken`/… фронт не ждёт (live Swagger их не подтвердил) — на нарушения slug/phone приходит общий `invariant_violation`.

---

## 7. Бизнес-решения, гейтящие backend-работу

Эти продуктовые вопросы открыты ([`OPEN_QUESTIONS.md` C](OPEN_QUESTIONS.md#c-business-process--product-decisions)) и определяют scope/контракт backend-работы выше. Backend не стоит финализировать соответствующие модули до их решения.

| ID                     | Вопрос                                                                                          | Гейтит                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <a id="c1"></a>**C.1** | Как Shyraq биллит **садики** (cron+email / cron+провайдер / manual)? Канал, получатель инвойса. | P0.3 (DTO подписок), P1.4 (MRR)                                         |
| <a id="c2"></a>**C.2** | Compliance-стандарт (SOC2/ISO/ЗРК ПДн), какие операции логировать, retention.                   | P2.2 (audit log)                                                        |
| <a id="c3"></a>**C.3** | Разделение прав `super_admin` vs `support` — на уровне backend RBAC (403) или только UI?        | P0.5 (кто вызывает write `/saas/users`), write-эндпойнты §3             |
| <a id="c4"></a>**C.4** | Scope view-as: какие entities (дети/группы/инвойсы/…), PII-ограничения.                         | P2.1 (view-as объём)                                                    |
| <a id="c5"></a>**C.5** | Какие KPI на dashboard (MRR/ARR, active/new/churned kgs, charts, grain).                        | P1.4 (metrics DTO)                                                      |
| C.7                    | Что с pending/overdue invoices при деактивации kg (auto-cancel / оставить / manual review).     | поведение `POST .../archive` (не блокирует фронт, но влияет на cascade) |

---

## 8. Рекомендованный порядок backend-работы

1. **P0.1 (B.17)** — самый дешёвый и высокоотдачный: RBAC-фикс, оживляет уже построенную DLQ-страницу. Скорее всего 1 guard.
2. **C.1 / C.3 / C.5** (продукт, параллельно) — разблокируют корректную финализацию P0.3/P0.5/P1.4.
3. **P0.2 (B.8)** — KG detail/settings, переиспользует существующий `KindergartenDto`, низкий контрактный риск.
4. **P0.5 (B.11)** — снимает операционную боль (SQL-seed юзеров), небольшой CRUD.
5. **P0.3 (B.9) / P0.4 (B.10)** — модули подписок/флагов (P0.3 после C.1).
6. **P1.1 / P1.2 / P1.3** — UX-доработки существующих фич (job-статус, single-kg billing, slug-probe).
7. **P1.4 / P1.5 / P1.6** — dashboard metrics, cron visibility, DLQ filter.
8. **P2** — view-as, audit, webhook audit, WS, cookie-auth (по триггерам/compliance).

**Каждый раз при изменении Swagger:** фронт прогоняет `pnpm gen:api` + `pnpm typecheck` перед сессией. Если меняете shape **уже потребляемого** эндпойнта из [§2](#2-что-уже-работает--контракты-которые-нельзя-ломать) — предупредить фронт-команду заранее (см. Risk register R2/R5 в `IMPLEMENTATION_PLAN.md`).

---

_Документ производный. При расхождении первичны [`endpoints.md`](endpoints.md) и [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md). Обновлять при изменении backend-scope или закрытии вопросов B-/C-серии._
