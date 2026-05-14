# Shyraq SuperAdmin — Design Specification

ТЗ дизайна для веб-приложения SuperAdmin. Описывает все страницы, контент каждой страницы и функционал. Этот документ — input для дизайнера (Figma) и frontend-разработчика.

**Зафиксированные решения** (из обсуждения):
- Layout: **Sidebar (left, collapsible) + Topbar**
- Тема: **только Light** на MVP
- Dashboard KPI: **минимум** — health-виджет + quick links (нет backend агрегата метрик)
- Destructive confirmations: **modal с вводом slug/email** для hard-actions; простой OK/Cancel для soft

**Источники истины:**
- Список endpoints — [`endpoints.md`](endpoints.md)
- Бизнес-процессы — [`superadmin_BP.md`](superadmin_BP.md)
- Stack и структура — [`architecture.md`](architecture.md)

---

## 1. Принципы дизайна

1. **Internal tool, не consumer app.** Density важнее красоты. Таблицы плотные, без декоративных пустот.
2. **Read-mostly, write-deliberate.** Большая часть UI — таблицы и read-only детали. Write-actions (create, delete) — за модалкой/отдельной страницей.
3. **Однозначные состояния.** Каждая страница имеет 4 состояния: `loading`, `loaded`, `empty`, `error`. Не должно быть skeleton + spinner одновременно.
4. **Destructive — с фрикцией.** Деактивация садика, удаление пользователя — модалка с вводом slug/email. Soft-операции — простой confirm.
5. **Backend errors → human messages.** Каждый `error` код из backend имеет i18n-ключ (см. `errors.json`). Не показываем raw stack trace.
6. **Локализация — равная.** RU и KK оба official. Тексты в коде не хардкодим, все через `t()`.

---

## 2. Information Architecture

### 2.1 Sitemap

```
/login                                 [public]
/                                      [home: dashboard]
/kindergartens                         [list]
/kindergartens/new                     [create form]
/kindergartens/:id                     [overview tab]
/kindergartens/:id/settings            [settings tab]
/kindergartens/:id/subscription        [subscription tab]
/kindergartens/:id/flags               [flags tab]
/kindergartens/:id/view-as             [placeholder tab]
/subscriptions                         [cross-kg list]
/feature-flags                         [cross-kg list]
/users                                 [SaaS users list]
/users/new                             [create user]
/users/:id                             [edit user]
/operations/billing                    [3 manual triggers]
/operations/content                    [3 manual triggers]
/operations/schedule-rollout           [weekly rollout trigger]
/operations/lifecycle-dlq              [failed jobs table + retry]
/system-status                         [health page]

# Error pages
/404
/403
/500
```

### 2.2 Navigation структура (sidebar)

```
Главная             /                     icon: Home
Садики              /kindergartens        icon: Building2
Подписки            /subscriptions        icon: CreditCard
Feature Flags       /feature-flags        icon: Flag
Пользователи        /users                icon: Users
─────── (separator) ───────
Операции            (group)
  ├─ Биллинг        /operations/billing            icon: Receipt
  ├─ Контент        /operations/content            icon: FileText
  ├─ Rollout недели /operations/schedule-rollout   icon: CalendarSync
  └─ Failed jobs    /operations/lifecycle-dlq      icon: AlertTriangle
─────── (separator) ───────
Статус системы      /system-status        icon: Activity
```

Группа "Операции" — collapsible accordion в sidebar (default expanded).

---

## 3. Shell / Layout

### 3.1 Sidebar (left, 240px collapsed → 64px)

| Элемент | Описание |
|---|---|
| **Logo + name** | Top, 64px height. Полное название "Shyraq SuperAdmin" в expanded, только logo в collapsed. Click → `/`. |
| **Nav items** | Иконка + label. Active state: filled background + accent text. Hover: subtle background. |
| **Operations group** | Accordion-секция. Шевронная иконка справа. Сохраняет состояние в Zustand. |
| **Collapse toggle** | Bottom-left button. Сохраняет состояние в Zustand + localStorage. |

Tooltip с label показывается при наведении в collapsed-режиме.

### 3.2 Topbar (height 56px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡] Breadcrumbs                  [🔍 Search] [RU▼] [@] [User Name ▼] │
└──────────────────────────────────────────────────────────────────────┘
```

| Элемент | Описание |
|---|---|
| **Hamburger `≡`** | Collapse/expand sidebar (mobile-mode — открывает drawer) |
| **Breadcrumbs** | Reflects current route: `Главная / Садики / Солнышко / Настройки`. Каждый сегмент — link, кроме последнего. |
| **Global search** | Только на routes где это применимо (см. §4.3). На остальных — пусто. Расширяется в overlay при focus. |
| **Language switcher** | Dropdown `RU` ⇄ `KK`. Применяется немедленно (i18next.changeLanguage), persist в localStorage. |
| **User menu** | Avatar (инициалы) + ФИО + chevron. Dropdown: `Мой профиль` (placeholder, нет endpoint), `Сменить пароль`, `Выйти`. |

### 3.3 Page chrome (внутри outlet)

Каждая страница имеет:

```
┌─────────────────────────────────────────────────────────┐
│  Page title                              [Primary CTA]  │   ← page header (height 80px)
│  Subtitle / description (optional)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Page body                                              │
│  (filters → table | form | tabs+content)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Page header выровнен с topbar по горизонтали. Subtitle — опционально, 1 строка max.

### 3.4 Footer

Не используется. Информация о версии (build SHA, env) — в user-menu dropdown под separator.

