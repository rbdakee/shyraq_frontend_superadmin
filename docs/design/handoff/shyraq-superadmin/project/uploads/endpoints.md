# Shyraq SuperAdmin Frontend — Endpoints Reference

Полный референс эндпойнтов backend'а, используемых SuperAdmin frontend'ом. Извлечено из [`backend_shyraq_v2/docs/endpoints.md`](../../backend_shyraq_v2/docs/endpoints.md) с фокусом на роль `super_admin`.

**База:** все пути относительно `VITE_API_BASE_URL` (например, `https://api.shyraq.kz/api/v1` или `/api/v1` при same-origin).

**Каноничные соглашения backend'а:**
- Все ответы — JSON.
- Ошибки — `{ "error": "<code>", "message": "<human readable>", "details"?: {...} }`.
- Timestamps — ISO 8601 (`2026-05-13T08:30:00.000Z`).
- IDs — UUID v4 (`gen_random_uuid()`).
- Локализованные поля — JSONB `{ru: "...", kz: "..."}` (внимание: `kz`, не `kk`).
- Денежные суммы — `decimal(12,2)`, валюта `KZT` по умолчанию.

---

## 0. Аутентификация и токены

### 0.1 Контракт

Все `/saas/*` эндпойнты (кроме `/saas/auth/login` помеченного `@Public()`) требуют:

```
Authorization: Bearer <access_token>
```

Где `access_token` — JWT HS256, TTL 15 минут, payload:
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

### 0.2 `POST /saas/auth/login` — вход

**Public** (не требует Bearer). Rate-limit: 10/час per email.

**Request:**
```json
{ "email": "admin@shyraq.kz", "password": "********" }
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "3a7f...b2c1",
  "token_type": "Bearer",
  "expires_in": 900,
  "pending_role_select": false,
  "roles": [{ "role": "super_admin", "kindergarten_id": null, "group_id": null }],
  "kindergartens": []
}
```

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 401 | `invalid_credentials` | User не найден / wrong password / `is_active=false` (одинаковый код для всех — anti-enumeration) |
| 429 | `otp_rate_limit` | Превышен лимит 10/час per email |
| 422 | validation | Email не похож на email / пустой password |

**Notes:**
- Lookup в `saas_users WHERE email=? AND is_active=true`, проверка `bcrypt.compare(password, password_hash)`.
- Refresh-токен пишется в `saas_refresh_tokens` (отдельная таблица от обычных users), TTL `REFRESH_TOKEN_TTL_DAYS` (default 30).
- `kindergartens[]` всегда пустой (super_admin не привязан к садику).

### 0.3 `POST /saas/auth/refresh` — ротация

**Public.** Передавать **И** текущий access-токен в `Authorization`, **И** refresh в body — иначе старый access-jti не попадёт в blocklist (best-effort).

**Request:**
```http
POST /saas/auth/refresh
Authorization: Bearer <expiring_access>
Content-Type: application/json

{ "refresh_token": "3a7f...b2c1" }
```

**Response 200:** идентична `/login` — новая пара токенов.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 401 | `invalid_refresh` | Токен отозван (`revoked_at IS NOT NULL`), истёк (`expires_at < NOW()`), или не найден |
| 401 | `invalid_token` | JWT битый/expired (для access в Authorization — best-effort, не блокирует refresh) |

**Алгоритм backend'а (single transaction):**
1. Lookup `saas_refresh_tokens WHERE token_hash = SHA256(input)`.
2. Проверка `revoked_at IS NULL AND expires_at > NOW()`.
3. `UPDATE … SET revoked_at = NOW()`.
4. `INSERT` нового refresh со свежим `token_hash`.
5. После commit: `SET token:blocklist:<old_jti>` в Redis с TTL = `(old_access.exp - NOW())`.

### 0.4 `POST /saas/auth/logout` — выход

**Bearer-protected.**

**Request:**
```json
{ "refresh_token": "3a7f...b2c1" }   // optional
```

Если `refresh_token` передан — ревокируется именно эта запись. Если нет — backend по `user_id` из JWT ревокирует все активные `saas_refresh_tokens` пользователя.

**Response:** `204 No Content`.

Также backend добавляет current `jti` в Redis blocklist на остаток access-TTL.

