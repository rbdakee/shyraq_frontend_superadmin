# Handoff → SuperAdmin Frontend: Kindergarten Admins (list / add)

**Направление:** backend → frontend (что доставлено, что теперь строить на фронте).
**Обратно к:** [`BACKEND_NEEDINGS_HANDOFF.md`](BACKEND_NEEDINGS_HANDOFF.md) (там — что фронт просил у backend; здесь — что backend отдал).
**Source of truth контракта:** [`docs/endpoints.md` §1.2 / §1.2.1](../endpoints.md) — при любом расхождении первичен он, не этот файл.
**Дата:** 2026-05-18.

---

## 0. Статус / доступность

|               |                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка backend | `superadmin/kg-admins` (9 коммитов, запушена в `origin`)                                                                                                                                                                                          |
| Состояние     | **PR ещё не смержен в `main` и не задеплоен.** Контракт финальный — фронт можно строить против него уже сейчас, но live-эндпоинты появятся только после merge + redeploy (`git pull` + `docker compose -f docker-compose.dev.yml up -d --build`). |
| Verification  | build ✓ · lint ✓ · unit 2086/0 · e2e 24/0 (cross-tenant + edge-кейсы)                                                                                                                                                                             |
| OpenAPI       | Полный Swagger проставлен → после деплоя прогнать `pnpm gen:api` + `pnpm typecheck`, типы сгенерятся чисто (без `any`).                                                                                                                           |

> **Не начинать фронт-работу против live до подтверждения merge+deploy.** До этого — только верстка/типы по контракту ниже.

---

## 1. Что доставлено: 2 эндпоинта

Оба на существующем контроллере `/saas/kindergartens`. **Auth (оба):** `Bearer` JWT с `role ∈ {super_admin, support}` (как у `create`/`invite`/`archive` — поддержка тоже допущена). 401 без/невалидный токен; 403 если роль не та.

### 1.1 `GET /saas/kindergartens/:id/admins` — список админов садика

- Возвращает staff-членов садика `:id` строго с `role='admin'` (НЕ reception/mentor/specialist).
- Query (опц.): `is_active` — boolean. **Отсутствует → возвращаются ВСЕ** (активные + деактивированные).
- **Response 200 — plain array (БЕЗ offset-пагинации):**

```json
[
  {
    "staff_member_id": "e2e2b6a7-…",
    "user_id": "d3e2b6a7-…",
    "full_name": "Айгерим Нурланкызы",
    "phone": "+77011112233",
    "locale": "ru",
    "is_active": true,
    "hired_at": "2026-04-28", // YYYY-MM-DD | null
    "fired_at": null, // YYYY-MM-DD | null
    "created_at": "2026-04-28T10:00:00.000Z" // ISO-8601
  }
]
```

- **Errors:** 404 `kindergarten_not_found`; 401; 403.

### 1.2 `POST /saas/kindergartens/:id/admins` — добавить админа

- **Body** (snake_case): `{ "full_name": string, "phone": string (E.164 ^\+[1-9]\d{1,14}$), "locale"?: "ru"|"kk" (default "ru") }`
- Логика: kg exists/не архивный → find-or-create `users` по phone (имя/locale существующего юзера **не перезаписываются**) → строгий 409-конфликт → `staff_members(role=admin, is_active=true)` → best-effort invite-SMS.
- **Response 201:**

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

- **Errors:**
  - **422** — невалидный `phone`/`locale` (отвергнут class-validator ДО сервиса). Тело: `{ "status": 422, "errors": { "phone": "invalid_phone_format" } }`.
  - **400** — `<invariant-code>` (сервисный `Phone.parse`/`Locale.parse`, практически недостижим если DTO прошёл).
  - **404** `kindergarten_not_found`; **409** `kindergarten_archived`; **409** `admin_already_exists`; **409** `staff_already_exists`; 401; 403.

---

## 2. Что теперь строить на фронте

Целевая страница: detail садика `/kindergartens/:id` (вкладка **«Администраторы»**). Сам KG-detail page (`GET /saas/kindergartens/:id`) — это всё ещё отдельный заблокированный пункт **P0.2 / B.8** ([handoff §3.2](BACKEND_NEEDINGS_HANDOFF.md)), но **вкладка «Администраторы» НЕ зависит от него** — у неё свой list-эндпоинт и она шипится независимо.

1. **Список админов** — таблица: `full_name`, `phone`, `locale`, `is_active` (бейдж активен/деактивирован), `hired_at`, `created_at`. Тоггл-фильтр **«только активные / все»** → `?is_active=true` / без параметра.
2. **«Добавить админа»** — модалка/форма: `full_name` (text, required), `phone` (E.164, required, маска `+7…`), `locale` (select `ru`/`kk`, default `ru`). Submit → POST.
   - Успех 201 → показать тост + рефетч списка. Если `invite_sms_sent: false` → **warning** (не error): «админ создан, но SMS-приглашение не доставлено» (зеркало паттерна `invite` из [handoff §2](BACKEND_NEEDINGS_HANDOFF.md)).
