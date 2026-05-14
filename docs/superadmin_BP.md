# Shyraq SuperAdmin — Business Processes

Бизнес-процессы команды Shyraq (роль `super_admin`, `support`) над SaaS-платформой. Извлечено из [`backend_shyraq_v2/docs/Shyraq BP.md`](../../backend_shyraq_v2/docs/Shyraq%20BP.md) с фокусом на действия super-admin'а, дополнено operational-задачами из `backend_shyraq_v2/docs/endpoints.md §1` и `§2.24`.

**Аудитория этого документа:** product, дизайнер, frontend-разработчик. Описывает **зачем** существует каждый экран, **кто** в нём действует и **что** должно произойти.

> **🚫 Backend gaps notice (2026-05-13).** Часть процессов ниже описана идеально, но на MVP **частично заблокирована** отсутствующими backend endpoints:
>
> - **§2.2 / §2.3 (просмотр и редактирование садика, settings tab)** — нет `GET/PATCH /saas/kindergartens/{id}`. Доступны только `archive` / `restore` / `admin/invite`. См. [`OPEN_QUESTIONS.md#b8`](OPEN_QUESTIONS.md#b8-kindergarten-detail--settings-endpoints--blocker-).
> - **§3 (SaaS Subscription Management — все sub-секции)** — нет модуля `/saas/saas-subscriptions`. См. [`#b9`](OPEN_QUESTIONS.md#b9-saas-subscriptions-module--blocker-).
> - **§4 (Feature Flags Management)** — нет модуля `/saas/feature-flags`. См. [`#b10`](OPEN_QUESTIONS.md#b10-feature-flags-module--blocker-).
> - **§1.1 (Создание SaaS-пользователя), §1.3 partial (logout работает; create — нет)** — нет модуля `/saas/users`. На MVP пользователи добавляются через DB seed. См. [`#b11`](OPEN_QUESTIONS.md#b11-saas-users-module--blocker-).
> - **§5.1 (Monthly Billing Run) — single-kg trigger** — backend возвращает 400 при передаче `kindergarten_id`. См. [`#b12`](OPEN_QUESTIONS.md#b12-single-kindergarten-billing-trigger--parked).
>
> Эти процессы остаются в документе как **target state** — описывают что мы хотим. Frontend на MVP реализует только то, что покрыто backend'ом; остальное — placeholder'ы.

---

## 0. Actors

| Роль | Кто это | Что делает |
|---|---|---|
| `super_admin` | CEO/CTO Shyraq, lead-PM | Full access ко всем тенантам. Управляет подписками, фичефлагами, операторскими прогонками. Onboarding новых садиков. |
| `support` | Команда поддержки (1–3 человека) | Read-mostly access. Может ретрайнуть failed jobs, дёргать health, помогать админам садиков через view-as (когда появится). |
| `kindergarten admin` (вне scope этого фронта) | Сотрудник садика (роль `admin` в `staff_members`) | Управляет одним садиком через **Admin Web**, не SuperAdmin. Здесь — только как **получатель** действий super-admin'а (создание садика, активация подписки и т.п.). |

**Текущая модель доступа:**
- Backend для всех `/saas/*` controllers требует JWT с `role IN ('super_admin', 'support')` (см. [`endpoints.md §0`](endpoints.md#0-аутентификация-и-токены)).
- Разделения прав внутри super_admin / support на уровне эндпойнтов **нет** — оба видят и могут править всё.
- Frontend на MVP не сужает UI по роли — показывает одинаковый набор экранов обеим ролям.

Усиление RBAC (e.g. support не удаляет садики) — см. [`OPEN_QUESTIONS.md#c3`](OPEN_QUESTIONS.md#c3-разделение-прав-super_admin--support--open).

---

## 1. SuperAdmin Onboarding & Auth

### 1.1 Создание SaaS-пользователя

**Trigger:** новый сотрудник Shyraq нанят на роль super_admin или support.

**Actors:** существующий super_admin, новый сотрудник, Система.

**Main Flow:**
1. Существующий super_admin открывает `/users` → "Создать пользователя".
2. Заполняет: email, телефон, ФИО, временный пароль, роль (`super_admin` / `support`).
3. Backend: `POST /saas/users` → создание `saas_users` записи + bcrypt(password, cost=12).
4. Передаёт новому сотруднику email + временный пароль **офлайн** (Slack DM, личная встреча — НЕ email; внутренний invite-link на MVP не реализован).
5. Новый сотрудник логинится через `/login`. Backend: `POST /saas/auth/login`.
6. **Рекомендация UX:** при первом успешном логине показать модалку "Сменить пароль" → `PATCH /saas/users/:id { password: "..." }`. На MVP — необязательно, но желательно.

**Result:** новый super_admin / support имеет access ко всей SuperAdmin Frontend.

**Edge cases:**
- Если email уже занят → backend 409 `email_already_taken`, форма показывает ошибку.
- Если пароль не соответствует minimum 8 chars → 422 validation, форма подсвечивает поле.

### 1.2 Логин и сессии

**Trigger:** super_admin / support открывает приложение в браузере.

**Main Flow:**
1. AuthGuard видит отсутствие access токена → redirect `/login`.
2. User вводит email + password → `POST /saas/auth/login`.
3. Backend rate-limit: 10/час per email. Превышение → 429 (`rate_limit`).
4. Frontend сохраняет:
   - `access_token` в memory (`lib/token-storage`)
   - `refresh_token` в `localStorage` под ключом `shyraq.sa.refresh`
5. Redirect на `/` (dashboard) или на `?next=` если был.

**Refresh flow (background):**
- Каждый запрос на 401 запускает `tryRefreshOnce` через `POST /saas/auth/refresh`. Single-flight: если 5 параллельных запросов получили 401, refresh выполняется ОДИН раз.
- При success — новая пара токенов, оригинальный запрос ретраится с новым access.
- При fail (`invalid_refresh`) — wipe токенов, redirect `/login?reason=session_expired`.

**Session safety (backend-side):**
- Backend публикует в Redis pub/sub `token:blocklist:events <jti>` при logout / refresh / admin revoke.
- Текущий backend WS-gateway (B9) использует это для force-disconnect socket'ов — но SuperAdmin frontend на MVP **без WS**, поэтому session revoke = просто 401 на следующий запрос → refresh fail → re-login.

### 1.3 Logout

**Trigger:** user нажимает "Выйти" в topbar.

**Main Flow:**
1. `POST /saas/auth/logout` с current refresh в body.
2. Backend: ревокирует refresh row, добавляет access-jti в blocklist.
3. Frontend: wipe tokens, `queryClient.clear()`, redirect `/login`.

---

## 2. Kindergarten Lifecycle (Tenant management)

Центральный процесс: онбординг нового садика на платформу + поддержка его в течение жизненного цикла.

### 2.1 Онбординг нового садика (Tenant Bootstrap)

**Trigger:** sales-команда заключила контракт с новым садиком. Лид передал в Shyraq:
- Название садика
- Адрес и контактный телефон садика
- Контакты первого admin'а (имя, телефон) — он же CEO/директор/HR садика
- Выбранный тариф (`plan`)

**Backend reference:** [`endpoints.md §1.2`](endpoints.md#1-kindergartens-tenants--saaskindergartens), backend BP §1 + §3 "Дополнения (архитектурные)".

**Actors:** super_admin, новый kindergarten admin (получатель welcome-SMS), Sales team (передаёт данные).

**Main Flow:**
1. super_admin открывает `/kindergartens/new`.
2. Заполняет форму (2 step'а):
   - **Step 1 — Kindergarten details:**
     - Название (`name`)
     - Slug (генерится из названия, можно править; `^[a-z0-9-]+$`)
     - Адрес (`address`, опц.)
     - Телефон садика (`phone`, E.164)
     - План (`plan`: standard / pro / enterprise — список настраивается на бэке)
     - Settings (timezone default `Asia/Almaty`, currency default `KZT`, остальные — defaults)
   - **Step 2 — Admin contact:**
     - ФИО первого админа
     - Телефон (E.164)
     - Locale (RU / KK)
3. Frontend: `POST /saas/kindergartens` (atomic — backend в одной TX создаёт `kindergartens` + `users` + `staff_members(role=admin)`).
4. Backend после commit отправляет welcome-SMS на телефон admin'а через `SmsPort`. **На MVP `SmsPort = MockSmsAdapter`** — SMS не реально уходит, только логируется в stdout backend'а (см. backend `architecture.md §1.3`). Real SMS-провайдер подключается в Phase B.
5. Frontend: toast "Садик создан. Admin получит welcome-SMS на +77001234567" + redirect на `/kindergartens/:id`.

**Activation flow (продолжение, происходит вне SuperAdmin):**
1. Новый admin получает SMS: "Кабинет Солнышко готов, войдите по телефону +77001234567 в Admin Web по адресу https://admin.shyraq.kz".
2. Admin открывает Admin Web → вводит телефон → `POST /auth/otp/request` → SMS с OTP-кодом → `POST /auth/otp/verify` → получает JWT.
3. Дальше admin создаёт остальной staff через Admin Web (BP §3 backend'а).

**Result:**
- Создан tenant в `kindergartens` (`is_active=true`).
- Создан или переиспользован `users` (по `phone`).
- Создан `staff_members(role=admin, is_active=true)`.
- Welcome-SMS отправлен (best-effort).

**Edge cases:**
- **Slug уже занят:** backend 409 `kindergarten_slug_taken` → форма подсвечивает поле, super_admin меняет slug.
- **Phone admin'а уже существует в `users`:** backend переиспользует `user_id`, имя/locale не перезаписываются. Frontend показывает info: "Telegram-аккаунт уже существует, привязали к новому садику. Имя и язык не изменены." (см. backend `endpoints.md §1.2` description).
- **SMS не доставлен:** backend всё равно отвечает 201 (best-effort), запись в логах. Super_admin вручную сообщает admin'у credentials.
- **Phone не E.164:** backend 400 `invalid_phone_format`, форма подсвечивает.

**Frontend UX recommendations:**
- Slug autocomplete: при вводе name генерить slug через `slugify(name)`, но дать редактировать.
- Phone input через `react-phone-input-2` или собственный — авто-форматирует `+7`.
- После создания — explicitly показать SuperAdmin'у телефон, на который ушёл SMS, и текст сообщения (для troubleshooting).

### 2.2 Просмотр и редактирование садика

**Trigger:** super_admin / support открывает `/kindergartens/:id` (например, по запросу садика из support-чата).

**Main Flow:**
1. `GET /saas/kindergartens/:id` → kindergarten + subscription + stats.
2. Render:
   - Header: название, slug, плашка статуса (active/inactive), кнопки "Деактивировать" (destructive), "View as kindergarten" (MVP placeholder).
   - Tabs:
     - **Overview** — детали садика, ссылки на подписку и фичефлаги
     - **Settings** — форма `PATCH /saas/kindergartens/:id`
     - **Subscription** — детали `saas_subscriptions` для этого kg
     - **Feature Flags** — список флагов с `kindergarten_id = :id` + глобальные
     - **View as** — placeholder

**Edit flow:**
- Forms на step Settings — react-hook-form + zodResolver.
- Поля: name, address, phone, plan, is_active toggle, settings JSON (collapsible accordion с form для каждого ключа из `settings`).
- Submit → `PATCH /saas/kindergartens/:id` → invalidate query → toast "Сохранено".

### 2.3 Деактивация садика

**Trigger:** контракт с садиком расторгнут / неоплата за длительный период / на запрос самого садика.

**Actors:** super_admin (single point of decision), Финансовый отдел Shyraq (consult).

**Main Flow:**
1. super_admin открывает `/kindergartens/:id`.
2. Жмёт "Деактивировать" (destructive button в header).
3. Confirmation dialog: "Введите slug садика '`sunshine`' для подтверждения деактивации".
4. user вводит slug → backend `DELETE /saas/kindergartens/:id` (soft delete: `is_active=false` + cascade-архивация: дети → archived, подписки → cancelled).
5. Toast "Садик деактивирован. Все активные сущности архивированы.".
6. Redirect на `/kindergartens` со списком.

**Result:**
- `kindergartens.is_active = false`.
- Все активные дети → `children.status='archived'` (BP §12.5 backend'а).
- `saas_subscriptions.status='cancelled'`, `cancelled_at=NOW()`.
- Admin садика теряет доступ к Admin Web (JWT с kg_id → 403 на /admin/* потому что kg.is_active=false).

**Edge cases:**
- **Реактивация:** через `PATCH /saas/kindergartens/:id { is_active: true }`. Активные сущности при этом нужно реактивировать вручную — backend cascade-логика работает только в сторону деактивации.
- **Pending invoices:** backend не отменяет неоплаченные invoices при деактивации kg. Решение об их судьбе — см. [`OPEN_QUESTIONS.md#c7`](OPEN_QUESTIONS.md#c7-pending-invoices-при-деактивации-kg--open).

---

## 3. SaaS Subscription Management

### 3.1 Создание подписки для нового садика

**Trigger:** новый садик прошёл онбординг (BP §2.1), нужно создать его SaaS-подписку (как мы зарабатываем на нём).

**Backend reference:** [`endpoints.md §2`](endpoints.md#2-saas-subscriptions--saassaas-subscriptions).

**Main Flow:**
1. super_admin открывает `/kindergartens/:id/subscription` (или `/subscriptions` → "Новая подписка").
2. Заполняет:
   - Kindergarten (если из глобального списка — autocomplete; из контекста садика — pre-filled)
   - Plan code (`standard`, `pro`, `enterprise`)
   - Billing period (`monthly` / `yearly`)
   - Amount (decimal, в `KZT`)
   - Started at (date)
   - Status: `trial` (если пробный период), `active` (если сразу платный)
3. `POST /saas/saas-subscriptions` → 201 → toast → invalidate.

**Result:** платформа знает, сколько kg должен платить и когда.

**Note:** backend BP §4 описывает биллинг **внутри садика** (родители → садик). SaaS-подписка садика → Shyraq — отдельный биллинг. В backend есть таблица `saas_subscriptions`, но cron на её billing не реализован — выставление счетов садикам от платформы **выполняется вручную** (super_admin сортирует `/subscriptions` по `next_billing_at` и отправляет счета off-platform). Будущая автоматизация — см. [`OPEN_QUESTIONS.md#c1`](OPEN_QUESTIONS.md#c1-биллинг-садиков-от-платформы-shyraq--open).

### 3.2 Изменение статуса подписки

**Сценарии:**

| Из | В | Когда |
|---|---|---|
| `trial` | `active` | Пробный период завершён, садик подписал контракт |
| `active` | `suspended` | Садик задерживает платёж, ставим на паузу (но не deactivate) |
| `suspended` | `active` | Садик заплатил — возобновляем |
| `active` / `suspended` | `cancelled` | Контракт расторгнут (см. BP §2.3) |

**Main Flow:**
1. `/kindergartens/:id/subscription` → select "Статус".
2. `PATCH /saas/saas-subscriptions/:id { status, cancelled_at? }`.
3. При `status=cancelled` — frontend автоматически проставляет `cancelled_at=NOW()`.

**Note:** на бэкенде нет автоматики "suspended → деактивировать kg через N дней". Это manual decision super_admin'а.

### 3.3 Просмотр всех подписок (cross-kg)

**Trigger:** super_admin хочет увидеть финансовую картину платформы / готовится к monthly review.

**Main Flow:**
1. `/subscriptions` → таблица `GET /saas/saas-subscriptions`.
2. Колонки: kg name, plan, status, billing_period, amount, started_at, next_billing_at.
3. Фильтры: status, plan_code.
4. Sort: next_billing_at ASC (ближайшие — наверху → можно понять, кому скоро выставлять счёт).

**Frontend UX:**
- Summary в шапке: "Total MRR (active): 2,500,000 KZT" — вычисляется на клиенте суммой amount / (billing_period === 'yearly' ? 12 : 1) по status=active.

---

## 4. Feature Flags Management

**Зачем:** включать/выключать фичи глобально или per-tenant **без релиза**.

**Use cases:**
- Включить `face_id_enabled=true` для пилотного садика, чтобы протестировать стек на ограниченной аудитории.
- Глобально выключить `notifications.story_new=false` если падает push-сервис.
- Дать раннему доступу к новому модулю одному садику: `module.diagnostics_v2=true` per-kg.

### 4.1 Список флагов

**Main Flow:**
1. `/feature-flags` → таблица `GET /saas/feature-flags`.
2. Колонки: scope (`Global` или kg name), key, value (rendered JSON snippet), created_at.
3. Фильтры: scope (`global` / `kindergarten:<id>`), key (search).

### 4.2 Создание / обновление флага

**Main Flow:**
1. Жмёт "Новый флаг".
2. Form:
   - Scope: radio "Global" / "Kindergarten" → если Kindergarten, autocomplete kg
   - Key: text input (е.g. `face_id_enabled`)
   - Value: JSON textarea (default `true`) с client-side `JSON.parse` валидацией. Можно добавить "simple toggle" mode для boolean values.
3. `POST /saas/feature-flags` (upsert по `(kindergarten_id, key)`).

**Note:** unique constraint = `(kindergarten_id, key)`. Если флаг с таким key + scope уже существует → backend обновляет `value` (без 409). Frontend показывает соответственно "Создан" или "Обновлён".

### 4.3 Удаление флага

**Main Flow:**
1. В таблице — row action "Удалить" → confirmation.
2. `DELETE /saas/feature-flags/:id`.

**Effect:** после удаления флага backend поведение возвращается к default (определённому в коде).

---

## 5. Operational Cron Triggers

Ручные триггеры backend cron'ов. Нужны когда:
- Автоматический cron упал (deploy, OOM, network issue).
- Нужно догнать пропущенный период (backfill).
- Тестовая прогонка после релиза.
- Demo на встрече.

### 5.1 Monthly Billing Run

**Trigger:** автоматический cron `billing:invoice-generate` крутится 1-го числа в 02:00 Asia/Almaty (BullMQ repeatable). Должен сгенерить invoices родителям для всех `tariff_assignments` всех активных садиков.

**Backend reference:** [`endpoints.md §5.1`](endpoints.md#51-post-saasbillingmonthly-run-ежемесячный-invoice-generation), backend BP §4 "Дополнения (архитектурные)".

**Когда дёргать вручную:**
- Cron упал → super_admin видит мониторинг алерт → запускает вручную с `period_start=2026-06-01`.
- Нужно догнать пропущенный месяц.
- Тестовая прогонка после релиза тарифной системы.

**Main Flow:**
1. super_admin открывает `/operations/billing`.
2. Карточка "Monthly Invoice Generation":
   - Date picker (только первое число).
   - Optional select садика.
   - Кнопка "Запустить" → confirmation: "Сгенерировать инвойсы за июнь 2026 для всех активных садиков? Может создать сотни инвойсов."
3. `POST /saas/billing/monthly-run` (synchronous, может занять минуту+).
4. Loading state с пульсирующим индикатором.
5. После — карточка с summary:
   - `kindergartens_processed: 42`
   - `invoices_created: 156`
   - `skipped_already_generated: 12`

**Idempotent:** повторный запуск с тем же `period_start` пропустит уже-созданные инвойсы (через `pg_advisory_xact_lock` + проверку `existsAnyForPeriod`).

### 5.2 Discount Expire Run

**Trigger:** автоматический cron `discount:expire` (`0 3 * * *` Almaty) переводит `custom_discounts.status='active' → 'expired'` для тех, у кого `valid_until < NOW()`.

**Когда вручную:** ручной cleanup после массовой акции; demo.

**Main Flow:**
1. `/operations/billing` → карточка "Discount Expire".
2. Optional select садика.
3. Кнопка "Запустить" → `POST /saas/billing/discount-expire-run`.
4. Toast `Скидки закрыты: 7`.

### 5.3 Overdue Invoice Run

**Trigger:** автоматический cron (`0 3 * * *` Almaty, gated `BILLING_OVERDUE_CRON != 'disabled'`) переводит `invoices.status='pending'|'partial' → 'overdue'` для просроченных.

**Когда вручную:** backfill пропущенного дня; demo; форс перевод после grace-периода.

**Main Flow:**
1. `/operations/billing` → карточка "Overdue Invoice Sweep".
2. Optional `now` override (для бэкфила).
3. `POST /saas/billing/overdue-run` → 202 Accepted (async).
4. Toast "Задача поставлена в очередь" (без ожидания результата).

### 5.4 Birthday Generation Run

**Trigger:** автоматический cron `birthday-generation` (`0 7 * * *` Almaty) создаёт `content_posts` (type=`birthday`) для именинников.

**Когда вручную:** cron упал в 7 утра — super_admin запускает в 9 утра; backfill за пропущенный день; demo.

**Main Flow:**
1. `/operations/content` → карточка "Birthday Posts".
2. Optional `date` (default — сегодня в Almaty).
3. Optional kg.
4. `POST /saas/content/birthday-run` → summary `posts_created: 3, posts_skipped: 2`.

**Idempotent:** пропускает если пост с `metadata.child_id = X` за эту дату уже есть.

### 5.5 Story Cleanup Run

**Trigger:** автоматический cron `story-cleanup` (ежечасно) удаляет `group_stories.expires_at <= NOW()` + `FileStoragePort.delete(media_url)`.

**Когда вручную:** срочный cleanup из-за overflow storage; demo cleanup после теста.

**Main Flow:**
1. `/operations/content` → карточка "Story Cleanup".
2. Optional kg.
3. `POST /saas/content/story-cleanup-run` → summary `deleted_count: 14`.

### 5.6 Publish Scheduled Posts Run

**Trigger:** автоматический cron `content-publish` (каждые 5 минут) переводит `content_posts.status='scheduled' → 'published'` для `scheduled_for <= NOW()`.

**Когда вручную:** срочно опубликовать (cron упал, посты задержались); demo.

**Main Flow:**
1. `/operations/content` → карточка "Publish Scheduled".
2. Optional kg.
3. `POST /saas/content/publish-scheduled-run` → summary `published_count: 8`.

### 5.7 Weekly Schedule + Meal Rollout

**Trigger:** автоматический cron `schedule:weekly-rollout` (каждое воскресенье 23:00 Almaty) для каждого активного садика копирует расписание занятий + меню питания со текущей недели на следующую.

**Когда вручную:**
- Cron упал в воскресенье вечером — super_admin запускает в понедельник утром.
- Backfill пропущенной недели.
- Тестовая прогонка после релиза schedule-module.
- Demo: "сейчас увидите, как заполняется следующая неделя для 42 садиков".

**Main Flow:**
1. super_admin открывает `/operations/schedule-rollout`.
2. Карточка с описанием: "Копирует расписание и меню с текущей недели на следующую для всех активных садиков. Идемпотентно — пропускает уже скопированные."
3. Date picker "From Monday" (только понедельники, default — текущий).
4. Кнопка "Запустить роллаут" → confirmation.
5. `POST /admin/schedule/week-rollout/run` (synchronous, может занять минуты при 100+ kg).
6. Loading state с пульсирующим индикатором.
7. После — таблица per-kg с раскрывающимися деталями:
   - kg name
   - schedule: copied_groups / skipped_groups / total_events
   - meal: plans_created / plans_skipped
   - error (если был)
8. Totals в шапке.

**Idempotent:** на уровне сервисов (`ScheduleService.copyWeekToNext` + `MealService.copyWeekMenuToNext`).

---

## 6. Lifecycle DLQ Triage (Support workflow)

**Зачем:** BullMQ `lifecycle` queue выполняет процессоры с retry (3 попытки exp-backoff). Failed jobs идут в DLQ и живут 30 дней (`removeOnFail: { age: 30 * 86400 }`). Operator должен:
1. Видеть failed jobs.
2. Диагностировать причину (`failed_reason`).
3. Либо ретрайнуть (если transient — network, downstream service down) либо документировать и оставить.

**Текущие процессоры в `lifecycle` queue:**
- `pro-rata-refund` (B21) — рассчитывает refund при архивировании ребёнка посреди billing-периода.
- (будущие lifecycle-jobs будут наследовать тот же admin-surface)

**Backend reference:** [`endpoints.md §8`](endpoints.md#8-lifecycle-dlq-cross-kg-view--adminlifecyclefailed-jobs).

### 6.1 Просмотр DLQ

**Trigger:** алерт из мониторинга / запрос от admin садика "почему refund не пришёл".

**Main Flow:**
1. super_admin / support открывает `/operations/lifecycle-dlq`.
2. `GET /admin/lifecycle/failed-jobs?limit=50` → таблица.
3. Колонки:
   - Processor (`name`) — e.g. `pro-rata-refund`
   - Kindergarten — JOIN на `kindergartens` по `payload.kindergartenId` для рендера kg name; ID truncated tooltip
   - Failed reason — truncated, click → modal с full stack trace
   - Attempts — `attempts_made` / max
   - Finished on — relative time ("3 hours ago")
   - Action: кнопка "Retry"

**Filters:**
- Processor name (autocomplete)
- Kindergarten (autocomplete)
- Date range (finished_on)

### 6.2 Retry failed job

**Main Flow:**
1. В таблице → click "Retry" на row → confirmation: "Re-enqueue job <id> with same payload?".
2. `POST /admin/lifecycle/failed-jobs/:id/retry`.
3. 202: `{ enqueued: true, job_id: ... }`.
4. Toast "Job ретрайнут. Обновите таблицу через минуту."
5. Backend начинает с attempt=1, не накапливает.

**Edge cases:**
- 404 `lifecycle_job_not_found` — job уже удалён (через 30 дней).
- 409 `lifecycle_job_not_in_failed_state` — job уже active/completed (race condition с auto-retry).

### 6.3 Когда НЕ retrying

Operator должен видеть в failed_reason и решать:
- **Transient (retry):** network timeout, downstream provider 5xx, Redis disconnect.
- **Bug в коде (НЕ retry):** TypeError, missing field. Сначала фиксить код, потом ретрайнуть.
- **Невалидные данные (НЕ retry):** "child not found" — был удалён вручную. Удалить job, не ретрайнуть.

---

## 7. System Health Monitoring

**Зачем:** super_admin / support видит, что платформа жива. Не замена Prometheus/Grafana, а минимальный operator surface.

**Backend reference:** [`endpoints.md §9`](endpoints.md#9-health--system-status).

### 7.1 Dashboard widget

На главной странице `/`:
- Большой pulse-индикатор (green / red): "All systems operational" / "Degraded".
- Sub-indicators: DB (up/down), Redis (up/down).
- TanStack Query `refetchInterval: 30_000` → каждые 30 секунд polling `GET /health/ready`.

### 7.2 Dedicated page `/system-status`

- Текущий статус (`GET /health/ready`)
- История последних 10 проверок (in-memory, не персистится через reload)
- Timestamp последней проверки
- Кнопка "Refresh now" (force `queryClient.invalidateQueries`)

**Note:** на MVP не делаем уведомления "DB upala" — это работа Sentry/Grafana алертов. Frontend — только текущий снапшот для людей.

---

## 8. View-as Kindergarten (MVP placeholder)

**Целевой use case:** admin садика звонит в support: "У меня в Admin Web не отображается ребёнок Айдар". Support открывает kg в SuperAdmin frontend, видит данные глазами админа kg (read-only), диагностирует, говорит решение.

**Сегодня:** на странице `/kindergartens/:id/view-as` отображается placeholder с пояснением "Read-only impersonation недоступно в текущей версии. Для базовой статистики садика используйте Overview / Subscription / Flags tabs."

Подход к реализации, scope данных (какие entities, PII-ограничения) — см. [`OPEN_QUESTIONS.md#b3`](OPEN_QUESTIONS.md#b3-read-only-super-admin-доступ-к-admin-resources--parked) и [`#c4`](OPEN_QUESTIONS.md#c4-view-as-kindergarten--scope-данных--open).

---

## 9. Operational Glossary

| Термин | Значение |
|---|---|
| **Tenant** | Один садик. Изолирован через PostgreSQL Row Level Security + `kindergarten_id` column. |
| **SaaS subscription** | Договор Shyraq ↔ садик (сколько садик платит платформе). НЕ путать с tariff_plan (родитель ↔ садик). |
| **Tariff plan** | Цена услуг садика для родителя (monthly_base, late_pickup, meal_upgrade). Управляется admin'ом kg, не super_admin'ом. |
| **Invoice** | Счёт родителю от садика (через monthly cron). |
| **Custom discount** | Скидка на invoice родителю (праздничная, льготная). Настраивается admin'ом kg, но `discount-expire-run` cron — super_admin trigger. |
| **Feature flag** | Boolean/JSON в `feature_flags`, читается backend кодом для условной активации фичи. |
| **Outbox** | `notification_outbox` — таблица для transactional outbox pattern (B9). Worker poll'ит и шлёт notifications. Если outbox растёт → проблема в worker'е. |
| **Lifecycle queue** | BullMQ queue для long-running per-child процессов (pro-rata refund, archive cascade). |
| **DLQ (Dead Letter Queue)** | Failed jobs из BullMQ queues. Operator surface: `/admin/lifecycle/failed-jobs`. |
| **RLS bypass** | `SET LOCAL app.bypass_rls = 'true'` — снимает Row Level Security для текущей TX. Активируется `@SuperAdminScope()` декоратором. |
| **Outbox poller** | Worker job (`notification-outbox-poll`, каждые 2с) забирает `pending` → fans out → marks `dispatched`/`failed`. |

---

## 10. Сводка экранов SuperAdmin Frontend (MVP scope)

| Route | Цель | Key actions |
|---|---|---|
| `/login` | Аутентификация | Email + password → JWT |
| `/` (dashboard) | Главная: статус платформы, summary | Health widget, MRR, active kgs count, quick links |
| `/kindergartens` | Список садиков | Filter, search, "Новый садик", row → detail |
| `/kindergartens/new` | Онбординг tenant + первого admin'а | Atomic create flow (2 steps) |
| `/kindergartens/:id` | Overview kg | Tabs: Overview / Settings / Subscription / Flags / View-as |
| `/kindergartens/:id/settings` | Редактирование kg | PATCH form |
| `/kindergartens/:id/subscription` | Управление SaaS-подпиской kg | Create/edit subscription |
| `/kindergartens/:id/flags` | Per-kg feature flags | Список + create + delete |
| `/kindergartens/:id/view-as` | Placeholder (см. §8) | Информационная заглушка |
| `/subscriptions` | Cross-kg list подписок | Filter, sort by next_billing_at |
| `/feature-flags` | Все флаги (global + per-kg) | Create / edit / delete |
| `/users` | SaaS-пользователи | Create new super_admin / support |
| `/users/new` | Создать SaaS-пользователя | Form |
| `/users/:id` | Edit SaaS-пользователя | Toggle is_active, change role/password |
| `/operations/billing` | Manual billing cron triggers | 3 cards (monthly, discount-expire, overdue) |
| `/operations/content` | Manual content cron triggers | 3 cards (birthday, story-cleanup, publish-scheduled) |
| `/operations/schedule-rollout` | Manual weekly schedule + meal rollout | Form + per-kg summary |
| `/operations/lifecycle-dlq` | Failed BullMQ jobs DLQ | Table + retry |
| `/system-status` | Detailed health page | DB + Redis status, history |

---

Открытые продуктовые вопросы (биллинг садиков, audit log, RBAC, webhook audit, cron visibility, view-as scope, multi-tenant метрики, i18n KK) — см. [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md), разделы B и C.