**Frontend flow:**
1. `POST /saas/auth/logout` (body: текущий refresh).
2. Wipe `lib/token-storage`.
3. `queryClient.clear()`.
4. Redirect `/login`.

---

## 1. Kindergartens (Tenants) — `/saas/kindergartens`

CRUD над садиками. Из backend `endpoints.md §1.2` + `schema.dbml#L235-248`.

### 1.1 `GET /saas/kindergartens` — список

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `plan` | string | Фильтр по `plan` (например, `standard`, `pro`, `enterprise`) |
| `is_active` | boolean | `true`/`false` |
| `search` | string | Поиск по `name` (ILIKE, case-insensitive) |
| `limit` | int (default 50, max 200) | Размер страницы |
| `cursor` | string | Cursor-based pagination |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Солнышко",
      "slug": "sunshine",
      "address": "Алматы, ул. Абая 10",
      "phone": "+77001234567",
      "plan": "standard",
      "is_active": true,
      "settings": { /* jsonb — см. §1.5 */ },
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-05-10T12:30:00Z"
    }
  ],
  "next_cursor": "eyJpZCI6Li4u" | null
}
```

### 1.2 `POST /saas/kindergartens` — создать тенанта (atomic bootstrap)

**Critical operation.** Atomic transaction: создаётся `kindergartens` + находится-или-создаётся `users` (по `admin.phone`) + создаётся `staff_members(role=admin, is_active=true)`. После commit — best-effort welcome-SMS через `SmsPort` (если падает — логирует, не откатывает).

**Request:**
```json
{
  "name": "Солнышко",
  "slug": "sunshine",
  "address": "Алматы, ул. Абая 10",
  "phone": "+77272223344",
  "plan": "standard",
  "settings": {
    "timezone": "Asia/Almaty",
    "currency": "KZT",
    "late_pickup_fee_amount": 5000,
    "otp_expiry_seconds": 300,
    "payment_grace_days": 5
  },
  "admin": {
    "full_name": "Айгерим Касымова",
    "phone": "+77001234567",
    "locale": "ru"
  }
}
```

**Validation:**
- `name` — non-empty string, до 255 chars
- `slug` — `/^[a-z0-9-]+$/`, unique
- `phone` — E.164 strict `/^\+[1-9]\d{1,14}$/`
- `admin.phone` — E.164. Если в `users` уже есть запись с таким phone — переиспользуется тот же `user_id` (имя/locale не перезаписываются), привязывается новый `staff_members` к новому kg
- `plan` — enum (по умолчанию `standard`)

**Response 201:**
```json
{
  "kindergarten": { /* объект как в GET */ },
  "staff_member": {
    "id": "uuid",
    "kindergarten_id": "uuid",
    "user_id": "uuid",
    "role": "admin",
    "is_active": true,
    "created_at": "..."
  },
  "user": {
    "id": "uuid",
    "phone": "+77001234567",
    "full_name": "Айгерим Касымова",
    "locale": "ru",
    "is_active": true,
    "created_at": "..."
  }
}
```

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 400 | `invalid_slug_format` | Slug содержит запрещённые символы |
| 400 | `invalid_phone_format` | phone или admin.phone не E.164 |
| 409 | `kindergarten_slug_taken` | Slug уже занят (DB unique constraint) |
| 422 | validation | Другие DTO-валидации |

**Frontend UX:**
- Длинная форма (5–6 полей kindergarten + 3 поля admin). Разбить на 2 step'а: Kindergarten details → Admin contact.
- После 201 — toast "Садик создан. Welcome-SMS отправлен на +77001234567" + redirect на `/kindergartens/:id`.
- Объяснить пользователю что admin активируется через OTP-flow (не через invite-link).

### 1.3 `GET /saas/kindergartens/:id` — детали

**Response 200:**
```json
{
  "kindergarten": { /* поля как в list */ },
  "subscription": {
    "id": "uuid",
    "plan_code": "standard",
    "status": "active",
    "billing_period": "monthly",
    "amount": "50000.00",
    "started_at": "2026-01-01",
    "next_billing_at": "2026-06-01",
    "cancelled_at": null
  } | null,
  "stats": {
    "children_active": 42,
    "children_archived": 8,
    "staff_active": 12,
    "groups_count": 5,
    "subscription_status": "active"
  }
}
```

**Errors:** 404 `kindergarten_not_found`.

### 1.4 `PATCH /saas/kindergartens/:id` — обновить настройки

**Request (partial update — все поля опциональны):**
```json
{
  "name": "Солнышко Plus",
  "address": "...",
  "phone": "+77272223344",
  "plan": "pro",
  "is_active": true,
  "settings": { /* см. §1.5 */ }
}
```

**Note:** `slug` менять НЕЛЬЗЯ (используется в роутинге, push-кампаниях). Если нужно — создавать новый kg + migration.

**Response 200:** обновлённый объект kindergarten.

**Errors:** 404 `kindergarten_not_found`, 422 validation.

### 1.5 `kindergartens.settings` — структура JSONB

Все опциональны, backend применяет defaults если не задано:

| Ключ | Тип | Default | Описание |
|---|---|---|---|
| `timezone` | string | `Asia/Almaty` | IANA TZ. Используется для cron'ов (rollout, billing). |
| `currency` | string | `KZT` | ISO 4217 |
| `late_pickup_fee_amount` | decimal | `5000` | Сумма штрафа за поздний забор |
| `otp_expiry_seconds` | int | `300` | TTL OTP (login) |
| `prepay_3m_discount` | decimal % | 0 | Скидка за оплату на 3 месяца |
| `prepay_6m_discount` | decimal % | 0 | На 6 месяцев |
| `prepay_12m_discount` | decimal % | 0 | На 12 месяцев |
| `payment_grace_days` | int | `5` | Дней после due_date до перехода в `overdue` |
| `fiscal` | object | `{}` | Конфиг ОФД-провайдера (только super_admin может править) |

### 1.6 `DELETE /saas/kindergartens/:id` — soft-delete

**Backend behavior:** `is_active=false` + cascade-архивация активных сущностей (детей → archived, подписки → cancelled).

**Response 200:** `{ "id": "uuid", "is_active": false }`.

**Frontend UX:** показывать destructive-confirmation с вводом slug садика для подтверждения.

---

## 2. SaaS Subscriptions — `/saas/saas-subscriptions`

Подписки платформы на садики (не путать с tariff_plans, которые — для родителей внутри садика).

Из backend `endpoints.md §1.3` + `schema.dbml#L1335-1347`.

