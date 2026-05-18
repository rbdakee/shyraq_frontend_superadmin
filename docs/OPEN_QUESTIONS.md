# Shyraq SuperAdmin Frontend — Open Questions

Список открытых вопросов, требующих решения от product / backend / sales команд. Сгруппированы по области. Каждый вопрос — с контекстом, вариантами и текущим статусом.

**Принцип:** этот документ — единственное место, где живут "не решено". `architecture.md`, `endpoints.md`, `superadmin_BP.md` — однозначные, отражают текущие MVP-решения.

**Легенда статусов:**

- `open` — нужно решение, никто не работает
- `in-progress` — обсуждается / прорабатывается
- `parked` — отложено до конкретного триггера
- `resolved` — решение принято, обновить остальные docs

---

## A. Architecture (frontend stack & infrastructure)

### A.1 Token storage strategy — `parked`

**Контекст:** в [`architecture.md §6.2`](architecture.md#62-хранение-токенов) на MVP refresh-токен хранится в `localStorage`. Альтернатива — httpOnly cookie от backend (`Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/saas/auth`).

**Вопросы:**

- Когда нужно мигрировать на httpOnly cookie?
- Триггер — compliance аудит (SOC2 / ISO 27001) или конкретный security-инцидент?

**Варианты:**

1. Остаться на localStorage пока приложение за VPN/IP-allowlist (текущий MVP).
2. Мигрировать сейчас (preempt compliance) — требует backend-изменений в `/saas/auth/*` для поддержки cookie-flow + CSRF token.

**Зависимости:** backend (изменение auth-flow), security/compliance.

**Триггер для решения:** первый внешний security-аудит ИЛИ когда фронт окажется не за VPN.

---

### A.2 WebSocket integration timing — `parked`

**Контекст:** [`architecture.md §1`](architecture.md#1-контекст-и-ограничения) — на MVP WS не используется. Backend WS-gateway (B9) для super_admin автоподписывает только `user:{id}` room; cross-kg system events backend сегодня не транслирует.

**Вопросы:**

- Когда backend начнёт слать system-events для super_admin (failed crons, payment fraud, нагрузка)?
- Какой канал — отдельная WS room (`saas:system`) или REST polling enough?

**Варианты:**

1. WS room `saas:system` — backend выпускает `NotificationPort.notifySystemEvent()`, фронт подключает socket.io-client + слушает.
2. REST polling каждые N секунд для `GET /saas/system-events?since=...`.
3. Server-Sent Events — проще WS, но требует backend изменений.

**Зависимости:** backend roadmap (новый event-key catalog для super-admin events).

**Триггер:** когда DevOps попросят real-time видимость по failed cron'ам / OOM / DB high-load.

---

### A.3 Vercel access control / network perimeter — `open`

**Контекст:** инструмент specced как internal за VPN/IP-allowlist ([`architecture.md §1`](architecture.md#1-контекст-и-ограничения)) — права super-admin над **всей** платформой (все садики, billing-триггеры, DLQ). После переезда на Vercel (решение Post-B8, 2026-05-15) на плане **Hobby** деплой — публичный URL без сетевого периметра. Сейчас единственная защита — app-login (super-admin auth + backend rate-limit `10/час` per email). Сетевой периметр (Vercel Deployment Protection / Trusted IPs) требует план **Pro**.

**Вопросы:**

- Берём Vercel Pro ради Deployment Protection (Vercel Authentication / Trusted IPs)?
- Или ставим перед Vercel свой reverse-proxy с IP-allowlist (тогда зачем Vercel)?
- Достаточно ли app-login + rate-limit как компенсирующего контроля до решения?

**Варианты:**

1. Vercel Pro + Deployment Protection (Trusted IPs / Vercel Auth) — лучший периметр, $/мес.
2. Публичный URL, полагаемся только на app-login (текущее состояние) — security-риск зафиксирован.
3. Свой reverse-proxy (Nginx/Caddy) с IP-allowlist перед Vercel-деплоем.

**Зависимости:** бюджет (Vercel план), devops (статические IP офиса/VPN).

**Триггер для решения:** перед тем как раздать URL команде / до первого реального super-admin доступа в проде. Решено пользователем: **отложить** (2026-05-15) — деплой делается рабочим, хардненинг доступа отдельной задачей.

---

## B. Endpoints / Backend API contracts

### B.1 Унификация list response shape — `resolved` (2026-05-14)

**Решение:** unified shape не нужен — у фронта только 2 list-эндпойнта в scope, и они осознанно используют **разные** парадигмы:

- `GET /saas/kindergartens` → `KindergartenListResponseDto: { items, total, limit, offset }` — **offset-based** (есть дешёвый `count(*)` в Postgres, нужен range-label "X–Y из N").
- `GET /admin/lifecycle/failed-jobs` → `ListLifecycleFailedJobsResponseDto: { items, next_cursor }` — **cursor-based** (BullMQ не даёт цены за `total`, opaque base64 cursor).

Прежний контекст ("часть `/saas/*` отдаёт `[...]`, часть `{items, next_cursor}`") опровергнут live-аудитом 2026-05-14: голого массива в `/saas/*` нет, `next_cursor` в `/saas/*` нет — только под `/admin/lifecycle/*`.

**Что делает фронт:** 2 разные пары `api/<entity>.ts` + `hooks/use-<entity>.ts` без общего `useList<T>`. DataTable компонент принимает обобщённый `pagination?: { hasNext, hasPrev, onNext, onPrev, rangeLabel }` — внутрь подкладывается offset- или cursor-логика per-page (см. [`DESIGN.md §4.2`](DESIGN.md#42-datatable--переиспользуемая-таблица)).

**Если появятся новые list-эндпойнты** (`/saas/saas-subscriptions`, `/saas/feature-flags`, `/saas/users` — все blocked по [B.9](#b9-saas-subscriptions-module--blocker-) / [B.10](#b10-feature-flags-module--blocker-) / [B.11](#b11-saas-users-module--blocker-)) — попросить backend держать offset-based shape для cross-tenant `/saas/*` ради консистентности.

---

### B.2 OpenAPI completeness verification — `open`

**Контекст:** [`architecture.md §9.1`](architecture.md#91-openapi-types-generation) — генерим типы из `/docs-json`. Backend имеет `B7_SWAGGER_SMOKE.md`, но не понятно, покрывает ли он все `/saas/*` controllers с правильными request/response DTOs.

**Вопрос:** Какой объём `/saas/*` сейчас в Swagger полностью описан (`@ApiProperty` на всех полях, `@ApiResponse` со схемами для 2xx/4xx)?

**Action:** прогнать smoke-тест после первого `pnpm gen:api`. Если есть `any` в сгенерированных типах — список под-эндпойнтов в backend Issue.

**Зависимости:** backend (доработка Swagger annotations где не хватает).

---

### B.3 Read-only super-admin доступ к `/admin/*` resources — `parked`

**Контекст:** [`endpoints.md §10`](endpoints.md#10-view-as-kindergarten-mvp-placeholder), [`superadmin_BP.md §8`](superadmin_BP.md#8-view-as-kindergarten-support-troubleshooting-mvp-placeholder). Сегодня большинство `/admin/*` endpoints требуют JWT с `kindergarten_id` claim. Super_admin JWT — без `kindergarten_id`. View-as kg не работает.

**Варианты реализации:**

1. **Расширить `/admin/*` controllers:** разрешить super_admin JWT с `?kindergarten_id=<uuid>` query. ChildAccessGuard/KindergartenScopeGuard поддержат `@SuperAdminScope({ allowExplicitKgQueryParam: true })`. POST/PATCH/DELETE остаются заблокированы для super_admin (audit-trail safety).
2. **Short-lived impersonation JWT:** `POST /saas/impersonate { kindergarten_id }` → 5-минутный JWT с подмешенным `kindergarten_id` + запись в audit_logs. Сложнее, но чище.

**Вопросы:**

- Какой объём read-only нужен на view-as? (дети, группы, staff, инвойсы, stories, attendance?)
- Нужны ли write-actions через view-as (вообще запрещено) или только в impersonation-mode?

**Зависимости:** backend, продуктовая команда.

**Триггер:** когда support-команда жалуется, что не может помочь admin'ам без БД-доступа.

---

### B.4 Audit log infrastructure — `open`

**Контекст:** в backend `schema.dbml` нет таблицы `audit_logs` или хука. Super_admin часто хочет видеть "кто и когда что менял" (изменения тарифов, деактивации, ручные mark-paid).

**Вопрос:** Нужна ли таблица `audit_logs` (actor_id, action, entity, before/after JSONB, timestamp) + endpoint `GET /saas/audit-logs` для frontend?

**Связано с:** [C.2 SOC2 compliance](#c2-audit-log-compliance-requirement--open).

**Зависимости:** backend (новая миграция + module + endpoint), product (определить какие entities логируем).

---

### B.5 Webhook audit UI — `open`

**Контекст:** payment-провайдеры (Halyk, TipTopPay, Kaspi) и ОФД шлют webhooks. Backend их принимает (`api` process), но видимости failed/succeeded webhooks через UI нет.

**Вопрос:** Нужен ли `GET /saas/payment-webhooks?status=failed&from=...` для troubleshooting?

**Use case:** admin садика звонит "родитель заплатил, но статус не обновился" → super_admin смотрит webhook log → понимает, что webhook упал на retry'ях.

**Зависимости:** backend (storage failed webhooks + endpoint), product priority.

---

### B.6 Cross-kg metrics aggregation endpoint — `open`

**Контекст:** на dashboard `/` хочется видеть:

- Total MRR (active subscriptions)
- Total invoices created this month
- Total active children across all kgs
- Growth chart (new kgs per month)

Сейчас всё это требует cross-kg SQL агрегатов, backend агрегата нет.

**Вопрос:** Backend выставляет `GET /saas/metrics/overview` или фронт собирает из существующих endpoints?

**Варианты:**

1. Один агрегат-endpoint — простой UI, дешевле трафик.
2. N запросов клиента + локальная агрегация — больше нагрузки.

**Зависимости:** backend (новый controller/service).

---

### B.7 Cron schedule visibility — `open`

**Контекст:** в backend есть много BullMQ repeatable jobs (см. backend `architecture.md §6.2`): `notification-outbox-poll`, `weekly-rollout`, `billing-cron`, `birthday-generation`, `story-cleanup`, `content-publish`, `notifications-outbox-prune`. Super_admin хочет видеть статус (last_run, next_run, last_error) — а не только манualно их триггерить.

**Вопрос:** Нужен ли `GET /saas/cron-jobs` с агрегированным статусом каждой repeatable?

**Use case:** "monthly-run сегодня успешно отработал?" — сейчас ответ только через `kubectl logs worker` или DB query на свежие invoices.

**Зависимости:** backend (новый endpoint, читает BullMQ метаданные).

---

### B.8 Kindergarten detail / settings endpoints — `blocker` 🚫

**Контекст:** аудит live Swagger (2026-05-13) показал, что `GET /saas/kindergartens/{id}` и `PATCH /saas/kindergartens/{id}` **не существуют** на backend. Сегодня доступны только: `GET /saas/kindergartens` (список), `POST /saas/kindergartens` (create), `POST .../archive`, `POST .../restore`, `POST .../admin/invite`.

**Что блокирует на фронте:**

- `/kindergartens/:id` — tab "Обзор" (нет детального API → можно показать только то, что прилетает в `GET /saas/kindergartens` row)
- `/kindergartens/:id/settings` — tab "Настройки" (PATCH невозможен)
- Любой read-only impersonation (см. также [B.3](#b3-read-only-super-admin-доступ-к-admin-resources--parked))

**Вопрос:** когда backend выкатит `GET /saas/kindergartens/{id}` (с расширенным DTO: subscription, stats, settings) и `PATCH /saas/kindergartens/{id}` (для редактирования settings/plan/is_active)?

**MVP workaround:** на странице `/kindergartens/:id` показываем то, что есть в list-row (name, slug, plan, settings JSONB read-only через Accordion). Tab "Настройки" — placeholder с info-alert "Редактирование недоступно в текущей версии backend'а".

**Зависимости:** backend roadmap.

**Триггер для решения:** до старта batch 5 фронта.

**🟡 Частично доставлено (2026-05-18) — НЕ закрывает B.8.** Backend выкатил `GET / POST /saas/kindergartens/:id/admins` (список + добавление админов садика; ветка `superadmin/kg-admins`, смержена + задеплоена, live Swagger подтверждён). Это **разблокировало отдельную вкладку «Администраторы»** (`/kindergartens/:id/admins`) — у неё свой list/add-эндпоинт, она НЕ зависит от детального DTO. Реализуется фронт-батчем **B9** ([`IMPLEMENTATION_PLAN.md §B9`](IMPLEMENTATION_PLAN.md#b9--kindergarten-admins-tab), [`DESIGN.md §5.5.6`](DESIGN.md#556-tab-администраторы), [`endpoints.md §1.7`](endpoints.md#17-get--post-saaskindergartensidadmins--список--добавление-админов-садика)). **Остаётся blocker:** `GET /saas/kindergartens/:id` (overview-tab) и `PATCH` (settings-tab) — по-прежнему отсутствуют.

**Follow-up gaps (новые backend-asks, открыть при появлении продуктовой нужды):**

- **Нет remove / demote админа** садика суперадмином (удалить/понизить роль). Если в UI понадобится «Убрать админа» — отдельный backend-ask.
- **Нет реактивации деактивированного админа** через `POST .../admins` (409 by design на пару (kg,user) при любом `is_active`; оператор реактивирует руками). UI на 409 показывает осмысленное сообщение, не «retry».

---

### B.9 SaaS Subscriptions module — `blocker` 🚫

**Контекст:** в live Swagger **отсутствует** весь модуль `/saas/saas-subscriptions` (list/create/update). Таблица `saas_subscriptions` в БД есть (`schema.dbml#L1335-1347`), но REST-controller'а над ней не написан.

**Что блокирует:**

- `/subscriptions` — cross-kg список подписок
- `/kindergartens/:id/subscription` — tab подписки в детали kg
- Dashboard MRR-виджет (если когда-то решим добавлять)

**Вопрос:** когда backend выкатит `GET/POST/PATCH /saas/saas-subscriptions`?

**MVP workaround:** обе страницы — placeholder'ы с info-alert + ссылка на этот блокер. Sidebar item "Подписки" остаётся, но показывает placeholder при клике.

**Зависимости:** backend roadmap.

**Связано с:** [C.1 Биллинг садиков от платформы](#c1-биллинг-садиков-от-платформы-shyraq--open) — продуктовый вопрос; [B.6 metrics](#b6-cross-kg-metrics-aggregation-endpoint--open) — без подписок MRR не посчитать.

---

### B.10 Feature Flags module — `blocker` 🚫

**Контекст:** в live Swagger **отсутствует** весь модуль `/saas/feature-flags` (list/create/update/delete). Таблица `feature_flags` в БД есть, но controller не написан.

**Что блокирует:**

- `/feature-flags` — cross-kg список и create-modal
- `/kindergartens/:id/flags` — per-kg tab

**Вопрос:** когда backend выкатит `GET/POST/DELETE /saas/feature-flags`? Минимум: `key`, `value` (JSONB), `kindergarten_id` (nullable для глобальных), upsert по `(kindergarten_id, key)`.

**MVP workaround:** `/feature-flags` route не регистрируем в роутере, sidebar item не показываем (или disabled с tooltip). Tab "Feature Flags" в детали kg — placeholder.

**Зависимости:** backend roadmap.

---

### B.11 SaaS Users module — `blocker` 🚫

**Контекст:** в live Swagger **отсутствует** весь модуль `/saas/users` (list/create/update). Таблица `saas_users` в БД есть и используется для логина (`POST /saas/auth/login`), но CRUD-controller'а над ней не написан.

**Что блокирует:**

- `/users` — список SaaS-пользователей
- `/users/new` — создание нового super_admin / support
- `/users/:id` — редактирование, смена пароля, деактивация

**Серьёзность:** новых SaaS-пользователей сейчас можно завести **только через DB seed / SQL**. На MVP это OK (5–20 internal users, текучесть низкая), но любой кадровый change требует SRE-help.

**Вопрос:** когда backend выкатит `/saas/users` CRUD?

**MVP workaround:** `/users` route — placeholder с инструкцией "Для добавления нового пользователя обратитесь к dev-команде (требуется SQL-seed). Backend endpoint в roadmap." Sidebar item остаётся, но ведёт на placeholder.

**Зависимости:** backend roadmap.

**Связано с:** [C.3 Разделение прав super_admin / support](#c3-разделение-прав-super_admin--support--open).

---

### B.12 Single-kindergarten billing trigger — `parked`

**Контекст:** `POST /saas/billing/monthly-run` принимает поле `kindergarten_id` в DTO, но backend **возвращает 400** если оно передано. Single-kg trigger перенесён в backend B22.

**Вопрос:** оставить поле в DTO или скрыть на UI до тех пор, пока backend не реализует?

**MVP-решение:** на форме `/operations/billing` поле "Kindergarten" **не показывать** (всегда cross-tenant). Когда backend начнёт принимать `kindergarten_id` без 400 — добавить optional select.

**Зависимости:** backend B22.

---

### B.13 `/health/ready` 503 contract — `resolved`

**Контекст:** Swagger описывает только 200 для `/health/ready` (`status: ok|degraded`). Наша документация (и UX дашборда) предполагает 503 при degraded.

**Вопрос:** какой реальный response при degraded — 200 с `status='degraded'` или 503 с тем же body?

**MVP-обработка фронта:** воспринимать **и** `HTTP 503` **и** `HTTP 200 + status='degraded'` как degraded. Защита от обеих интерпретаций.

**Зависимости:** уточнить у backend / прогнать readiness-check с остановленным Redis.

**Решено (2026-05-14):** B3 backend research (commit `110607e`, plan §10) подтвердил: `/health/ready` всегда возвращает `200` благодаря `@HttpCode(HttpStatus.OK)` на handler'е; индикаторы (`checkDb`, `checkRedis`) ловят свои exceptions внутри и не бросают. Status conveyed через body: `{ status: 'ok' | 'degraded', checks: { db: 'up'|'down', redis: 'up'|'down' } }`. Backend'овский `docs/endpoints.md` line 31 ошибочно утверждает 503-on-down — это backend-doc bug, не наша забота. **Frontend treatment:** plain `useQuery({ refetchInterval: 30_000, retry: 0, staleTime: 0 })` без специальной обработки в `api/client.ts`. Сетевой fail (server unreachable) — distinct "health недоступен" state через `isError`, NOT degraded.

---

## C. Business Process / Product decisions

### C.1 Биллинг садиков от платформы Shyraq — `open`

**Контекст:** [`superadmin_BP.md §3.1`](superadmin_BP.md#31-создание-подписки-для-нового-садика). Таблица `saas_subscriptions` есть, но cron на её billing нет. Не понятно, как Shyraq выставляет счёт **садику** (не родителю — это уже работает через `tariff_plans`).

**Вопросы:**

- Платформа выставляет счёт садику автоматически (cron 1-го числа каждый месяц/года) или вручную?
- Через какой канал — отдельный B2B-инвойс в SAP/1C, прямой банковский транш, online-карта?
- Кому уходит invoice — на admin'а садика по email, или sales-менеджеру в Shyraq?

**Варианты:**

1. **Manual (текущий MVP):** super_admin сортирует `/subscriptions` по `next_billing_at`, выставляет счета off-platform.
2. **Cron + email:** backend cron `saas-billing:invoice-generate` → email сгенерированного PDF на admin садика + super_admin.
3. **Cron + payment-provider:** автосписание с привязанной карты юрлица (требует saved payment method per kg).

**Зависимости:** sales/finance Shyraq (бизнес-процесс), backend roadmap.

---

### C.2 Audit log compliance requirement — `open`

**Контекст:** [B.4 Audit log infrastructure](#b4-audit-log-infrastructure--open) — техническая часть. Здесь — бизнес-вопрос.

**Вопросы:**

- Какой compliance стандарт целевой? (SOC2 Type 1/2, ISO 27001, ЗРК "О персональных данных")
- Какие операции требуют логирования: создание/деактивация kg, изменение тарифов, mark-paid, refund-process, изменение прав staff?
- Сколько хранить логи (1 год / 5 лет / forever)?

**Зависимости:** legal/compliance Shyraq, audit-counterparty (если есть).

**Связано с:** [B.4](#b4-audit-log-infrastructure--open).

---

### C.3 Разделение прав super_admin / support — `open`

**Контекст:** [`superadmin_BP.md §0`](superadmin_BP.md#0-actors). Сегодня в backend для всех `/saas/*` controllers требуется `role IN ('super_admin', 'support')`. Разделения прав внутри **на уровне эндпойнтов нет**.

**Вопросы:**

- Должен ли `support` НЕ мочь:
  - Удалять садики (deactivate)?
  - Создавать новых SaaS-пользователей?
  - Менять тарифы (через `/saas/kindergartens/:id`)?
  - Триггерить billing cron'ы?
- На уровне backend (response 403) или только UI (hide buttons)?

**Варианты:**

1. **UI-only restriction:** фронт прячет destructive-кнопки для support. Не security, но улучшает UX.
2. **Backend RBAC:** `@Roles('super_admin')` на write-эндпойнтах + 403 для support. Требует backend-изменений на ~10 контроллерах.

**Рекомендация:** option 2 если планируем расширять support-команду (>3 человек) и доверие падает.

**Зависимости:** backend (RBAC infrastructure), product/HR.

---

### C.4 View-as Kindergarten — scope данных — `open`

**Контекст:** [B.3 Read-only super-admin доступ](#b3-read-only-super-admin-доступ-к-admin-resources--parked) — техника. Здесь — продуктовый вопрос про объём.

**Вопросы:**

- Какие entities super_admin / support должен видеть глазами kg-admin'а?
  - [ ] Дети (список + детали)
  - [ ] Группы + mentors
  - [ ] Staff list
  - [ ] Invoices + payments
  - [ ] Refunds
  - [ ] Tariff plans + assignments
  - [ ] Custom discounts
  - [ ] Content posts + stories
  - [ ] Attendance events
  - [ ] Parent requests
  - [ ] Diagnostics + progress notes
  - [ ] Cameras config
  - [ ] Notifications history
- Доступ к PII (телефоны родителей, ИИН детей, медицинские заметки) — ограничен?

**Зависимости:** product, legal (PII access policy).

**Связано с:** [B.3](#b3-read-only-super-admin-доступ-к-admin-resources--parked).

---

### C.5 Multi-tenant analytics dashboard — `open`

**Контекст:** [B.6 Cross-kg metrics aggregation](#b6-cross-kg-metrics-aggregation-endpoint--open) — техника. Здесь — продуктовый scope.

**Вопросы:**

- Какие KPI должны быть на main dashboard `/`?
  - MRR / ARR
  - Total active kgs / new this month / churned this month
  - Total active children
  - Avg invoices per kg / avg payment rate
  - Growth chart (kgs over time, children over time)
- Нужны ли trend-charts (Recharts) или достаточно single-value KPIs?
- Какой grain — daily / weekly / monthly?

**Зависимости:** product (KPI definition), CEO/founders.

---

### C.6 i18n KK translation ownership — `resolved (MVP)`

**Контекст:** [`architecture.md §1`](architecture.md#1-контекст-и-ограничения) — i18n RU+KK через i18next. Translation strings — кто их пишет?

**Вопросы:**

- Native KK speaker в команде Shyraq для перевода UI strings?
- Готовы ли использовать машинный перевод (DeepL/Google Translate) для initial pass + human review?
- Где хранить glossary KK-терминов (садик, ребёнок, родитель, тариф, инвойс…)?

**Рекомендация:** не катать машинный перевод для admin tool без человеческого review — выглядит непрофессионально для русскоязычных KZ-сотрудников.

**Зависимости:** HR/команда (найти native KK speaker), product.

**Resolved for MVP (2026-05-15):** B8-S1 sub-agent (Claude Sonnet 4.6) writes native KK translations for all 7 i18n namespaces directly, no DeepL/Google MT. Switcher remains active. Human review by native KK speaker optional post-launch.

---

### C.7 Pending invoices при деактивации kg — `open`

**Контекст:** [`superadmin_BP.md §2.3`](superadmin_BP.md#23-деактивация-садика). При деактивации kg backend cascade-архивирует детей и cancel'яет SaaS-подписку. Но **неоплаченные invoices родителям не отменяются**.

**Вопросы:**

- Что делать с pending/overdue invoices при деактивации kg?
  - Auto-cancel (потеря revenue)
  - Оставить (родители продолжают видеть в Parent App?)
  - Manual review super_admin'ом перед deactivate
- Что с invoices в `partial` статусе (частичная оплата) — refund'ить разницу или оставить?

**Зависимости:** product, finance.

---

### B.14 `errors.json` flat `forbidden` key vs nested error-page group — `resolved`

**Контекст:** brief B3 Slice 1 запросил добавить nested `"forbidden": { title, subtitle, cta_home }` в `errors.json` рядом с существующим flat `"forbidden": "Доступ запрещён"`. Два ключа с одинаковым именем в одном JSON-объекте невозможны.

**Решение в B3 Slice 1:** nested группа для страницы 403 названа `"forbidden_page"` (не `"forbidden"`). Код error-page в slice 5 должен использовать `t('errors:forbidden_page.title')` и т.д.

**Вопрос:** принять `forbidden_page` как canonical naming для error-page i18n ключей, или переименовать flat API-error ключ (например в `forbidden_api`) чтобы освободить имя `forbidden` для nested группы?

**Зависимости:** slice 5 (error pages) + все места где используется `t('errors:forbidden')` для toast'ов.

**Триггер:** до старта B3 Slice 5 (error pages).

**Решено (2026-05-14):** оба ключа canonical, разные surfaces:

- `errors:forbidden` (flat, string) — для API 403 toast'ов через `lib/error-map.ts` (унаследовано с B2).
- `errors:forbidden_page` (nested: `{ title, subtitle, cta_home }`) — для страницы `/_403` (используется в `src/routes/_403.tsx`).

Никакого переименования не требуется. Будущие nested-группы для других error-pages (404, 500) следуют той же конвенции `{slug}_page`.

---

### B.16 Realtime slug uniqueness check (frontend feature gap) — `open`

**Контекст:** B5 finalization browser walk — user expects slug field to flag duplicates before submit.

Currently the wizard collects (name, slug, ...) and submits all at once; the 409 `kindergarten_slug_taken` error returns user to Step 1 with field highlighted. UX feedback is delayed by full round-trip + reset.

Frontend can't do this client-side cheaply because backend `GET /saas/kindergartens` list endpoint accepts `name_search` but no `slug=` query — we can't probe a specific slug without listing all kgs and matching client-side (cost grows with kg count, fragile).

**Requested backend work:** either

1. New query param: `GET /saas/kindergartens?slug=<exact>` returning `{ items: [...], total: 0|1 }`. Frontend debounces 300ms, hits endpoint on slug field blur or pause, surfaces inline error.
2. Dedicated endpoint: `GET /saas/kindergartens/check-slug?slug=<value>` returning `{ available: bool }`. Cheaper.

Until then, MVP behavior (deferred 409 on submit) stays. See `TODO(B?)#03`.

**Зависимости:** backend roadmap.

**Триггер:** when support/product requests inline slug validation UX.

---

### B.17 DLQ endpoint returns 403 for super_admin (backend RBAC scope) — `open`

**Контекст:** B6 finalization browser walk. `GET /api/v1/admin/lifecycle/failed-jobs?limit=50` returns `403 Forbidden` (`{"message":"Forbidden resource","error":"Forbidden","statusCode":403}`) for the seed super_admin user (`admin@shyraq.local`).

**Affects:** B6 / `/operations/lifecycle-dlq` page.

Frontend code is correct per `endpoints.md §8.1`. UI degrades gracefully with the standard error state + Refresh button (toast via `t('errors:forbidden')` if code-mapped).

**Likely backend cause:** `/admin/*` prefix routes are scoped to kindergarten `admin` role, and the backend RBAC layer doesn't recognize `super_admin` as a superset. The lifecycle DLQ is a platform-ops concern that needs cross-kg visibility — super_admin should pass.

**Action needed from backend team:** either:

1. Extend the `/admin/lifecycle/*` RBAC guard to also allow `super_admin`.
2. Move the lifecycle endpoints under `/saas/lifecycle/*` (super_admin scope) and update `endpoints.md §8` accordingly.

Frontend can't proceed beyond the empty/403 state without this. `POST /admin/lifecycle/failed-jobs/:id/retry` likely returns the same 403 — confirm once GET works.

**Workaround for testing during dev:** run requests with a kg-admin token to verify DLQ page rendering. Production rollout blocked until super_admin scope is granted.

**Зависимости:** backend RBAC fix.

**Триггер:** before B6 can be marked fully accepted on DLQ tab.

---

## D. Process / Operational

### D.1 Когда обновить этот документ — `meta`

- Когда вопрос становится `resolved` — переместить решение в основной doc, оставить здесь только запись "решено YYYY-MM-DD, см. architecture.md/endpoints.md/superadmin_BP.md".
- Новые вопросы добавляем в нужный раздел (A/B/C) с уникальным номером.
- Status field в начале каждого вопроса (`open` / `in-progress` / `parked` / `resolved`).
- Перед стартом дизайн-фазы — пройтись по `open` вопросам, выбрать те, что блокируют UI, и закрыть их.