---

## 4. Базовые компоненты и паттерны

### 4.1 Component library (shadcn/ui base)

| Компонент | Использование |
|---|---|
| `Button` | Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. Sizes: `sm`, `default`, `lg`, `icon`. |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Slider` | Form controls. |
| `Dialog` (`Modal`) | Confirmations, формы создания, детали failed-job. |
| `Sheet` (slide-over) | Side-panel для quick-edit (где не нужна отдельная страница) — используем sparingly. |
| `DropdownMenu` | User menu, row-actions в таблицах, language switcher. |
| `Tabs` | Внутри `/kindergartens/:id`. |
| `Table` | Базовый table — но обёрнут в наш `<DataTable>` (см. §4.2). |
| `Badge` | Статусы (active/inactive, plan, processor name). |
| `Card` | Группировка контента (dashboard, operations triggers). |
| `Tooltip` | На truncated text, collapsed sidebar items, icon-only buttons. |
| `Toast` (sonner) | Success/error notifications после mutations. |
| `Skeleton` | Loading placeholders в таблицах и cards. |
| `Alert` | Inline-сообщения (warning о placeholder view-as, error в формах). |
| `Popover` | Filters в таблицах, date pickers. |
| `Command` (cmdk) | Global search (§4.3). |
| `Accordion` | Settings JSONB editor, DLQ row expanded details, sidebar Operations group. |

### 4.2 `<DataTable>` — переиспользуемая таблица

Используется на: `/kindergartens`, `/subscriptions`, `/feature-flags`, `/users`, `/operations/lifecycle-dlq`.

**Структура:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  [🔍 Search...]  [Filter: Plan ▼] [Filter: Status ▼] [+ Add new]    │ ← toolbar
├──────────────────────────────────────────────────────────────────────┤
│  ☐  Name           Status     Plan        Created       Actions     │ ← header
│ ─────────────────────────────────────────────────────────────────── │
│  ☐  Солнышко       ● Active   Standard    15 Jan 2026   [⋯]         │ ← row
│  ☐  Радуга         ● Active   Pro         02 Feb 2026   [⋯]         │
│  ☐  Звёздочка      ◌ Inactive Standard    10 Mar 2026   [⋯]         │
├──────────────────────────────────────────────────────────────────────┤
│  Showing 1–20 of 42         [← Prev] [Page 1 of 3] [Next →]         │ ← pagination
└──────────────────────────────────────────────────────────────────────┘
```

**Возможности:**
- Sortable columns (click header — toggle asc/desc/none)
- Filters via dropdown в toolbar
- Search через text input (debounced 300ms, передаётся как query param)
- Pagination (cursor-based — `Prev/Next`, без номеров страниц)
- Row actions через `[⋯]` dropdown (3-точка). Опции зависят от entity.
- Bulk-select (опционально, для feature flags / users — если нужны массовые операции)
- Empty state: иллюстрация + сообщение + CTA "Создать первый"
- Loading state: 5 skeleton-строк
- Error state: alert + retry button

### 4.3 Global search

Активна в topbar на:
- `/` (dashboard) — поиск по садикам
- `/kindergartens` — поиск по садикам (дублирует toolbar search)
- `/users` — поиск по пользователям

Activation: `Cmd+K` / `Ctrl+K` или click. Открывает `<Command>` overlay:

```
┌─────────────────────────────────────────┐
│ 🔍 Поиск садика, пользователя...        │
├─────────────────────────────────────────┤
│ САДИКИ                                  │
│   Солнышко                              │
│   Радуга                                │
│ ПОЛЬЗОВАТЕЛИ                            │
│   Иван Петров                           │
│ ОПЕРАЦИИ                                │
│   Запустить monthly billing             │
└─────────────────────────────────────────┘
```

Backend на MVP не выдаёт unified search → клиент дёргает `/saas/kindergartens?search=...&limit=5` + `/saas/users?search=...&limit=5` параллельно. Operations — статичные item'ы команд (e.g. "Open Lifecycle DLQ", "Run birthday-generation").

### 4.4 Forms (React Hook Form + Zod)

**Структура формы:**

```
┌─────────────────────────────────────────┐
│ Поле                                    │
│ ┌─────────────────────────────────────┐ │
│ │ value                               │ │
│ └─────────────────────────────────────┘ │
│ Описание поля / hint                    │
│ ⚠ Ошибка валидации                     │
└─────────────────────────────────────────┘
```

- Label сверху, не справа.
- Hint мелким серым под input.
- Error message красным под input, заменяет hint.
- Required-маркер: `*` рядом с label.
- Submit/Cancel внизу формы; submit — primary справа, cancel — ghost слева.
- Multi-step forms (e.g. create kindergarten) — progress indicator вверху + Step buttons внизу.

### 4.5 Destructive confirmations

**Hard actions** (деактивация kg, удаление SaaS user, удаление feature flag):

```
┌──────────────────────────────────────────────────────────┐
│ ⚠ Деактивировать садик "Солнышко"?                       │
│                                                          │
│ Это действие:                                            │
│  • Установит is_active = false                           │
│  • Архивирует всех активных детей                        │
│  • Отменит SaaS-подписку                                 │
│  • Admin садика потеряет доступ к Admin Web              │
│                                                          │
│ Для подтверждения введите slug садика:                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ sunshine                                             │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│                        [Отмена]  [⚠ Деактивировать]     │
└──────────────────────────────────────────────────────────┘
```