### 2.1 `GET /saas/saas-subscriptions` — список

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `kindergarten_id` | uuid | Фильтр по садику |
| `status` | string | `trial` / `active` / `suspended` / `cancelled` |
| `plan_code` | string | |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "kindergarten_id": "uuid",
      "plan_code": "standard",
      "status": "active",
      "billing_period": "monthly" | "yearly",
      "amount": "50000.00",
      "started_at": "2026-01-01",
      "next_billing_at": "2026-06-01",
      "cancelled_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### 2.2 `POST /saas/saas-subscriptions` — создать подписку

**Request:**
```json
{
  "kindergarten_id": "uuid",
  "plan_code": "standard",
  "billing_period": "monthly",
  "amount": "50000.00",
  "started_at": "2026-06-01",
  "status": "active"
}
```

**Response 201:** subscription object.

**Errors:** 404 `kindergarten_not_found`, 422 validation.

### 2.3 `PATCH /saas/saas-subscriptions/:id` — изменить

**Request (partial):**
```json
{
  "status": "suspended",
  "next_billing_at": "2026-07-01",
  "cancelled_at": "2026-06-15T10:00:00Z"
}
```

**Response 200:** updated subscription object.

**Frontend UX:**
- `status` через select (4 значения).
- При `status=cancelled` — показать confirmation, заполнить `cancelled_at` автоматически.

---

## 3. Feature Flags — `/saas/feature-flags`

Глобальные и per-tenant флаги. `kindergarten_id IS NULL` = глобальный (применяется ко всем).

Из backend `endpoints.md §1.4` + `schema.dbml#L1349-1359`.

