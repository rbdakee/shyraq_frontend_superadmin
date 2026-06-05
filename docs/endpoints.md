# Shyraq SuperAdmin Frontend — Endpoints Reference

Полный референс эндпойнтов backend'а, используемых SuperAdmin frontend'ом. Извлечено из [`backend_shyraq_v2/docs/endpoints.md`](../../backend_shyraq_v2/docs/endpoints.md) и сверено с live Swagger (`http://194.32.140.219:5678/docs-json`) с фокусом на роль `super_admin`.

**База:** все пути относительно `VITE_API_BASE_URL` (например, `https://api.shyraq.kz/api/v1` или `/api/v1` при same-origin через Vite-proxy).

**Каноничные соглашения backend'а:**

- Все ответы — JSON.
- Ошибки — `{ "error": "<code>", "message": "<human readable>", "details"?: {...} }`.
- Timestamps — ISO 8601 (`2026-05-13T08:30:00.000Z`).
- IDs — UUID v4 (`gen_random_uuid()`).
- Локализованные поля — JSONB `{ru: "...", kz: "..."}` (внимание: `kz`, не `kk`; в DTO админ-locale enum'а используется `kk`).
- Денежные суммы — `decimal(12,2)`, валюта `KZT` по умолчанию.
- Все входящие имена полей в DTO — **snake_case** (`access_token`, `kindergarten_id`, `period_start`), **за исключением** `refreshToken` в `/saas/auth/{logout,refresh}` и `fromMonday` в `/admin/schedule/week-rollout/run` (camelCase, см. соответствующие секции).

> **Backend gap notice (важно при планировании UI):** на момент аудита live-Swagger содержит **только** ниже описанные эндпойнты для super-admin surface. Отсутствуют `GET /saas/kindergartens/:id`, `PATCH /saas/kindergartens/:id`, а также целые модули `/saas/saas-subscriptions`, `/saas/feature-flags`, `/saas/users`. Соответствующие страницы фронта (детали садика, подписки, фичефлаги, SaaS-пользователи) не могут быть реализованы до тех пор, пока backend их не выкатит. См. [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — поднять блокирующие вопросы B-серии.

---

## 0. Аутентификация и токены

### 0.1 Контракт

Все `/saas/*` эндпойнты (кроме `/saas/auth/login` и `/saas/auth/refresh` помеченных как `default` security в Swagger) требуют:

```
Authorization: Bearer <access_token>
```

Где `access_token` — JWT HS256, TTL 15 минут (`expires_in: 900`), payload:

```json
{
  "sub": "<saas_user_uuid>",
  "role": "super_admin" | "support",
  "jti": "<uuid>",
  "iat": 1715000000,
  "exp": 1715000900
}
```

**Note:** `kindergarten_id` в SuperAdmin JWT **отсутствует**. Все controllers помечены `@SuperAdminScope()` → `KindergartenScopeGuard` ставит `{ kgId: null, bypass: true }` и interceptor выполняет `SET LOCAL app.bypass_rls = 'true'` → RLS пропускает строки всех садиков.

**Header `x-custom-lang`:** Swagger описывает опциональный заголовок на каждом эндпойнте — для управления языком ошибок/SMS. В Swagger `example: "en"` — это просто плейсхолдер; backend поддерживает `ru` и `kk`, frontend всегда ставит его из текущей i18n-локали (`ru` / `kk`). `en` не используем.

### 0.2 `POST /saas/auth/login` — вход

**Public** (security: default — без Bearer). Rate-limit: 10/час per email (на стороне backend).

**Request:**

```json
{ "email": "admin@shyraq.local", "password": "********" }
```

**Validation:**

- `email` — формат `email` (Swagger `format: email`).
- `password` — string, minLength 8.

**Response 200** (`SuperAdminAuthResponseDto`):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4...e8f90",
  "token_type": "Bearer",
  "expires_in": 900,
  "pending_role_select": false,
  "roles": [{ "role": "super_admin", "kindergarten_id": null, "group_id": null }]
}
```

> Поле `kindergartens[]`, которое раньше было в нашем доке, **не возвращается** Swagger'ом. Не использовать.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | validation | Невалидный email / password короче 8 chars |
| 401 | `invalid_credentials` | User не найден / wrong password / `is_active=false` (одинаковый код для всех — anti-enumeration) |

**Notes:**

- Lookup в `saas_users WHERE email=? AND is_active=true`, проверка `bcrypt.compare(password, password_hash)`.
- Refresh-токен пишется в `saas_refresh_tokens` (отдельная таблица от обычных users), TTL `REFRESH_TOKEN_TTL_DAYS` (default 30).

### 0.3 `POST /saas/auth/refresh` — ротация

**Public** (security: default).

**Request:**

```http
POST /saas/auth/refresh
Content-Type: application/json

{ "refreshToken": "a1b2c3d4...e8f90" }
```

> **Внимание:** имя поля **camelCase `refreshToken`** (а не `refresh_token` как в response). Длина — ровно 64 символа (`minLength: 64`, `maxLength: 64`).

**Response 200:** идентична `/login` (`SuperAdminAuthResponseDto`) — новая пара токенов.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 401 | `invalid_refresh` | Refresh неизвестен, истёк или отозван |

**Алгоритм backend'а (single transaction):**

1. Lookup `saas_refresh_tokens WHERE token_hash = SHA256(input)`.
2. Проверка `revoked_at IS NULL AND expires_at > NOW()`.
3. `UPDATE … SET revoked_at = NOW()`.
4. `INSERT` нового refresh со свежим `token_hash`.

> Старый jti в blocklist помещается best-effort при logout, не на refresh (Swagger не описывает access-в-Authorization для refresh).

### 0.4 `POST /saas/auth/logout` — выход

**Bearer-protected.**

**Request:**

```json
{ "refreshToken": "a1b2c3d4...e8f90" }
```

> **camelCase `refreshToken`**, ровно 64 chars. **Обязательное поле** (Swagger required). В отличие от прежнего нашего доко — `refreshToken` нельзя опускать.

**Response:** `204 No Content`.

Backend ревокирует именно эту запись `saas_refresh_tokens` и добавляет current `jti` в Redis blocklist на остаток access-TTL.

**Errors:** 401 (Bearer missing/invalid/revoked).

**Frontend flow:**

1. `POST /saas/auth/logout` (body: текущий refresh из in-memory storage).
2. Wipe `lib/token-storage`.
3. `queryClient.clear()`.
4. Redirect `/login`.

### 0.5 Identity / «текущий пользователь» — **нет super-admin эндпоинта**

> ⛔ **`GET /users/me` НЕ использовать под супер-админским токеном.** Это shared-identity эндпоинт обычного приложения (parent/staff/admin), резолвится из выбранной app-роли. Супер-админский JWT app-роли не имеет → эндпоинт всегда отдаёт `403 Forbidden` (openapi: `pending_role_select`). Рефреш токена не лечит.

**Super-admin identity на фронте собирается БЕЗ сетевого запроса:**

- `email` — из формы `/saas/auth/login` (что ввёл оператор).
- `role` — из `SuperAdminAuthResponseDto.roles[0].role` (login response).
- оба кладутся в persisted `sessionStore` (Zustand `persist` → localStorage) → переживают hard refresh.
- `full_name` — **недоступно** (нет ни в JWT, ни в `SuperAdminAuthResponseDto`). UI показывает email + role; инициалы аватара — из email.

Расширение `SuperAdminAuthResponseDto` полем `full_name` (+`email`) — открытый backend-ask [`OPEN_QUESTIONS.md#b18`](OPEN_QUESTIONS.md#b18-super-admin-identity-endpoint--usersme-403-backend-dto-gap--open). До его реализации отдельный `/saas/me` не вводим.

---

## 1. Kindergartens (Tenants) — `/saas/kindergartens`

CRUD над садиками. Из live Swagger (`Kindergartens (SuperAdmin)` tag) + `schema.dbml#L235-248`.

> **Backend scope today:** доступны `GET /saas/kindergartens` (список), `POST /saas/kindergartens` (atomic bootstrap), `POST /saas/kindergartens/{id}/archive`, `POST /saas/kindergartens/{id}/restore`, `POST /saas/kindergartens/{id}/admin/invite`. **Нет** `GET /saas/kindergartens/{id}` (детали), **нет** `PATCH /saas/kindergartens/{id}` (редактирование настроек), **нет** `DELETE /saas/kindergartens/{id}` (заменён на `/archive`). См. backend gap notice выше.

### 1.1 `GET /saas/kindergartens` — список

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `plan` | string | Фильтр по plan code (например, `standard`) |
| `is_active` | boolean | `true`/`false` |
| `archived` | boolean | `true` → только архивные; `false` → только активные. Если опущен — возвращает все |
| `name_search` | string | Case-insensitive partial match по name |
| `limit` | number (default 50) | Размер страницы |
| `offset` | number (default 0) | Offset-based pagination |

> **Внимание:** в Swagger пагинация **offset-based** (`limit` + `offset` + `total`), а не cursor-based. Параметр `cursor` и `next_cursor` из старого нашего доко отсутствуют.

**Response 200** (`KindergartenListResponseDto`):

```json
{
  "items": [
    {
      "id": "7c2c2b6a-1a2b-4c3d-9e8f-0a1b2c3d4e5f",
      "name": "Солнышко",
      "slug": "solnyshko",
      "address": "Алматы, ул. Абая, 1",
      "phone": "+77272221100",
      "plan": "standard",
      "settings": {
        /* jsonb — см. §1.4 */
      },
      "is_active": true,
      "archived_at": null,
      "created_at": "2026-04-24T10:00:00.000Z",
      "updated_at": "2026-04-24T10:00:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

> Поле `archived_at` — ISO timestamp; `null` для активных. `address` и `phone` — nullable.

**Errors:** 401 / 403.

### 1.2 `POST /saas/kindergartens` — создать тенанта (atomic bootstrap)

**Critical operation.** Один request-scoped transaction: создаётся `kindergartens` + находится-или-создаётся `users` (по `admin.phone`) + создаётся `staff_members(role=admin, is_active=true)`. После commit — best-effort welcome-SMS через `SmsPort`.

**Request** (`CreateKindergartenDto`):

```json
{
  "name": "Солнышко",
  "slug": "solnyshko",
  "address": "Алматы, ул. Абая, 1",
  "phone": "+77272221100",
  "plan": "standard",
  "settings": { "timezone": "Asia/Almaty", "currency": "KZT" },
  "admin": {
    "full_name": "Айгерим Нурланкызы",
    "phone": "+77011112233",
    "locale": "ru"
  }
}
```

**Required fields (Swagger required[]):** `name`, `slug`, `admin`. Поля `address`, `phone`, `plan`, `settings` — опциональны (backend применяет defaults / NULL).

**Validation:**

- `name` — non-empty string.
- `slug` — `/^[a-z0-9-]+$/`, unique. На нарушение формата backend возвращает `invariant_violation` (а не `invalid_slug_format`, см. ниже).
- `phone` — E.164 strict (`/^\+[1-9]\d{1,14}$/`), необязательное.
- `plan` — string, defaults to `standard`.
- `admin.full_name` — required.
- `admin.phone` — required, E.164. Если в `users` уже есть запись с таким phone — переиспользуется тот же `user_id`, привязывается новый `staff_members` к новому kg.
- `admin.locale` — enum `["ru", "kk"]`, optional, defaults to `ru`.

**Response 201** (`CreateKindergartenResponseDto`):

```json
{
  "kindergarten": {
    "id": "7c2c2b6a-...",
    "name": "Солнышко",
    "slug": "solnyshko",
    "address": "Алматы, ул. Абая, 1",
    "phone": "+77272221100",
    "plan": "standard",
    "settings": { "timezone": "Asia/Almaty", "currency": "KZT" },
    "is_active": true,
    "archived_at": null,
    "created_at": "...",
    "updated_at": "..."
  },
  "staff_member": {
    "id": "uuid",
    "kindergarten_id": "uuid",
    "user_id": "uuid",
    "role": "admin",
    "is_active": true,
    "hired_at": "2026-04-28"
  },
  "user": {
    "id": "uuid",
    "phone": "+77011112233",
    "full_name": "Айгерим Нурланкызы",
    "locale": "ru"
  }
}
```

> `staff_member.hired_at` — date-only string, nullable. `user` объект **не содержит** `is_active` / `created_at` (отличие от прежнего нашего доко).

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | `invariant_violation` | Невалидный slug или phone (single error code на оба случая) |
| 401 | — | Bearer missing/invalid/revoked |
| 403 | — | Caller не super_admin/support |
| 409 | `kindergarten_slug_taken` | Slug уже занят |

> Старые наши коды `invalid_slug_format` и `invalid_phone_format` Swagger **не подтверждает** — backend возвращает общий `invariant_violation`. Маппить оба сценария на одну i18n-строку с подсказкой "проверьте slug и телефон", либо парсить `details`/`message`.

**Frontend UX:**

- Двух-step форма: Kindergarten details → Admin contact.
- После 201 — toast "Садик создан. Welcome-SMS отправлен на +7..." + redirect на список (`/kindergartens`), пока нет detail-эндпойнта.
- Объяснить пользователю что admin активируется через OTP-flow.

### 1.3 `POST /saas/kindergartens/:id/admin/invite` — повторная отправка SMS-инвайта

> **TODO(B5):** wire admin invite into KG detail flow — добавить кнопку "Resend invite" на странице деталей kg, как только она появится. Пока — отдельная утилита/dialog в списке.

Используется когда первичный admin потерял устройство или welcome-SMS не дошёл. Best-effort.

**Request** (`InviteAdminDto`):

```json
{ "phone": "+77011112233" }
```

**Validation:** `phone` required, E.164.

**Response 200** (`InviteAdminResponseDto`):

```json
{
  "phone": "+77011112233",
  "kindergarten_id": "7c2c2b6a-...",
  "sent": true
}
```

> `sent: false` означает что SMS-адаптер вернул отказ, но 200 всё равно. UI должен показывать предупреждение, не ошибку.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | `invariant_violation` | Невалидный phone |
| 401 | — | Bearer |
| 403 | — | Не super_admin/support |
| 404 | `kindergarten_not_found` | |
| 409 | `kindergarten_archived` | Нельзя инвайтить в архивный садик |

### 1.4 `POST /saas/kindergartens/:id/archive` — soft-delete

**Backend behavior:** `archived_at = NOW()`, `is_active = false`, bulk-deactivate всех `staff_members` тенанта. **Идемпотентен** — повторный вызов возвращает строку без изменений.

**Request:** body не требуется.

**Response 200** (`KindergartenDto`):

```json
{
  "id": "7c2c2b6a-...",
  "name": "Солнышко",
  "slug": "solnyshko",
  "address": "Алматы, ул. Абая, 1",
  "phone": "+77272221100",
  "plan": "standard",
  "settings": { "timezone": "Asia/Almaty", "currency": "KZT" },
  "is_active": false,
  "archived_at": "2026-05-14T12:00:00.000Z",
  "created_at": "...",
  "updated_at": "..."
}
```

**Errors:** 401 / 403 / 404 `kindergarten_not_found`.

**Frontend UX:** destructive-confirmation dialog с вводом slug садика для подтверждения. После 200 — toast "Садик архивирован".

### 1.5 `POST /saas/kindergartens/:id/restore` — восстановить из архива

**Backend behavior:** `archived_at = NULL`, `is_active = true`. **Staff-rows НЕ восстанавливаются автоматически** — оператор должен вручную реактивировать админа через staff-эндпойнты per-kg admin'а (вне scope SuperAdmin frontend'а сегодня). Идемпотентен для уже активных.

**Request:** body не требуется.

**Response 200** (`KindergartenDto`): тот же формат что и `/archive`, но `is_active=true`, `archived_at=null`.

**Errors:** 401 / 403 / 404 `kindergarten_not_found`.

**Frontend UX:**

- Доступен только для садиков в фильтре `archived=true`.
- Confirmation: "Восстановить садик X? Учётные записи администраторов **не** будут реактивированы автоматически — выполните это в Admin Web вручную."

### 1.6 `kindergartens.settings` — структура JSONB

Свободный JSONB-bag, backend применяет defaults на отсутствующие ключи. Swagger описывает поле как `type: object` без явных properties — структуру держим в общем reference (backend `schema.dbml`):

| Ключ                     | Тип       | Default       | Описание                                    |
| ------------------------ | --------- | ------------- | ------------------------------------------- |
| `timezone`               | string    | `Asia/Almaty` | IANA TZ                                     |
| `currency`               | string    | `KZT`         | ISO 4217                                    |
| `late_pickup_fee_amount` | decimal   | `5000`        | Сумма штрафа за поздний забор               |
| `otp_expiry_seconds`     | int       | `300`         | TTL OTP                                     |
| `prepay_3m_discount`     | decimal % | 0             | Скидка за 3-месячную предоплату             |
| `prepay_6m_discount`     | decimal % | 0             | На 6 месяцев                                |
| `prepay_12m_discount`    | decimal % | 0             | На 12 месяцев                               |
| `payment_grace_days`     | int       | `5`           | Дней после due_date до перехода в `overdue` |
| `fiscal`                 | object    | `{}`          | Конфиг ОФД (только super_admin)             |

> Поскольку `PATCH /saas/kindergartens/:id` сегодня не существует, **редактирование settings из SuperAdmin frontend'а не поддерживается**. На MVP — read-only отображение в списке (если потребуется), редактирование — через Admin Web садика или backend-side утилиту. Поднять в OPEN_QUESTIONS.

### 1.7 `GET / POST /saas/kindergartens/:id/admins` — список / добавление админов садика

Доставлено backend'ом 2026-05-18 (ветка `superadmin/kg-admins`, смержена + задеплоена; live Swagger подтверждён). Источник: [`HANDOFF_TO_FRONTEND_kg-admins.md`](HANDOFF_TO_FRONTEND_kg-admins.md). **Auth (оба):** `Bearer` JWT, `role ∈ {super_admin, support}` (как create/invite/archive). 401 без/невалидный токен; 403 если роль не та.

> **Это НЕ blocker B.8.** Вкладка «Администраторы» имеет свой list-эндпоинт и шипится независимо от всё ещё отсутствующих `GET/PATCH /saas/kindergartens/:id` (overview/settings табы остаются заблокированы — см. [`OPEN_QUESTIONS.md#b8`](OPEN_QUESTIONS.md#b8-kindergarten-detail--settings-endpoints--blocker-)).

#### `GET /saas/kindergartens/:id/admins` — список

- Возвращает staff-членов садика `:id` строго с `role='admin'` (НЕ reception/mentor/specialist).
- Query (опц.): `is_active: boolean`. **Отсутствует → возвращаются ВСЕ** (активные + деактивированные). Фронт по умолчанию шлёт `?is_active=true`.
- **Response 200 — plain array, БЕЗ offset-пагинации** (намеренное исключение из B.1 offset-convention: bounded sub-resource, админов мало). **Не строить пагинацию.**

`KindergartenAdminDto[]` (все поля `required`, часть `nullable`):

```json
[
  {
    "staff_member_id": "e2e2b6a7-…",
    "user_id": "d3e2b6a7-…",
    "full_name": "Айгерим Нурланкызы", // nullable
    "phone": "+77011112233", // nullable
    "locale": "ru", // 'ru'|'kk', nullable
    "is_active": true,
    "hired_at": "2026-04-28", // YYYY-MM-DD | null
    "fired_at": null, // YYYY-MM-DD | null
    "created_at": "2026-04-28T10:00:00.000Z" // ISO-8601
  }
]
```

- **Errors:** 404 `kindergarten_not_found`; 401; 403.

#### `POST /saas/kindergartens/:id/admins` — добавить админа

Реально **создаёт** админа: kg exists/не архивный → find-or-create `users` по phone (имя/locale существующего юзера **не перезаписываются**) → строгий 409-конфликт → `staff_members(role=admin, is_active=true)` → best-effort invite-SMS. **НЕ путать с `§1.3 POST .../admin/invite`** (singular, только шлёт SMS, staff НЕ создаёт).

- **Request** `AddKindergartenAdminDto` (snake_case): `{ "full_name": string (req), "phone": string (req, E.164 ^\+[1-9]\d{1,14}$), "locale"?: "ru"|"kk" (default "ru") }`
- **Response 201** `AddKindergartenAdminResponseDto`:

```json
{
  "kindergarten_id": "7c2c2b6a-…",
  "user": {
    "id": "d3e2b6a7-…",
    "phone": "+77011115566",
    "full_name": "Жанна Серикова",
    "locale": "kk"
  },
  "staff_member": {
    "id": "e2e2b6a7-…",
    "role": "admin",
    "is_active": true,
    "hired_at": "2026-04-28",
    "created_at": "2026-04-28T10:00:00.000Z"
  },
  "invite_sms_sent": true
}
```

> `invite_sms_sent: false` ⇒ админ создан, но SMS не доставлена. UI показывает **warning**, не error (зеркало паттерна `§1.3 invite`).

- **Errors (ДВА разных envelope — фронт-handler обязан уметь оба):**
  - **422** — class-validator (phone/locale) ДО сервиса. Envelope: `{ "status": 422, "errors": { "phone": "invalid_phone_format" } }` → подсветка поля по `errors.<field>`.
  - **400** `invariant_violation` — сервисный `Phone.parse`/`Locale.parse` (практически недостижим если DTO прошёл).
  - **404** `kindergarten_not_found`; **409** `kindergarten_archived`; **409** `admin_already_exists`; **409** `staff_already_exists`; 401; 403. Доменный envelope: `{ statusCode, error: <code>, message }`.

**Контрактные тонкости:**

- Конфликт по паре (kg, user) при **любом** `is_active` → 409. Реактивации деактивированного админа эндпоинта **НЕТ** (оператор делает руками). UI на 409 показывает осмысленное сообщение, **не «retry»**; деактивированную строку видно через фильтр «Все».
- snake_case везде; `locale` enum — `ru|kk` (НЕ `kz`).
- `super_admin` И `support` оба могут вызывать оба эндпоинта (consistency с create/invite/archive).
- Не в scope (новые backend-asks при необходимости): remove/demote админа, реактивация деактивированного.

---

## 2. SaaS Subscriptions — НЕ РЕАЛИЗОВАНО

> Live Swagger **не содержит** ни одного пути `/saas/saas-subscriptions*`. Эндпойнты `GET/POST/PATCH /saas/saas-subscriptions[/:id]` отсутствуют.
>
> **Действие фронта:** не реализовывать страницы `/subscriptions` и `/kindergartens/:id/subscription` до тех пор, пока backend не выкатит модуль. Заблокировать соответствующий батч в `IMPLEMENTATION_PLAN.md`. Поднять в OPEN_QUESTIONS как блокер B-серии.

---

## 3. Feature Flags — НЕ РЕАЛИЗОВАНО

> Live Swagger **не содержит** ни одного пути `/saas/feature-flags*`.
>
> **Действие фронта:** не реализовывать страницы `/feature-flags` и `/kindergartens/:id/flags` до выкатки backend-модуля. Заблокировать в `IMPLEMENTATION_PLAN.md`. Поднять в OPEN_QUESTIONS.

---

## 4. SaaS Users — НЕ РЕАЛИЗОВАНО

> Live Swagger **не содержит** ни одного пути `/saas/users*`. Управление учётками `super_admin` / `support` сегодня делается напрямую в БД (seed) — UI-эндпойнтов нет.
>
> **Действие фронта:** не реализовывать страницы `/users`, `/users/new`, `/users/:id` до выкатки backend-модуля. Заблокировать в `IMPLEMENTATION_PLAN.md`. Поднять в OPEN_QUESTIONS.

---

## 5. Billing Operations (Manual triggers) — `/saas/billing/*`

Ручные триггеры billing-cron'ов. Все три — **async** (BullMQ), отвечают `202` с `job_id` сразу после enqueue.

### 5.1 `POST /saas/billing/monthly-run` — ежемесячный invoice generation

**Bearer-protected** (super_admin / support).

**Request:**

```json
{
  "kindergarten_id": "00000000-0000-0000-0000-000000000001",
  "period_start": "2026-06-01"
}
```

> Оба поля **опциональны и nullable** в Swagger. Однако:
>
> - Если `kindergarten_id` передан — backend сегодня возвращает **400** (single-kg trigger отложен на B22 backend). Поэтому фронт **должен опускать** это поле и запускать только cross-tenant прогон.
> - `period_start` — ISO date `YYYY-MM-DD`, **должно быть** первым числом месяца. Если опущено — backend подставляет первое число текущего месяца.

**Response 202:**

```json
{
  "job_id": "billing:monthly-run:2026-06-01",
  "status": "enqueued"
}
```

> Ответ всегда `202` (а не `200` как в прежнем нашем доко) и **не содержит** агрегированных счётчиков (`invoices_created`, etc.) — процесс асинхронный. Прогресс/итоги доступны только в worker-логах. Это критичное расхождение с UX из старого доко.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | validation | Невалидный `period_start`, или передан `kindergarten_id` (single-kg отложен) |
| 401 | — | Bearer |
| 403 | — | Не super_admin/support |

**Frontend UX:**

- Date picker (только первое число месяца).
- Confirmation: "Запустить генерацию инвойсов за {месяц} {год} для всех активных садиков? Процесс асинхронный — следите за результатом в worker-логах."
- После 202 — toast "Задача поставлена в очередь, job_id: {…}". **Не** показывать ложный прогресс — фронт не знает когда worker закончит.
- Поле "Только для одного садика" — **скрыть на MVP** (backend возвращает 400). См. OPEN_QUESTIONS.

### 5.2 `POST /saas/billing/discount-expire-run` — закрытие истёкших custom discounts

**Bearer-protected.**

**Request:**

```json
{ "now": "2026-06-01T03:00:00.000Z" }
```

> `now` — optional ISO-8601 anchor (по умолчанию server now). **Поле `kindergarten_id` Swagger не описывает** — прогон всегда cross-tenant. Backend behavior: `UPDATE custom_discounts SET status='expired' WHERE valid_until < $now`.

**Response 202:**

```json
{
  "job_id": "billing:discount-expire-manual:1717200000",
  "status": "enqueued"
}
```

> Async; прежний наш `expired_count` в ответе **не возвращается**.

**Errors:** 400 validation / 401 / 403.

### 5.3 `POST /saas/billing/overdue-run` — перевод инвойсов в overdue

**Bearer-protected.**

**Request:**

```json
{ "now": "2026-05-13T03:00:00.000Z" }
```

> `now` — optional ISO-8601 anchor (по умолчанию server now). Cross-tenant — нет фильтра по kg.

**Response 202:**

```json
{
  "job_id": "billing:overdue-manual:1717200000",
  "status": "enqueued"
}
```

**Errors:** 400 validation / 401 / 403.

**Frontend UX (общее для §5):**

- Все три — кнопка "Запустить" + опциональный date/datetime input для anchor.
- После 202 — toast "Задача поставлена в очередь" с показом `job_id`. Без ожидания результата.

---

## 6. Content Operations (Manual triggers) — `/saas/content/*`

Ручные триггеры content-cron'ов. Все три — **синхронные** (отвечают 200 со счётчиками).

### 6.1 `POST /saas/content/birthday-run` — генерация поздравлений с ДР

**Bearer-protected** (super_admin / support).

**Request:**

```json
{ "now": "2026-05-07T07:00:00.000Z" }
```

> Только optional `now` (ISO-8601 anchor). **Поля `kindergarten_id` и `date` Swagger не описывает** — это расхождение с прежним нашим доко. Прогон всегда cross-tenant.

**Backend behavior:**

- Идемпотентен — пропускает если `content_posts` с `metadata.child_id = X` за эту дату уже есть.
- Создаёт `content_posts` (type=`birthday`) для каждого ребёнка с совпадением day-of-month у `date_of_birth`.

**Response 200:**

```json
{
  "triggered_at": "2026-05-07T07:00:00.000Z",
  "processed_count": 3,
  "skipped_count": 1,
  "kindergartens_processed": 5
}
```

> Унифицированный формат: `processed_count` + `skipped_count` (вместо прежних `posts_created` / `posts_skipped`).

**Errors:** 400 validation / 401 / 403.

### 6.2 `POST /saas/content/story-cleanup-run` — очистка истёкших stories

**Bearer-protected.**

**Request:**

```json
{ "now": "2026-05-07T07:00:00.000Z" }
```

> Только optional `now`. Cross-tenant.

**Backend behavior:** DELETE `group_stories WHERE expires_at <= $now` + best-effort `FileStoragePort.delete(media_url)` для каждого.

**Response 200:**

```json
{
  "triggered_at": "2026-05-07T07:00:00.000Z",
  "processed_count": 14,
  "skipped_count": 0,
  "kindergartens_processed": 5
}
```

> Удалённые сторис маппятся в `processed_count` (а не `deleted_count`).

**Errors:** 400 validation / 401 / 403.

### 6.3 `POST /saas/content/publish-scheduled-run` — публикация отложенных постов

**Bearer-protected.**

**Request:**

```json
{ "now": "2026-05-07T07:00:00.000Z" }
```

> Только optional `now`. Cross-tenant.

**Backend behavior:** UPDATE `content_posts SET status='published' WHERE status='scheduled' AND scheduled_for <= $now`.

**Response 200:**

```json
{
  "triggered_at": "2026-05-07T07:00:00.000Z",
  "processed_count": 8,
  "skipped_count": 0,
  "kindergartens_processed": 5
}
```

**Errors:** 400 validation / 401 / 403.

---

## 7. Schedule Weekly Rollout — `/admin/schedule/week-rollout/run`

**Auth:** `super_admin` only (per-kg admin использует другие schedule-эндпойнты для своего kg).

**Что это делает:** копирует расписание занятий + меню питания со текущей недели на следующую для **всех активных садиков**. Cron `schedule:weekly-rollout` крутится каждое воскресенье 23:00 Almaty; этот эндпойнт — ручной триггер.

### 7.1 `POST /admin/schedule/week-rollout/run`

**Request** (`RunWeeklyRolloutDto`):

```json
{ "fromMonday": "2026-04-27" }
```

> **camelCase `fromMonday`** (а не `from_monday` как в прежнем нашем доко). Optional ISO date понедельника. Если опущен — backend берёт **предыдущий** понедельник в Asia/Almaty (а не текущий — расхождение с прежним нашим доко).

**Response 200** (`RolloutSummaryResponseDto`):

```json
{
  "fromMonday": "2026-04-27",
  "source": "manual",
  "kindergartens": [
    {
      "kindergartenId": "f1a2b3c4-...",
      "name": "Demo Kindergarten",
      "schedule": { "copiedGroups": 3, "skippedGroups": 1, "totalEvents": 24 },
      "meal": { "plansCreated": 5, "plansSkipped": 0 },
      "error": null
    }
  ],
  "totals": {
    "kindergartens": 5,
    "copiedGroups": 12,
    "skippedGroups": 3,
    "totalEvents": 90,
    "plansCreated": 24,
    "plansSkipped": 1,
    "errors": 0
  }
}
```

> Все ключи **camelCase** (`kindergartenId`, `copiedGroups`, `plansCreated`, `totalEvents`, `errors`). В прежнем нашем доко были snake_case — фронт должен использовать camelCase. `error` в per-kg item — string или null (первая ошибка).

**Backend идемпотентен:** на целевую неделю снапшот/meal_plan уже есть — пропускает.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | validation | |
| 401 | — | Bearer |
| 403 | — | Caller не super_admin |
| 422 | `invalid_date_range` | `fromMonday` не валидная ISO дата |
| 429 | `too_many_requests` | Превышен rate-limit на manual rollout |

**Frontend UX:**

- Date picker (только понедельники).
- Default: предыдущий понедельник (соответствует backend default).
- Loading state с прогрессом — запрос синхронный, может занять минуты при 100+ садиках.
- После — таблица с per-kg результатом, разворачиваемая для деталей.
- Обрабатывать `429` отдельным toast'ом "Слишком частые запуски, подождите".

---

## 8. Lifecycle DLQ (Cross-kg view) — `/admin/lifecycle/failed-jobs`

Failed-jobs из BullMQ `lifecycle` queue (pro-rata refund processor B21 и будущие lifecycle-jobs).

Auth: super_admin видит **все** kg; per-kg admin — только свои (фильтр по `payload.kindergartenId`).

### 8.1 `GET /admin/lifecycle/failed-jobs`

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `limit` | number (default 50, max 200) | Размер страницы (BullMQ getFailed window) |
| `cursor` | string | **Opaque base64 cursor**, возвращённый предыдущим вызовом. Пропустить на первой странице |

> Тип `cursor` — **string** (opaque base64), а не `int` offset как в прежнем нашем доко.

**Response 200** (`ListLifecycleFailedJobsResponseDto`):

```json
{
  "items": [
    {
      "id": "12345",
      "name": "lifecycle:pro-rata-refund",
      "payload": {
        "kindergartenId": "550e8400-e29b-41d4-a716-446655440000",
        "childId": "550e8400-e29b-41d4-a716-446655440001",
        "archivedAt": "2026-05-12T14:30:00.000Z"
      },
      "failed_reason": "ChildNotYetArchivedError: child not yet archived (status=active)",
      "attempts_made": 3,
      "timestamp": 1747061400000,
      "finished_on": 1747061820000
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjUwfQ=="
}
```

> Ключевые отличия от прежнего нашего доко:
>
> - `name` имеет префикс `lifecycle:` (например, `lifecycle:pro-rata-refund`, не просто `pro-rata-refund`).
> - `failed_reason` — **string или null** (Swagger маркирует nullable).
> - `finished_on` — **number или null**.
> - `next_cursor` — **string** (base64), nullable.
> - `payload` использует camelCase ключи (`kindergartenId`, `childId`, `archivedAt`) — это сырой `job.data`.

### 8.2 `POST /admin/lifecycle/failed-jobs/:id/retry`

Re-enqueue в `lifecycle` queue с тем же payload.

**Request:** body не требуется (Swagger описывает пустой `application/json`).

**Response 202** (`RetryLifecycleFailedJobResponseDto`):

```json
{ "enqueued": true, "job_id": "12345" }
```

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 401 | — | Bearer missing/invalid/revoked |
| 403 | `forbidden` | Per-kg admin к чужому kg (super_admin не задевает) |
| 404 | `lifecycle_job_not_found` | Job с этим id не существует в BullMQ |
| 409 | `lifecycle_job_not_in_failed_state` | Job уже completed/active/delayed |
| 429 | — | Rate-limit auth gateway |

**Frontend UX:**

- DataTable с фильтрами по `name` (processor type). Per-kg фильтр **не поддерживается query-param'ом** на backend сегодня — фильтровать клиентски через `payload.kindergartenId` после fetch.
- Колонки: name, kg name (JOIN на kindergartens по `payload.kindergartenId` через client-side lookup), failed_reason (truncated, click → modal), attempts_made, finished_on.
- Кнопка `Retry` в каждой строке + confirmation.

---

## 9. Health & System Status

Публичные (без auth, security: default) — но мы дёргаем из админки для дашборда.

### 9.1 `GET /health` — liveness/version

**Response 200** (`HealthStatusDto`):

```json
{
  "status": "ok",
  "version": "0.0.1",
  "uptime_seconds": 12.345,
  "timestamp": "2026-04-28T11:48:00.000Z"
}
```

> Расхождение с прежним нашим доко: возвращается **больше полей** — `version`, `uptime_seconds`, `timestamp` (а не только `{status, ts}`). `status` — enum `["ok","degraded"]`.

Не дёргает БД/Redis.

### 9.2 `GET /health/ready` — readiness

**Response 200** (`HealthReadyDto`):

```json
{
  "status": "ok",
  "checks": { "db": "up", "redis": "up", "kaspi": "up" },
  "kaspi_detail": { "build": "1071", "checked_at": "2026-06-04T10:00:00.000Z" }
}
```

- `checks.db` / `checks.redis` — enum `["up","down"]`.
- `checks.kaspi` — enum `["up","down","unknown"]` (K9, добавлено 2026-06-05). `up` = текущий билд принят гейтом, `down` = Kaspi блокирует (`OldVersionToUpdate`), `unknown` = cron-проба ещё не отрабатывала. **`kaspi=down` НЕ роняет top-level `status`** (остаётся `ok`) — это информационный сигнал, а не readiness-failure.
- `kaspi_detail` — опционально (`{ build, checked_at }`), появляется после первой cron-пробы. Последний кэшированный снапшот версионного гейта. См. [§13](#13-kaspi-config--version-gate--saaskaspi).

> Swagger декларирует только `200` для этого пути; backend код может возвращать `503` при degraded — фронт должен принимать оба и читать `status`. Поднять уточнение в OPEN_QUESTIONS если важно.

**Frontend UX:**

- Дашборд: pulse-indicator (green/red) для DB и Redis. Polling каждые 30 секунд через TanStack Query `refetchInterval: 30_000`.
- Отдельная страница `/system-status` с историей последних 10 проверок (in-memory state, не персистится). Добавить третью строку — `Kaspi gate` (green `up` / red `down` / grey `unknown`) — читая `checks.kaspi`; `down` не делает общий статус degraded.
- Показывать `version` и `uptime_seconds` в footer / системной плашке.

---

## 10. View-as Kindergarten (placeholder)

**Цель:** super_admin может открыть kg и увидеть данные (дети, группы, инвойсы) в read-only режиме — для support-задач.

**Backend сегодня покрывает:**

- `GET /admin/lifecycle/failed-jobs` — cross-kg для super_admin'а (см. §8).

**Read-only доступ к остальным `/admin/*` resources** (дети, группы, инвойсы, …) на стороне backend не реализован, **и `GET /saas/kindergartens/:id` тоже отсутствует** — даже базовая overview-страница садика недоступна. Frontend держит `/kindergartens/:id/view-as` как placeholder с информационным сообщением. Подход к реализации, scope данных, PII-ограничения — см. [`OPEN_QUESTIONS.md#b3`](OPEN_QUESTIONS.md#b3-read-only-super-admin-доступ-к-admin-resources--parked) и [`#c4`](OPEN_QUESTIONS.md#c4-view-as-kindergarten--scope-данных--open).

---

## 11. Error code reference (cross-endpoint)

Общие коды backend'а, которые фронт ловит и маппит в i18n. Сверены с live Swagger.

| HTTP | `error`                             | Контекст                                                                                                                                  |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 400  | `invariant_violation`               | DTO: невалидный slug, phone, или общий доменный invariant в kindergartens / invite                                                        |
| 400  | validation                          | Любая class-validator ошибка (поля в `details`)                                                                                           |
| 401  | `invalid_credentials`               | `/saas/auth/login`                                                                                                                        |
| 401  | `invalid_refresh`                   | `/saas/auth/refresh`                                                                                                                      |
| 401  | `invalid_token`                     | JWT битый/expired                                                                                                                         |
| 401  | `token_revoked`                     | JWT `jti` в blocklist                                                                                                                     |
| 403  | `forbidden`                         | Per-kg admin к чужому kg (`/admin/lifecycle/...`)                                                                                         |
| 403  | —                                   | Caller не super_admin/support (без явного error-code, generic 403)                                                                        |
| 404  | `kindergarten_not_found`            |                                                                                                                                           |
| 404  | `lifecycle_job_not_found`           |                                                                                                                                           |
| 409  | `kindergarten_slug_taken`           |                                                                                                                                           |
| 409  | `kindergarten_archived`             | invite / add-admin в архивный kg                                                                                                          |
| 409  | `admin_already_exists`              | `POST /saas/kindergartens/:id/admins`: у юзера уже admin-строка в этом kg                                                                 |
| 409  | `staff_already_exists`              | `POST /saas/kindergartens/:id/admins`: у юзера уже non-admin staff-строка в этом kg                                                       |
| 409  | `lifecycle_job_not_in_failed_state` |                                                                                                                                           |
| 422  | `invalid_date_range`                | `/admin/schedule/week-rollout/run`: невалидный `fromMonday`                                                                               |
| 422  | `invalid_phone_format`              | `POST /saas/kindergartens/:id/admins`: class-validator phone/locale — envelope `{ status, errors: { <field>: <constraint> } }` (см. §1.7) |
| 429  | `too_many_requests`                 | rate-limit на manual rollout                                                                                                              |
| 429  | `rate_limit`                        | Generic rate-limit на auth gateway                                                                                                        |
| 503  | `service_unavailable`               | `/health/ready` если DB/Redis down (не подтверждено Swagger'ом, проверить в коде backend'а)                                               |

> Прежние коды `invalid_slug_format`, `invalid_period_start`, `email_already_taken`, `pending_role_select`, `otp_rate_limit` — **в Swagger live не подтверждены**. Часть из них (например, `email_already_taken`) относилась к несуществующим эндпойнтам (`/saas/users`). **Исключение:** `invalid_phone_format` теперь подтверждён как 422-field-constraint для `POST /saas/kindergartens/:id/admins` (§1.7) — приходит в envelope `{ status, errors: { phone } }`, маппится в текст поля, не в общий toast.

Маппинг → `src/locales/<lang>/errors.json` ключ `<error_code>`. Fallback — `unknown_error` с показом raw `message` из ответа.

---

## 12. Frontend ↔ Backend route map (полный)

Сводная таблица: какие routes покрывает SuperAdmin frontend. Жирным помечены routes, у которых backend-эндпойнты **отсутствуют сегодня** — реализация откладывается.

| Frontend route                        | HTTP methods   | Backend endpoints                                                                                     | Примечание                                                                                                       |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/login`                              | POST           | `/saas/auth/login`                                                                                    |                                                                                                                  |
| `/` (dashboard)                       | GET            | `/health`, `/health/ready` + агрегированный счётчик из `/saas/kindergartens?limit=1` (читаем `total`) |                                                                                                                  |
| `/kindergartens`                      | GET            | `/saas/kindergartens`                                                                                 | offset-pagination                                                                                                |
| `/kindergartens/new`                  | POST           | `/saas/kindergartens`                                                                                 |                                                                                                                  |
| **`/kindergartens/:id`**              | —              | — нет endpoint'а                                                                                      | **Заблокировано:** нет `GET /saas/kindergartens/:id` (overview tab)                                              |
| **`/kindergartens/:id/settings`**     | —              | — нет endpoint'а                                                                                      | **Заблокировано:** нет `PATCH /saas/kindergartens/:id`                                                           |
| `/kindergartens/:id/admins`           | GET, POST      | `/saas/kindergartens/:id/admins`                                                                      | **вкладка «Администраторы»** — list (plain array, фильтр `is_active`) + add-модалка. См. §1.7. Независима от B.8 |
| `/kindergartens/:id/archive`          | POST           | `/saas/kindergartens/:id/archive`                                                                     | dialog из списка                                                                                                 |
| `/kindergartens/:id/restore`          | POST           | `/saas/kindergartens/:id/restore`                                                                     | dialog из списка с фильтром archived                                                                             |
| `/kindergartens/:id/admin/invite`     | POST           | `/saas/kindergartens/:id/admin/invite`                                                                | dialog из списка + row-action «переотправить приглашение» во вкладке «Администраторы»                            |
| **`/kindergartens/:id/subscription`** | —              | — нет модуля `/saas/saas-subscriptions`                                                               | **Заблокировано**                                                                                                |
| **`/kindergartens/:id/flags`**        | —              | — нет модуля `/saas/feature-flags`                                                                    | **Заблокировано**                                                                                                |
| **`/kindergartens/:id/view-as`**      | (placeholder)  | —                                                                                                     | informational stub                                                                                               |
| **`/subscriptions`**                  | —              | — нет модуля                                                                                          | **Заблокировано**                                                                                                |
| **`/feature-flags`**                  | —              | — нет модуля                                                                                          | **Заблокировано**                                                                                                |
| **`/users`**                          | —              | — нет модуля `/saas/users`                                                                            | **Заблокировано**                                                                                                |
| **`/users/new`**                      | —              | —                                                                                                     | **Заблокировано**                                                                                                |
| **`/users/:id`**                      | —              | —                                                                                                     | **Заблокировано**                                                                                                |
| `/operations/billing`                 | POST           | `/saas/billing/{monthly-run, discount-expire-run, overdue-run}`                                       | все async (202)                                                                                                  |
| `/operations/content`                 | POST           | `/saas/content/{birthday-run, story-cleanup-run, publish-scheduled-run}`                              | sync (200)                                                                                                       |
| `/operations/schedule-rollout`        | POST           | `/admin/schedule/week-rollout/run`                                                                    | sync (200), camelCase body/response                                                                              |
| `/operations/lifecycle-dlq`           | GET, POST      | `/admin/lifecycle/failed-jobs`, `/admin/lifecycle/failed-jobs/:id/retry`                              | opaque base64 cursor                                                                                             |
| `/system-status`                      | GET            | `/health`, `/health/ready` (polling)                                                                  | `/health/ready` теперь включает `checks.kaspi` + `kaspi_detail` (§9.2)                                           |
| `/system/kaspi`                       | GET, PUT, POST | `/saas/kaspi/config`, `/saas/kaspi/version-probe`, `/health/ready`                                    | Kaspi глобальный конфиг + версионный гейт (§13). `app_build` — строка                                            |

---

Backend-side TODO для разблокировки заблокированных routes (детали садика / settings PATCH / saas-subscriptions / feature-flags / saas-users / single-kg billing trigger) — вынесены в [`OPEN_QUESTIONS.md` раздел B](OPEN_QUESTIONS.md#b-endpoints--backend-api-contracts).

---

## 13. Kaspi config & version gate — `/saas/kaspi`

**Что это.** Глобальный (один на всю платформу, **не** per-садик) конфиг Kaspi-клиента + SMS-free проверка версионного гейта. Kaspi периодически блокирует устаревший **билд** приложения (`OldVersionToUpdate`) — тогда оплата ломается у ВСЕХ садиков сразу. Super-admin чинит это **без передеплоя backend'а**, подняв `app_build`. Гейт смотрит на `app_build`, строку версии (`app_version`) игнорирует.

**Auth:** все три эндпоинта — `bearer` (super_admin / support), как и остальной `/saas/*`. Tag: `SaaS / Kaspi`. Деплой на dev: 2026-06-05.

> ⚠️ `app_build` и `app_version` — **строки**, не числа (`"1077"`, не `1077`). Backend хранит и сравнивает их как строки. Форма редактирования должна слать строку.

### 13.1 `GET /saas/kaspi/config` — текущий конфиг

**Response 200** (`KaspiGlobalConfigResponseDto`) — single-row, все поля `required` (кроме nullable `updated_by`):

```json
{
  "app_version": "4.110.1",
  "app_build": "1076",
  "platform_ver": "18.5",
  "model": "iPhone17,3",
  "brand": "Apple",
  "ua_native": "Kaspi%20Pay/1076 CFNetwork/3826.500.131 Darwin/24.5.0",
  "ua_browser": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  "entrance_url": "https://entrance-pay.kaspi.kz",
  "mtoken_url": "https://mtoken.kaspi.kz",
  "qrpay_url": "https://qrpay.kaspi.kz",
  "updated_by": "00000000-0000-0000-0000-000000000001",
  "updated_at": "2026-06-01T12:00:00.000Z"
}
```

| Поле                                                  | Назначение                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app_build` **(ключевое)**                            | Билд-номер, который смотрит гейт. Поднимаем при `OldVersionToUpdate`.              |
| `app_version`                                         | Косметическая строка версии. На гейт не влияет.                                    |
| `platform_ver`, `model`, `brand`                      | iOS-версия / модель / бренд устройства, уходят в Cookie и тело запроса к Kaspi.    |
| `ua_native`, `ua_browser`                             | User-Agent'ы (нативный Kaspi-app и WebView).                                       |
| `entrance_url`, `mtoken_url`, `qrpay_url`             | Базовые URL Kaspi API (entrance / mtoken / qrpay).                                 |
| `updated_by` (nullable UUID), `updated_at` (ISO-8601) | Кто и когда правил конфиг последним. `updated_by:null` — если ни разу не правился. |

### 13.2 `PUT /saas/kaspi/config` — частичное обновление

**Body** (`UpdateKaspiGlobalConfigDto`) — **все поля опциональны** (partial update), любое подмножество полей из 13.1 (кроме `updated_by`/`updated_at` — их ставит backend). Обычный кейс — только `app_build`:

```json
{ "app_build": "1077" }
```

**Response 200** — обновлённый `KaspiGlobalConfigResponseDto` (как 13.1). Инвалидирует кэш конфига во всех садиках.

**Ошибки:** `401` (нет/битый токен), `403` (не super_admin/support), `422` (class-validator — поля в envelope, см. §11 / §1.7 для shape).

> ⚠️ **SSRF:** `entrance_url` / `mtoken_url` / `qrpay_url` backend дёргает server-side. Frontend ставит Zod-refinement против внутренних хостов (defense-in-depth, **не** граница безопасности). Authoritative валидация (post-DNS-resolution + DNS-rebinding) — на backend, см. [`OPEN_QUESTIONS.md#b20`](OPEN_QUESTIONS.md#b20-ssrf-backend-валидация-kaspi-url-полей--open-backend-ask).

### 13.3 `POST /saas/kaspi/version-probe` — SMS-free проверка билда

Дёргает Kaspi entrance/init с заданным (или текущим) билдом и смотрит, пустит ли гейт. **SMS не тратит** — можно жать сколько угодно.

**Body** (`KaspiVersionProbeDto`) — оба поля опциональны, по умолчанию берутся текущие из конфига:

```json
{ "app_build": "1077", "app_version": "4.111.0" }
```

**Response 200** (`KaspiVersionProbeResponseDto`):

```json
{ "build": "1077", "accepted": true, "alarm": null }
```

- `build` — какой билд пробили.
- `accepted` — `true` если Kaspi пустил (появился экран ввода телефона); `false` если заблокировал/неожиданный ответ.
- `alarm` (nullable) — присутствует только когда Kaspi явно заблокировал: `"OldVersionToUpdate"`.

**Ошибки:** `401`, `403`, `422`.

> ⚠️ Probe дёргает **реальный** Kaspi entrance API. SMS не шлёт, но это внешний сетевой вызов — не ставить на агрессивный авто-polling. Жмётся вручную по кнопке.

### 13.4 Frontend UX (см. [`DESIGN.md §5.17`](DESIGN.md#517-systemkaspi--kaspi-конфиг--версионный-гейт))

- Экран «Kaspi конфиг» (`/system/kaspi`): текущий `app_build` + индикатор `checks.kaspi` (green `up` / red `down` / grey `unknown`) из `GET /health/ready` + `kaspi_detail` (последняя проба + время).
- Кнопка «Проверить билд» → `version-probe` (без body = текущий билд), показать `accepted` / `alarm`.
- Редактирование `app_build` (и опц. остальных полей) → `PUT /saas/kaspi/config`. Подсказка: «Если Kaspi выдаёт OldVersionToUpdate — подними билд до актуального из App Store (Kaspi Pay iOS) и проверь probe».
- Алерт-баннер если `checks.kaspi='down'`: «Kaspi блокирует текущий билд — оплата не работает у садиков. Обнови app_build». **Полноценного push-алерта суперадмину пока нет** (канала нотификаций для saas-юзеров нет) — мониторим через баннер / `/health/ready`. См. [`OPEN_QUESTIONS.md#b19`](OPEN_QUESTIONS.md#b19-нет-push-канала-для-super-admin-алертов-kaspi-down--open).