`Деактивировать` кнопка — `destructive` variant, disabled пока вводимый slug не совпадает.

**Soft actions** (удаление row в feature flags, отмена scheduled post через trigger):

```
┌──────────────────────────────────────────────────────────┐
│ Удалить флаг "face_id_enabled"?                          │
│                                                          │
│                        [Отмена]  [Удалить]              │
└──────────────────────────────────────────────────────────┘
```

### 4.6 State patterns

| Состояние | Когда | Что показываем |
|---|---|---|
| **Loading (initial)** | Первый fetch, нет cached data | Page shell + skeleton (5 rows для таблицы, 3 cards для grids) |
| **Loading (refetch)** | Cached data есть, фоновое обновление | Existing data + thin progress-bar сверху таблицы |
| **Loaded** | Success | Нормальный рендер |
| **Empty** | 200 OK, но `items.length === 0` | Иллюстрация + текст + CTA |
| **Error** | 4xx/5xx | `<Alert variant="destructive">` + код + i18n message + кнопка "Повторить" |
| **Mutation pending** | Submit формы или cron-trigger | Primary CTA — `disabled` + spinner внутри. Background blur не накладываем. |
| **Mutation success** | 2xx | Toast (3 секунды) + автоматический re-fetch / cache update |

### 4.7 Toasts

- Position: **top-right**.
- Auto-dismiss: 3s success, 5s error, sticky для critical.
- Action button на error: "Повторить" (если mutation retry-able).
- Не более 3 на экране — старые auto-stack.

### 4.8 Цветовая семантика статусов

| Статус | Цвет (semantic) | Использование |
|---|---|---|
| `success` / `active` / `up` / `paid` | Green | Active subscription, healthy DB, paid invoice |
| `warning` / `partial` / `paused` / `trial` | Amber | Partial payment, paused subscription, trial period |
| `error` / `failed` / `down` / `overdue` | Red | Failed job, DB down, overdue invoice |
| `info` / `pending` | Blue | Pending job, scheduled |
| `neutral` / `inactive` / `archived` | Gray | Cancelled subscription, archived child |

Конкретные hex-значения — определит дизайнер.

---

## 5. Pages — детальные спецификации

### 5.1 `/login`

**Цель:** аутентификация super_admin / support.