### 3.1 `GET /saas/feature-flags` — список

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `kindergarten_id` | uuid \| `null` | Фильтр; `null` для глобальных |
| `key` | string | Фильтр по ключу (`LIKE %key%`) |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "kindergarten_id": "uuid" | null,
      "key": "face_id_enabled",
      "value": true,
      "created_at": "..."
    },
    {
      "id": "uuid",
      "kindergarten_id": null,
      "key": "billing.dunning_strategy",
      "value": { "after_days": [3, 7, 14], "channels": ["push", "sms"] },
      "created_at": "..."
    }
  ]
}
```

**Note:** `value` — JSONB, может быть любым типом (boolean, number, string, object, array).

### 3.2 `POST /saas/feature-flags` — создать/обновить (upsert)

**Request:**
```json
{
  "kindergarten_id": "uuid" | null,
  "key": "face_id_enabled",
  "value": true
}
```

**Backend behavior:** unique index на `(kindergarten_id, key)` — повторный POST с тем же ключом обновляет `value`.

**Response 201** (или 200 при upsert):
```json
{ "id": "uuid", "kindergarten_id": "...", "key": "...", "value": ..., "created_at": "..." }
```

**Frontend UX:**
- Текстовый input для `key` + JSON-textarea для `value` с client-side `JSON.parse` валидацией.
- Toggle "Глобальный / Для конкретного садика" → kindergarten autocomplete.

### 3.3 `DELETE /saas/feature-flags/:id` — удалить

**Response 200:** `{ "id": "uuid", "deleted": true }`.

---

## 4. SaaS Users — `/saas/users`

Управление сотрудниками платформы (super_admin, support). НЕ путать с `users` (родители/staff садиков).

Из backend `endpoints.md §1.5` + `schema.dbml#L1304-1314`.