3. **Обработка ошибок** (маппинг в i18n, см. §3): `admin_already_exists` / `staff_already_exists` / `kindergarten_archived` / `kindergarten_not_found` → inline-ошибки формы; 422 → подсветка поля `phone`/`locale` по `errors.<field>`.

---

## 3. Контрактные тонкости — ОБЯЗАТЕЛЬНО соблюсти

- **Plain array, НЕ `{items,total,limit,offset}`.** Это намеренное исключение из [handoff §6 (B.1 offset-convention)](BACKEND_NEEDINGS_HANDOFF.md): админов садика мало, это bounded sub-resource. **Не строить пагинацию** для этого списка.
- **Два разных error-envelope.** 422-валидация: `{ status, errors: { <field>: <constraint> } }`. Доменные 4xx (404/409): `{ statusCode, error: <code>, message: <code> }`. Фронт-error-handler должен уметь оба shape (это поведение всего проекта, не только этого эндпоинта).
- **`invite` ≠ `add`.** Старый `POST /saas/kindergartens/:id/admin/invite` (singular) **только шлёт SMS**, staff-строку НЕ создаёт. Новый `POST .../admins` (plural) — реально создаёт админа. UI «добавить админа» = **новый** plural-эндпоинт; `invite` остаётся для переотправки SMS уже существующему админу.
- **`admin` = строго `role='admin'`.** reception/mentor/specialist в этот список не попадают.
- **Конфликт по паре (kg, user) — любой `is_active`.** Если у юзера уже есть staff-строка в этом садике (даже деактивированная) → 409. Реактивация уволенного админа — отдельного эндпоинта НЕТ (оператор решает руками). UI на 409 показывает осмысленное сообщение, не «retry».
- **snake_case** во всех запросах/ответах. `locale` enum — `ru|kk` (НЕ `kz`).
- **super_admin И support** оба могут вызывать оба эндпоинта (consistency с create/invite/archive; гейт C.3 открыт — следуем прецеденту).

---

## 4. i18n: новые error-коды

Добавить в `src/locales/<lang>/errors.json` (RU/KK):

| code                     | HTTP | смысл                                                 | предлагаемый текст (RU)                                        |
| ------------------------ | ---- | ----------------------------------------------------- | -------------------------------------------------------------- |
| `admin_already_exists`   | 409  | у юзера уже есть admin-строка в этом садике           | «Этот пользователь уже администратор данного садика»           |
| `staff_already_exists`   | 409  | у юзера уже есть non-admin staff-строка в этом садике | «Этот пользователь уже сотрудник данного садика (другая роль)» |
| `kindergarten_archived`  | 409  | садик архивирован                                     | «Нельзя добавить администратора в архивный садик»              |
| `kindergarten_not_found` | 404  | садик не найден                                       | (уже есть в реестре, переиспользовать)                         |

422-валидация: ключ `errors.phone` приходит как `invalid_phone_format` — смаппить в текст поля.

---

## 5. Не в scope (follow-up gaps — заводить как новые asks при необходимости)

- **Нет remove / demote админа** (удалить/понизить роль из садика суперадмином). Если в UI нужна кнопка «убрать админа» — это новый backend-ask.
- **Нет реактивации деактивированного админа** через этот эндпоинт (409 by design).
- **Нет пагинации/поиска** по списку (bounded, не требуется).
- **KG detail page (`GET /saas/kindergartens/:id`) — всё ещё P0.2/B.8**, отдельно. Вкладка «Администраторы» от него не зависит и шипится раньше.
- Полный KG-detail + settings (`PATCH`) — см. [handoff §3.2](BACKEND_NEEDINGS_HANDOFF.md), не закрыто этим PR.

---

## 6. Чек-лист интеграции (frontend)

- [ ] Дождаться подтверждения merge `superadmin/kg-admins` → `main` + redeploy.
- [ ] `pnpm gen:api` + `pnpm typecheck` (типы из `/docs-json`).
- [ ] Вкладка «Администраторы» на `/kindergartens/:id`: таблица + фильтр `is_active`.
- [ ] Модалка «Добавить админа»: форма + 201/`invite_sms_sent` handling.
- [ ] Маппинг новых error-кодов в `errors.json` (RU+KK).
- [ ] Error-handler покрывает оба envelope (422 `{status,errors}` и доменный `{statusCode,error,message}`).
- [ ] Не строить offset-пагинацию для list (plain array by contract).