**Backend:** `POST /saas/auth/login`. См. [`endpoints.md §0.2`](endpoints.md#02-post-saasauthlogin--вход).

**Layout:** centered card на full-screen background. Без sidebar/topbar.

**Контент:**
- Logo + название "Shyraq SuperAdmin" сверху
- Карточка (max-width 400px):
  - Поле `Email` (required, email validation)
  - Поле `Password` (required, type=password, "show password" toggle)
  - `[Войти]` — primary CTA, full width
  - Под формой: link "Забыли пароль?" (на MVP — открывает modal с текстом "Свяжитесь с администратором платформы")
- Внизу страницы: build version + env (`v0.1.0 · production`)

**Состояния:**
- **Idle** — обычная форма
- **Submitting** — кнопка disabled + spinner
- **Error 401** — inline alert над формой: "Неверный email или пароль"
- **Error 429** — alert: "Превышен лимит попыток. Повторите через 1 час."

**Edge cases:**
- Если в URL есть `?next=/kindergartens/abc` — после успешного login redirect туда.
- Если в URL есть `?reason=session_expired` — показать info-alert "Сессия истекла, войдите снова".

---

### 5.2 `/` — Dashboard

**Цель:** домашняя страница. Минимум полезной информации (нет backend агрегата метрик).

**Backend:** `GET /health/ready` (polling), `GET /saas/kindergartens?is_active=true&limit=1` (для total count).

**Layout:** grid 12-cols, секции:

```
┌──────────────────────────────────────────────────────────┐
│  Главная                                                  │   ← page header
│  Обзор платформы Shyraq                                   │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────────────┐  │
│  │ Статус системы     │  │  Быстрые действия          │  │
│  │ ● DB up            │  │  + Создать садик           │  │
│  │ ● Redis up         │  │  ▶ Monthly billing run     │  │
│  │ updated 5s ago     │  │  ▶ Schedule rollout        │  │
│  │ [→ Подробнее]      │  │  ⚠ Failed jobs (3)         │  │
│  └────────────────────┘  └────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Платформа                                            ││
│  │  • Активных садиков: 42                              ││
│  │  • Активных пользователей SaaS: 6                    ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Виджеты:**

| Виджет | Контент | Действия |
|---|---|---|
| **Статус системы** | Pulse-indicator (green/red); строки `DB: up`, `Redis: up`; timestamp последней проверки. Polling каждые 30с. | Click → `/system-status` |
| **Быстрые действия** | Кнопки: "Создать садик", "Monthly billing run", "Schedule rollout", "Failed jobs (N)". `N` — счётчик из `GET /admin/lifecycle/failed-jobs?limit=1`. | Click → соответствующая страница (или открывает форму) |
| **Платформа** | Список простых метрик из доступных endpoints: total kgs, total SaaS users | — |

**Состояния:**
- Health red → "Статус системы" виджет имеет красный outline + текст "Service degraded"
- Failed jobs > 0 → "Failed jobs" кнопка имеет amber-badge с цифрой

---

### 5.3 `/kindergartens` — список садиков

**Цель:** список всех садиков платформы.

**Backend:** `GET /saas/kindergartens`. См. [`endpoints.md §1.1`](endpoints.md#11-get-saaskindergartens--список).

**Layout:** page header + DataTable.

**Header:**
```
Садики                                            [+ Новый садик]
Все тенанты платформы Shyraq
```

**Toolbar таблицы:**
- Search (по name)
- Filter `Plan`: select multi (standard / pro / enterprise)
- Filter `Статус`: select (Все / Активные / Неактивные)

**Колонки:**
| Колонка | Содержимое | Ширина |
|---|---|---|
| Название | `name` (bold) + `slug` мелким серым под ним | flex |
| Статус | Badge: `● Активен` (green) / `◌ Неактивен` (gray) | 120px |
| План | Badge: `Standard` / `Pro` / `Enterprise` | 100px |
| Подписка | Sub status (`active`/`trial`/`suspended`/`cancelled`) с цветной точкой, или `—` если нет | 120px |
| Телефон | `phone` formatted | 150px |
| Создан | `created_at` relative ("3 месяца назад") + tooltip с точной датой | 120px |
| Действия | `[⋯]` dropdown | 50px |

**Row actions (`[⋯]`):**
- Открыть детали → `/kindergartens/:id`
- Редактировать → `/kindergartens/:id/settings`
- Управление подпиской → `/kindergartens/:id/subscription`
- ─── separator ───
- ⚠ Деактивировать (destructive, только если `is_active=true`)
- ✓ Реактивировать (только если `is_active=false`)

**Click on row:** navigate to `/kindergartens/:id` (overview tab).

**Empty state:** "Пока нет ни одного садика. Создайте первого." + CTA.

---

### 5.4 `/kindergartens/new` — создать садик

**Цель:** атомарный бутстрап tenant'а + первого admin'а.

**Backend:** `POST /saas/kindergartens`. См. [`endpoints.md §1.2`](endpoints.md#12-post-saaskindergartens--создать-тенанта-atomic-bootstrap), [`superadmin_BP.md §2.1`](superadmin_BP.md#21-онбординг-нового-садика-tenant-bootstrap).

**Layout:** 2-step wizard, centered max-width 720px.

**Step 1 — Садик:**

```
[1] Садик     [2] Первый администратор

┌──────────────────────────────────────────────────────────┐
│ Название садика *                                         │
│ [Солнышко                                            ]    │
│                                                           │
│ Slug *                                                    │
│ [sunshine                                            ]    │
│ Латиница, цифры, дефис. Используется в URL и интеграциях. │
│                                                           │
│ Адрес                                                     │
│ [Алматы, ул. Абая 10                                 ]    │
│                                                           │
│ Телефон садика                                            │
│ [+7 727 222 33 44                                    ]    │
│                                                           │
│ План *                                                    │
│ ( ) Standard   (•) Pro   ( ) Enterprise                   │
│                                                           │
│ ▾ Настройки (advanced)                                    │
│   Timezone:   [Asia/Almaty           ▾]                   │
│   Currency:   [KZT ▾]                                     │
│   Late pickup fee (KZT): [5000        ]                   │
│   OTP expiry (sec):      [300         ]                   │
│   Payment grace (days):  [5           ]                   │
│                                                           │
│                                  [Отмена]  [Далее →]      │
└──────────────────────────────────────────────────────────┘
```

- Slug — auto-generates из name через `slugify()` при blur; editable.
- "Настройки" — accordion, default closed (defaults подойдут в 90% случаев).
- "Далее" — disabled пока required-поля не заполнены валидно.

**Step 2 — Первый администратор:**

```
[1] Садик     [2] Первый администратор

┌──────────────────────────────────────────────────────────┐
│ ФИО *                                                     │
│ [Айгерим Касымова                                    ]    │
│                                                           │
│ Телефон *                                                 │
│ [+7 700 123 45 67                                    ]    │
│ На этот номер уйдёт welcome-SMS с инструкцией входа.      │
│ Если телефон уже зарегистрирован — будет переиспользован  │
│ существующий пользователь.                                │
│                                                           │
│ Язык интерфейса *                                         │
│ (•) Русский   ( ) Қазақша                                 │
│                                                           │
│                       [← Назад]  [Создать садик]          │
└──────────────────────────────────────────────────────────┘
```

**После submit:**
- Loading state (button → spinner + "Создание...")
- Success → redirect на `/kindergartens/:id` + toast "Садик создан. Welcome-SMS отправлен на +7 700 123 45 67."
- Error 409 `kindergarten_slug_taken` → возврат на Step 1, подсветка slug поля + alert.
- Error 400 `invalid_phone_format` → подсветка соответствующего поля.

---

### 5.5 `/kindergartens/:id` — детали садика (tabs)

**Backend:** `GET /saas/kindergartens/:id`. См. [`endpoints.md §1.3`](endpoints.md#13-get-saaskindergartensid--детали).

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  ← Садики                                                 │
│                                                           │
│  Солнышко                              [⚠ Деактивировать]│
│  sunshine  ●Активен  Standard  Подписка: ●active          │
│  Алматы, ул. Абая 10  ·  +7 727 222 33 44                 │
├──────────────────────────────────────────────────────────┤
│  [Обзор] [Настройки] [Подписка] [Feature Flags] [View as]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Tab content                                              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### 5.5.1 Tab: Обзор (default)

3 секции (cards):

**Карточка "Статистика":**
- Активных детей: 42
- Архивных детей: 8
- Активных staff: 12
- Групп: 5

**Карточка "Подписка":**
- Plan, status badge, amount + period
- Started at, Next billing at
- CTA: "Управлять подпиской" → tab Subscription

**Карточка "Системная информация":**
- ID (`uuid`), copyable
- Slug
- Создан / Обновлён (timestamps)

#### 5.5.2 Tab: Настройки

`PATCH /saas/kindergartens/:id`. Форма как в Step 1 создания, но pre-filled. Slug не редактируем (показывается, но input disabled с tooltip "Slug не меняется после создания").

**Кнопки в footer формы:** `[Отменить]` (resets to fetched values) `[Сохранить]` (disabled если no changes).

#### 5.5.3 Tab: Подписка

**Backend:** `/saas/saas-subscriptions?kindergarten_id=:id`. См. [`endpoints.md §2`](endpoints.md#2-saas-subscriptions--saassaas-subscriptions).

**Если подписки нет:**
- Empty state + CTA "Создать подписку"

**Если есть:**
- Form с полями: `plan_code` (select), `status` (select), `billing_period` (select monthly/yearly), `amount` (decimal input), `started_at` (date picker), `next_billing_at` (date picker), `cancelled_at` (read-only display если есть)
- `[Сохранить]` → `PATCH /saas/saas-subscriptions/:id`
- Под формой — историческая инфо (создана, обновлена)

Status change to `cancelled` → confirm modal "Отменить подписку для Солнышко?".

#### 5.5.4 Tab: Feature Flags

**Backend:** `GET /saas/feature-flags?kindergarten_id=:id`.

**Layout:** простая таблица в этом tab'е (не DataTable со всем функционалом):

| Колонка | Содержимое |
|---|---|
| Key | `face_id_enabled` (mono font) |
| Value | JSON snippet, click → expand modal |
| Создан | relative time |
| Действия | `[Редактировать]` `[Удалить]` |

CTA в шапке tab'а: `[+ Добавить флаг для этого садика]`.

#### 5.5.5 Tab: View as

**Backend:** placeholder, см. [`superadmin_BP.md §8`](superadmin_BP.md#8-view-as-kindergarten-mvp-placeholder).

**Контент:**

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│              [Иконка: 🔍 + замок]                         │
│                                                           │
│         Read-only impersonation недоступно                │
│                                                           │
│  Просмотр данных садика глазами админа kg в этой версии  │
│  не реализован. Для базовой статистики используйте       │
│  вкладку "Обзор".                                         │
│                                                           │
│  Если нужно помочь админу садика — попросите его сделать │
│  скриншот / share screen, либо запросите доступ к БД у   │
│  команды разработки.                                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 5.6 `/subscriptions` — все подписки (cross-kg)

**Цель:** обзор всех SaaS-подписок платформы для финансового планирования.

**Backend:** `GET /saas/saas-subscriptions`.

**Layout:** page header + summary cards + DataTable.

**Summary cards (вверху, 4 шт.):**
- Total MRR (client-side aggregation: sum amount / (period==='yearly' ? 12 : 1) where status='active')
- Active subscriptions count
- Trial subscriptions count
- Suspended/cancelled count

**Toolbar:**
- Filter `Статус`: select multi (trial/active/suspended/cancelled)
- Filter `Plan`: select multi
- Sort default: `next_billing_at` ASC (ближайшие — наверху)

**Колонки:**
| Колонка | Содержимое |
|---|---|
| Садик | `name` + slug, click → `/kindergartens/:id/subscription` |
| План | Badge |
| Период | `monthly` / `yearly` |
| Сумма | `amount` formatted (e.g. `50 000 ₸`) |
| Статус | Color badge |
| Начат | `started_at` date |
| Следующий биллинг | `next_billing_at` date + relative ("через 5 дней"). Если просрочен — red. |
| Отменён | `cancelled_at` (если есть) |

---

### 5.7 `/feature-flags` — все флаги

**Backend:** `GET /saas/feature-flags`.

**Layout:** page header `[+ Новый флаг]` + DataTable.

**Toolbar:**
- Filter `Scope`: select (Все / Глобальные / Per-kg)
- Filter `Kindergarten`: autocomplete (если выбран `Per-kg`)
- Search по `key`

**Колонки:**
| Колонка | Содержимое |
|---|---|
| Key | `face_id_enabled` (mono font) |
| Scope | Badge `● Глобальный` / `🏫 <kg name>` |
| Value | JSON preview (truncated 60ch), click → modal с full JSON |
| Создан | relative time |
| Действия | `[Редактировать]` `[Удалить]` |

**Create/Edit modal:**

```
┌──────────────────────────────────────────────────────────┐
│ Новый feature flag                                  [✕]   │
├──────────────────────────────────────────────────────────┤
│ Scope *                                                   │
│ (•) Глобальный                                            │
│ ( ) Для конкретного садика                                │
│     [Выбрать садик ▾]                                     │
│                                                           │
│ Key *                                                     │
│ [face_id_enabled                                     ]    │
│ Латиница + точка для namespacing (e.g. `module.feature`)  │
│                                                           │
│ Value (JSON) *                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ true                                                 │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│ Может быть: true / false / число / строка / object       │
│ [Простой toggle для boolean]                              │
│                                                           │
│                          [Отмена]  [Сохранить]            │
└──────────────────────────────────────────────────────────┘
```

- `Простой toggle` — quick mode для boolean values (toggle UI вместо textarea).
- Client-side `JSON.parse` валидация при blur → подсветка error.

**Delete confirmation:** простой confirm (soft action).

---

### 5.8 `/users` — SaaS пользователи

**Backend:** `GET /saas/users`. См. [`endpoints.md §4`](endpoints.md#4-saas-users--saasusers).

**Layout:** page header `[+ Новый пользователь]` + DataTable.

**Toolbar:**
- Filter `Роль`: select (super_admin / support)
- Filter `Статус`: select (Активные / Неактивные)
- Search (по email / full_name)

**Колонки:**
| Колонка | Содержимое |
|---|---|
| ФИО | `full_name` |
| Email | `email` |
| Роль | Badge (super_admin — purple, support — blue) |
| Статус | `● Активен` / `◌ Неактивен` |
| Последний вход | `last_login_at` relative или "никогда" |
| Действия | `[⋯]` |

**Row actions:**
- Редактировать
- Сменить пароль (открывает modal)
- Деактивировать / Активировать (toggle, простой confirm)
- Текущий user (self) — действия Disabled с tooltip "Нельзя редактировать самого себя"

---

### 5.9 `/users/new` — создать SaaS пользователя

**Backend:** `POST /saas/users`.

**Layout:** centered form max-width 480px.

**Поля:**
- ФИО * (text)
- Email * (email validation)
- Телефон (E.164, optional)
- Пароль * (min 8 chars, "show password" toggle, strength indicator)
- Подтверждение пароля * (должен совпадать с первым)
- Роль * (radio: super_admin / support)

**Footer:** `[Отмена]` `[Создать пользователя]`.

После success → toast "Пользователь создан. Передайте пароль офлайн (Slack DM, личная встреча — не email)." + redirect `/users`.

---

### 5.10 `/users/:id` — редактировать

**Backend:** `PATCH /saas/users/:id`.

**Layout:** similar to create form, но pre-filled. Email не редактируем (показывается, input disabled).

**Дополнительные секции:**
- **Карточка "Сменить пароль"** — отдельная под основной формой, с двумя input'ами (new + confirm) и `[Изменить пароль]` button. Не сохраняется вместе с остальным — отдельный submit, отдельный success-toast.
- **Карточка "Опасная зона"** — destructive section с toggle "Деактивировать пользователя". Confirm modal с вводом email пользователя.

Self-edit: блокировка `Деактивировать` (disabled, tooltip).

---

### 5.11 `/operations/billing` — manual billing triggers

**Цель:** ручные триггеры cron'ов биллинга. См. [`superadmin_BP.md §5.1-5.3`](superadmin_BP.md#5-operational-cron-triggers).

**Layout:** 3 cards в grid (1-col на narrow screen, до 3-col на wide).

#### 5.11.1 Card "Monthly Invoice Generation"

```
┌──────────────────────────────────────────────────────────┐
│  📅 Monthly Invoice Generation                            │
│  Генерация ежемесячных инвойсов родителям для всех        │
│  активных садиков. Автоматический cron: 1-го числа        │
│  каждого месяца, 02:00 Asia/Almaty.                       │
│                                                           │
│  Period start (1st of month) *                            │
│  [2026-06-01    📅]                                       │
│                                                           │
│  Kindergarten (optional)                                  │
│  [Все активные               ▾]                           │
│                                                           │
│                                  [▶ Запустить]            │
│                                                           │
│ ─────────── Последний запуск ────────────                │
│  2026-05-01 02:00 (auto)                                  │
│   • 42 садиков обработано                                 │
│   • 156 инвойсов создано                                  │
│   • 12 пропущено (уже сгенерированы)                      │
└──────────────────────────────────────────────────────────┘
```

**Поля:**
- `Period start` — date picker с restriction (только 1-е число месяца). Default — 1-е число текущего месяца.
- `Kindergarten` — autocomplete select (optional). Default "Все активные".

**Action button:** `[▶ Запустить]` — primary.

**Confirmation modal:**
```
Запустить генерацию инвойсов?

Период: июнь 2026 (2026-06-01)
Садики: все активные (42)

Это может создать сотни инвойсов. Идемпотентно — пропускает уже-сгенерированные.

                                  [Отмена]  [▶ Запустить]
```

**Submitting state:**
- Card заменяется на loading-view: spinner + "Генерация... может занять минуту" + прогресс-индикатор (indeterminate, т.к. backend не шлёт progress events).

**Success state:**
- Card обновляется с результатом: green-badge "Success", таблица summary (kindergartens_processed, invoices_created, skipped_already_generated), timestamp.
- Result сохраняется в Zustand store (in-memory) → перезагрузка страницы сбрасывает (это OK, backend идемпотентен).

#### 5.11.2 Card "Discount Expire Run"

Аналогично, но проще:
- Описание: "Закрытие истёкших custom-скидок (status: active → expired)."
- Поля: только `Kindergarten` (optional).
- Action: `[▶ Запустить]`
- Result: `expired_count`

#### 5.11.3 Card "Overdue Invoice Sweep"

- Описание: "Перевод pending/partial инвойсов в overdue (due_date < now)."
- Поля: `Now override (optional, ISO datetime)` — для бэкфила.
- Action: `[▶ Запустить]`
- Backend отвечает 202 (async). Result: `job_id`, status `enqueued`. Toast.

---

### 5.12 `/operations/content` — manual content triggers

Аналогично §5.11, 3 cards:

#### 5.12.1 Card "Birthday Posts Generation"

- Поля: `Date` (date picker, default — today Asia/Almaty), `Kindergarten` (optional)
- Result: kindergartens_processed, posts_created, posts_skipped

#### 5.12.2 Card "Story Cleanup"

- Поля: `Kindergarten` (optional)
- Result: deleted_count
- Описание подчёркивает: "Удаляет истёкшие stories из БД и FileStorage. Не обратимо."

#### 5.12.3 Card "Publish Scheduled Posts"

- Поля: `Kindergarten` (optional)
- Result: published_count

---

### 5.13 `/operations/schedule-rollout` — weekly rollout

**Backend:** `POST /admin/schedule/week-rollout/run`. См. [`endpoints.md §7`](endpoints.md#7-schedule-weekly-rollout--adminschedulewweek-rolloutrun), [`superadmin_BP.md §5.7`](superadmin_BP.md#57-weekly-schedule--meal-rollout).

**Layout:** single full-width card.

```
┌──────────────────────────────────────────────────────────┐
│  📅 Weekly Schedule + Meal Rollout                        │
│                                                           │
│  Копирует расписание занятий и меню питания со текущей    │
│  недели на следующую для всех активных садиков. Cron      │
│  крутится каждое воскресенье 23:00 Asia/Almaty.           │
│  Идемпотентно — пропускает уже-скопированные.             │
│                                                           │
│  From Monday *                                            │
│  [2026-05-12    📅]                                       │
│  Default: понедельник текущей недели (Asia/Almaty)        │
│                                                           │
│                              [▶ Запустить роллаут]        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

Date picker — restricted к понедельникам (отключаются другие дни).

**После запуска — result section разворачивается под card'ом:**

```
┌──────────────────────────────────────────────────────────┐
│  Результат запуска · 2026-05-13 10:32                     │
│                                                           │
│  Total:                                                   │
│   • 42 садика обработано                                  │
│   • 187 групп скопировано                                 │
│   • 23 групп пропущено                                    │
│   • 5421 событий создано                                  │
│   • 187 меню-планов создано                               │
│   • 0 ошибок                                              │
│                                                           │
│  Per kindergarten:                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Садик       Schedule         Meal       Error      │  │
│  │ ──────────────────────────────────────────────────  │  │
│  │ Солнышко    5 grp / 145 evt  5 plans    —          │  │
│  │ Радуга      4 grp / 112 evt  4 plans    —          │  │
│  │ Звёздочка   3 grp / 0 evt    0 plans    error... ▾│  │
│  │ ...                                                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Per-kg row с error — expandable (accordion) с deталями.
- Result сохраняется в Zustand до перезагрузки.
- При повторном запуске result обновляется.

---

### 5.14 `/operations/lifecycle-dlq` — failed jobs

**Backend:** `GET /admin/lifecycle/failed-jobs`, `POST /admin/lifecycle/failed-jobs/:id/retry`. См. [`endpoints.md §8`](endpoints.md#8-lifecycle-dlq-cross-kg-view--adminlifecyclefailed-jobs), [`superadmin_BP.md §6`](superadmin_BP.md#6-lifecycle-dlq-triage-support-workflow).

**Layout:** page header + DataTable.

**Header:**
```
Failed Jobs (Lifecycle DLQ)                        [↻ Обновить]
Очередь failed jobs из BullMQ lifecycle queue. Auto-cleanup через 30 дней.
```

**Toolbar:**
- Filter `Processor`: select (`pro-rata-refund`, etc.)
- Filter `Kindergarten`: autocomplete
- Filter `Failed in last`: select (1h / 24h / 7d / all)

**Колонки:**
| Колонка | Содержимое |
|---|---|
| ID | mono font, truncated, click → expand |
| Processor | Badge с name |
| Kindergarten | name (JOIN на kindergartens) + ID tooltip |
| Failed reason | truncated 80 chars, click → modal с full stack |
| Attempts | `3 / 3` (filled rectangles) |
| Failed at | `finished_on` relative |
| Действия | `[Retry]` button |

**Row click:** expand accordion с full payload (JSON, syntax-highlighted) + full failed_reason + timestamps (`timestamp`, `finished_on`).

**Retry action:**
- Confirmation modal: "Re-enqueue job `<id>` with same payload?"
- 202 response → toast "Job ретрайнут. Обновите таблицу через минуту."
- Errors:
  - 404 → toast "Job не найден (удалён auto-cleanup'ом?)"
  - 409 → toast "Job уже не в failed state"
  - 403 → toast "Нет доступа к чужому kg" (для support роли)

**Empty state:** "Нет failed jobs — всё идёт хорошо 🎉".

---

### 5.15 `/system-status`

**Цель:** детальная health-страница.

**Backend:** `GET /health`, `GET /health/ready` (polling 30s).

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Статус системы                          [↻ Refresh now]  │
│  Последнее обновление: 2026-05-13 08:32:15 (3 сек назад)  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ● Все системы работают нормально                         │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Component         Status       Last check          │  │
│  │ ──────────────────────────────────────────────────  │  │
│  │ API process       ● up         5 sec ago           │  │
│  │ PostgreSQL        ● up         5 sec ago           │  │
│  │ Redis             ● up         5 sec ago           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  История последних 10 проверок:                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Time              DB     Redis    Result           │  │
│  │ ──────────────────────────────────────────────────  │  │
│  │ 08:32:15          ● up   ● up     OK               │  │
│  │ 08:31:45          ● up   ● up     OK               │  │
│  │ 08:31:15          ● up   ◌ down   Degraded         │  │
│  │ ...                                                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- История in-memory, last 10 проверок. Сброс при reload.
- Top status block — pulse-animated dot (green/red).
- При degraded — статус-block становится red, alert "Some services are down" с деталями.

---

### 5.16 Error pages

#### 404

```
              [Иллюстрация: пустая папка]

              Страница не найдена

   Возможно, ссылка устарела или содержит опечатку.

                  [← На главную]
```

#### 403

```
              [Иллюстрация: замок]

              Доступ запрещён

   У вашей роли нет прав для просмотра этой страницы.

                  [← На главную]
```

#### 500

```
              [Иллюстрация: сломанное]

              Что-то пошло не так

   Внутренняя ошибка. Если проблема повторяется —
   свяжитесь с командой разработки.

   Error ID: abc123 (для трекинга в Sentry)

                  [↻ Обновить]
```

---

## 6. Cross-cutting UX

### 6.1 Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open global search |
| `Cmd/Ctrl + ,` | Open user menu |
| `Esc` | Close modal / dialog |
| `/` | Focus search input (когда не в input'е) |
| `g h` | Go home |
| `g k` | Go to kindergartens |
| `g u` | Go to users |
| `g o` | Go to operations |

Реализуем через `react-hotkeys-hook`. Подсказка в command-palette ("? — все горячие клавиши").

### 6.2 Language switcher

Dropdown в topbar справа от search:

```
[RU ▾]
       Русский (RU)  ✓
       Қазақша (KK)
```

Click → `i18next.changeLanguage('kk')` → persists в `localStorage.shyraq.sa.lang` → soft reload (page rerender, не location.reload).

JSONB-поля backend'а (`{ru, kz}`) рендерятся через `localizeJsonb(field, currentLang)` хелпер. Fallback chain: `currentLang → ru → kz → "—"`.

### 6.3 User menu

```
[👤 Иван Петров ▾]
                  super_admin@shyraq.kz
                  ── role: super_admin ──
                  
                  👤 Мой профиль (placeholder)
                  🔑 Сменить пароль
                  ──────────────────
                  ℹ Версия: v0.1.0 · production
                  📚 Документация
                  ──────────────────
                  🚪 Выйти
```

"Сменить пароль" → открывает modal с двумя полями (new + confirm). `PATCH /saas/users/<me.id>`.

"Выйти" → `POST /saas/auth/logout` → wipe tokens → redirect `/login`.

### 6.4 Notifications (toasts)

См. §4.7. Дополнительно:
- Long-running ops (monthly-run) → toast.promise wrapper: "Запуск..." → "Завершено" / "Ошибка".
- Critical errors (refresh failed) → sticky toast with "Войти снова" CTA → redirect `/login`.

---

## 7. Responsive strategy

| Breakpoint | Range | Поведение |
|---|---|---|
| `xl` (default) | ≥ 1280px | Sidebar expanded (240px) + Topbar + page content max-width 1440px centered |
| `lg` | 1024–1279px | Sidebar collapsed (64px) by default, expand on hover |
| `md` | 768–1023px | Sidebar — drawer (открывается через hamburger). Tables — horizontal scroll |
| `sm` | < 768px | **Not supported**. Показываем full-page alert: "SuperAdmin доступен только на desktop / tablet. Используйте экран шириной ≥ 768px." |

Mobile (< 768px) — explicit not supported, т.к. это admin tool. Дизайнер не делает mobile дизайн.

---

## 8. Accessibility baseline

- **Контраст**: WCAG AA минимум (4.5:1 для текста, 3:1 для UI elements).
- **Focus visible**: каждый interactive element имеет visible focus ring (offset 2px).
- **Keyboard navigation**: все actions достижимы клавиатурой (Radix даёт это из коробки).
- **Screen reader**: семантичный HTML, `aria-label` на icon-only buttons, `<label>` для всех inputs.
- **Reduced motion**: respect `prefers-reduced-motion` — отключаем анимации, заменяем на instant transitions.
- **Lang**: `<html lang="ru">` (или `kk` после переключения).

Не делаем full WCAG AAA — но baseline AA обязателен.

---

## 9. Что НЕ дизайним в MVP

Чтобы дизайнер не тратил время на:

- **Dark theme** — отложено.
- **Mobile (< 768px)** — explicit unsupported.
- **`/kindergartens/:id/view-as`** — placeholder, без реальной impersonation UI.
- **Audit log UI** — нет backend endpoint'а.
- **Metrics dashboard с charts** — нет backend агрегата, не достаточно данных для серьёзных графиков.
- **Webhook audit UI** — нет backend endpoint'а.
- **Cron schedule visibility** — нет backend endpoint'а.
- **Push/email notifications в SuperAdmin** — backend не шлёт system events на super_admin.
- **Custom branding per kg** — SuperAdmin универсален.
- **Onboarding wizard / tour** — internal tool, обучаемся по документации.

Когда соответствующий вопрос в [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) станет `resolved` — добавляем экран отдельным дизайн-пассом.

---

## 10. Deliverables дизайнера

Что ожидается на выходе дизайн-фазы:

1. **Design tokens** (Figma styles + CSS variables): colors, typography, spacing, radius, shadows.
2. **Component library** (Figma components): все примитивы из §4.1 в нужных variants/sizes/states.
3. **Page mockups** (Figma frames): все 17 routes из §2.1 в default state.
4. **Critical states** (Figma frames): empty, loading, error для DataTable и forms.
5. **Mobile alert frame** (тот, что для < 768px).
6. **Handoff specs**: Dev Mode в Figma + Tailwind class hints где возможно.

После handoff — frontend начинает имплементировать в порядке: shell (sidebar + topbar) → DataTable → Login → Kindergartens list → New → Detail tabs → остальное.