### 4.1 `GET /saas/users` — список

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `role` | string | `super_admin` / `support` |
| `is_active` | boolean | |
| `search` | string | По email или full_name |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "admin@shyraq.kz",
      "phone": "+77001234567",
      "full_name": "Иван Петров",
      "role": "super_admin",
      "is_active": true,
      "last_login_at": "2026-05-13T08:00:00Z",
      "created_at": "..."
    }
  ]
}
```

### 4.2 `POST /saas/users` — создать

**Request:**
```json
{
  "email": "support@shyraq.kz",
  "phone": "+77001112233",
  "full_name": "Анна Иванова",
  "password": "S3cureP@ss",
  "role": "support"
}
```

**Validation:**
- `email` — RFC 5322, unique
- `password` — минимум 8 chars, рекомендация: 1 буква + 1 цифра + 1 спецсимвол (backend применит `bcrypt.hash(password, 12)` перед сохранением)
- `role` — enum `super_admin` / `support`

**Response 201:** user object без `password_hash`.

**Errors:** 409 `email_already_taken`, 422 validation.

### 4.3 `PATCH /saas/users/:id` — деактивация / смена роли / смена пароля

**Request (все поля опциональны):**
```json
{
  "is_active": false,
  "role": "super_admin",
  "password": "NewP@ss123",
  "full_name": "Новое имя"
}
```

**Response 200:** updated user object.

**Frontend UX:**
- Отдельная кнопка "Сменить пароль" с confirmation + двойным вводом нового.
- Toggle активности с warning что user не сможет логиниться.
- **Нельзя деактивировать самого себя** (проверка на фронте: `if (user.id === currentUser.id) disable`).

---

## 5. Billing Operations (Manual triggers) — `/saas/billing/*`

Ручные триггеры billing-cron'ов. Используется когда: cron упал, бэкфил, тестовая прогонка.

Из backend `endpoints.md §1.6`.

### 5.1 `POST /saas/billing/monthly-run` — ежемесячный invoice generation

**Request:**
```json
{
  "period_start": "2026-06-01",
  "kindergarten_id": "uuid"   // optional — если не задан, обходит все активные kg
}
```

**Validation:**
- `period_start` — обязательно ПЕРВОЕ число месяца (`/^\d{4}-\d{2}-01$/`), иначе 400 `invalid_period_start`.

**Backend behavior:**
- Идемпотентен через `pg_advisory_xact_lock(hashtext(kg_id || period_start))` + проверку `existsAnyForPeriod`.
- Синхронный (без BullMQ) — отвечает после завершения.

**Response 200:**
```json
{
  "triggered_at": "2026-05-13T10:30:00Z",
  "period_start": "2026-06-01",
  "kindergartens_processed": 42,
  "invoices_created": 156,
  "skipped_already_generated": 12
}
```

**Errors:** 400 `invalid_period_start`, 404 `kindergarten_not_found` (если задан `kindergarten_id` и его нет).

**Frontend UX:**
- Date picker (ограничен первым числом).
- Optional select садика (autocomplete).
- Confirmation: "Запустить генерацию инвойсов за июнь 2026 для всех садиков? Это может создать сотни инвойсов."
- Loading state с прогрессом (запрос синхронный, может занять минуту+).
- После — toast с summary.

### 5.2 `POST /saas/billing/discount-expire-run` — закрытие истёкших custom discounts

**Request:**
```json
{ "kindergarten_id": "uuid" }   // optional
```

**Backend behavior:** UPDATE `custom_discounts SET status='expired' WHERE status='active' AND valid_until < NOW()`.

**Response 200:**
```json
{ "triggered_at": "...", "expired_count": 7 }
```

### 5.3 `POST /saas/billing/overdue-run` — перевод инвойсов в overdue

**Request:**
```json
{ "now": "2026-05-13T00:00:00Z" }   // optional override для бэкфила
```

**Backend behavior:**
- Cross-tenant: для каждого активного kg атомарный
  ```sql
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('pending', 'partial')
    AND due_date < $now::date
  RETURNING id, child_id, amount_after_discount, due_date
  ```
  + emit `invoice.overdue` outbox event на каждую перевёрнутую строку.
- Идемпотентен (уже-`overdue` исключаются WHERE-условием).

**Response 202:**
```json
{ "job_id": "uuid", "status": "enqueued" }
```

**Note:** ответ async (202), хотя процессор сам синхронный. UX — toast "Задача поставлена в очередь" без ожидания результата.

---

## 6. Content Operations (Manual triggers) — `/saas/content/*`

Ручные триггеры content-cron'ов. Из backend `endpoints.md §1.7`.

### 6.1 `POST /saas/content/birthday-run` — генерация поздравлений с ДР

**Request:**
```json
{
  "kindergarten_id": "uuid",   // optional
  "date": "2026-05-13"          // optional, default — сегодня в Asia/Almaty
}
```

**Backend behavior:**
- Идемпотентен — пропускает если `content_posts` с `metadata.child_id = X` за эту дату уже есть.
- Создаёт `content_posts` (type=`birthday`) для каждого ребёнка с `date_of_birth.dayMonth() == :date.dayMonth()`.

**Response 200:**
```json
{
  "triggered_at": "...",
  "kindergartens_processed": 5,
  "posts_created": 3,
  "posts_skipped": 2
}
```

### 6.2 `POST /saas/content/story-cleanup-run` — очистка истёкших stories

**Request:**
```json
{ "kindergarten_id": "uuid" }   // optional
```

**Backend behavior:** DELETE `group_stories WHERE expires_at <= NOW()` + `FileStoragePort.delete(media_url)` для каждого.

**Response 200:**
```json
{ "triggered_at": "...", "deleted_count": 14 }
```

### 6.3 `POST /saas/content/publish-scheduled-run` — публикация отложенных постов

**Request:**
```json
{ "kindergarten_id": "uuid" }   // optional
```

**Backend behavior:** UPDATE `content_posts SET status='published' WHERE status='scheduled' AND scheduled_for <= NOW()`.

**Response 200:**
```json
{ "triggered_at": "...", "published_count": 8 }
```

---

## 7. Schedule Weekly Rollout — `/admin/schedule/week-rollout/run`

**Auth:** `super_admin` only (per-kg admin использует другие эндпойнты для своего kg).

Из backend `endpoints.md §2.8.1`.

**Что это делает:** копирует расписание занятий + меню питания со текущей недели на следующую для **всех активных садиков**. Cron `schedule:weekly-rollout` крутится каждое воскресенье 23:00 Almaty; этот эндпойнт — ручной триггер.

### 7.1 `POST /admin/schedule/week-rollout/run`

**Request:**
```json
{ "from_monday": "2026-05-12" }   // optional, ISO date понедельника
```

Если `from_monday` не задан — backend вычисляет понедельник текущей Almaty-недели.

**Response 200:**
```json
{
  "from_monday": "2026-05-12",
  "source": "manual",
  "kindergartens": [
    {
      "kindergarten_id": "uuid",
      "name": "Солнышко",
      "schedule": { "copied_groups": 5, "skipped_groups": 0, "total_events": 145 },
      "meal": { "plans_created": 5, "plans_skipped": 0 }
    },
    { /* ... */ }
  ],
  "totals": {
    "kindergartens": 42,
    "copied_groups": 187,
    "skipped_groups": 23,
    "total_events": 5421,
    "plans_created": 187,
    "plans_skipped": 23,
    "errors": 0
  }
}
```

**Backend идемпотентен:** если на целевую неделю уже есть snapshot/meal_plan — пропускает.

**Frontend UX:**
- Date picker (только понедельники).
- Default: текущий понедельник.
- Loading state с прогрессом — запрос может занять минуты при 100+ садиках.
- После — таблица с per-kg результатом, разворачиваемая для деталей.

---

## 8. Lifecycle DLQ (Cross-kg view) — `/admin/lifecycle/failed-jobs`

Failed-jobs из BullMQ `lifecycle` queue (pro-rata refund processor и будущие lifecycle-jobs).

Из backend `endpoints.md §2.24`. Auth: super_admin видит **все** kg; per-kg admin — только свои.

### 8.1 `GET /admin/lifecycle/failed-jobs`

**Query params:**
| Param | Type | Описание |
|---|---|---|
| `limit` | int (default 50, max 200) | |
| `cursor` | int | Offset для BullMQ `getFailed(start, end)` |

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "pro-rata-refund",
      "payload": { "kindergartenId": "uuid", "childId": "uuid", "archivedAt": "..." },
      "failed_reason": "PaymentProviderError: timeout",
      "attempts_made": 3,
      "timestamp": 1715000000000,
      "finished_on": 1715000060000
    }
  ],
  "next_cursor": 50 | null
}
```

### 8.2 `POST /admin/lifecycle/failed-jobs/:id/retry`

Re-enqueue в `lifecycle` queue с тем же payload.

**Response 202:** `{ "enqueued": true, "job_id": "string" }`.

**Errors:**
| HTTP | `error` | Причина |
|---|---|---|
| 404 | `lifecycle_job_not_found` | Job с этим id не существует |
| 409 | `lifecycle_job_not_in_failed_state` | Job уже completed/active/delayed |
| 403 | `forbidden` | Per-kg admin пытается ретрайнуть чужой kg (super_admin не задевает) |

**Frontend UX:**
- DataTable с фильтрами по `name` (processor type) и `kindergartenId`.
- Колонки: name, kg name (JOIN на kindergartens по `payload.kindergartenId`), failed_reason (truncated, click → modal), attempts, finished_on.
- Кнопка `Retry` в каждой строке + confirmation.

---

## 9. Health & System Status

Из backend `endpoints.md §0.0`. Публичные (без auth) — но мы дёргаем из админки для дашборда.

### 9.1 `GET /health` — liveness

**Response 200:**
```json
{ "status": "ok", "ts": "2026-05-13T08:30:00Z" }
```

Всегда `200` пока процесс жив. Не дёргает БД/Redis.

### 9.2 `GET /health/ready` — readiness

**Response 200** (DB и Redis up):
```json
{ "status": "ok", "checks": { "db": "up", "redis": "up" } }
```

**Response 503** (что-то down):
```json
{ "status": "degraded", "checks": { "db": "up", "redis": "down" } }
```

**Frontend UX:**
- Дашборд: pulse-indicator (green/red) для DB и Redis. Polling каждые 30 секунд через TanStack Query `refetchInterval: 30_000`.
- Отдельная страница `/system-status` с историей последних 10 проверок (in-memory state, не персистится).

---

## 10. View-as Kindergarten (placeholder)

**Цель:** super_admin может открыть kg и увидеть данные (дети, группы, инвойсы) в read-only режиме — для support-задач.

**Backend сегодня покрывает:**
- `GET /saas/kindergartens/:id` — overview + stats (см. §1.3).
- `GET /admin/lifecycle/failed-jobs` — cross-kg для super_admin'а.

**Read-only доступ к остальным `/admin/*` resources** (дети, группы, инвойсы, …) на стороне backend не реализован — frontend держит `/kindergartens/:id/view-as` как placeholder с информационным сообщением. Подход к реализации, scope данных, PII-ограничения — см. [`OPEN_QUESTIONS.md#b3`](OPEN_QUESTIONS.md#b3-read-only-super-admin-доступ-к-admin-resources--parked) и [`#c4`](OPEN_QUESTIONS.md#c4-view-as-kindergarten--scope-данных--open).

---

## 11. Error code reference (cross-endpoint)

Общие коды backend'а, которые фронт ловит и маппит в i18n:

| HTTP | `error` | Контекст |
|---|---|---|
| 400 | `invalid_phone_format` | DTO: phone не E.164 |
| 400 | `invalid_slug_format` | DTO: slug не `^[a-z0-9-]+$` |
| 400 | `invalid_period_start` | `/saas/billing/monthly-run`: не первое число |
| 401 | `invalid_credentials` | `/saas/auth/login` |
| 401 | `invalid_refresh` | `/saas/auth/refresh` |
| 401 | `invalid_token` | JWT битый/expired |
| 401 | `token_revoked` | JWT `jti` в blocklist |
| 403 | `pending_role_select` | JWT с `pending_role_select=true` (не должно случаться у super_admin, но handle для безопасности) |
| 403 | `forbidden` | Per-kg admin к чужому kg |
| 404 | `kindergarten_not_found` | |
| 404 | `lifecycle_job_not_found` | |
| 409 | `kindergarten_slug_taken` | |
| 409 | `email_already_taken` | SaaS user create |
| 409 | `lifecycle_job_not_in_failed_state` | |
| 422 | validation | Любой DTO-валидатор класс-validator |
| 429 | `otp_rate_limit` / `rate_limit` | Превышен лимит |
| 503 | `service_unavailable` | `/health/ready` если DB/Redis down |

Маппинг → `src/locales/<lang>/errors.json` ключ `<error_code>`. Fallback — `unknown_error` с показом raw `message` из ответа.

---

## 12. Frontend ↔ Backend route map (полный)

Сводная таблица: какие routes покрывает SuperAdmin frontend.

| Frontend route | HTTP methods | Backend endpoints |
|---|---|---|
| `/login` | POST | `/saas/auth/login` |
| `/` (dashboard) | GET | `/health`, `/health/ready`, агрегированные счётчики из `/saas/kindergartens?is_active=true&limit=1` (для total_count в headers, если backend поддержит) |
| `/kindergartens` | GET | `/saas/kindergartens` |
| `/kindergartens/new` | POST | `/saas/kindergartens` |
| `/kindergartens/:id` | GET | `/saas/kindergartens/:id` |
| `/kindergartens/:id/settings` | PATCH | `/saas/kindergartens/:id` |
| `/kindergartens/:id/subscription` | GET, POST, PATCH | `/saas/saas-subscriptions?kindergarten_id=...`, `/saas/saas-subscriptions`, `/saas/saas-subscriptions/:id` |
| `/kindergartens/:id/flags` | GET, POST, DELETE | `/saas/feature-flags?kindergarten_id=...`, `/saas/feature-flags`, `/saas/feature-flags/:id` |
| `/kindergartens/:id/view-as` | (placeholder MVP) | — |
| `/subscriptions` | GET | `/saas/saas-subscriptions` |
| `/feature-flags` | GET, POST, DELETE | `/saas/feature-flags` |
| `/users` | GET | `/saas/users` |
| `/users/new` | POST | `/saas/users` |
| `/users/:id` | PATCH | `/saas/users/:id` |
| `/operations/billing` | POST | `/saas/billing/{monthly-run, discount-expire-run, overdue-run}` |
| `/operations/content` | POST | `/saas/content/{birthday-run, story-cleanup-run, publish-scheduled-run}` |
| `/operations/schedule-rollout` | POST | `/admin/schedule/week-rollout/run` |
| `/operations/lifecycle-dlq` | GET, POST | `/admin/lifecycle/failed-jobs`, `/admin/lifecycle/failed-jobs/:id/retry` |
| `/system-status` | GET | `/health`, `/health/ready` (polling) |

---

Backend-side TODO (унификация list-shape, OpenAPI полнота, audit log, webhook log, metrics agg, cron visibility) — вынесены в [`OPEN_QUESTIONS.md` раздел B](OPEN_QUESTIONS.md#b-endpoints--backend-api-contracts).
