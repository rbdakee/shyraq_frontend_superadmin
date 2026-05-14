/* Screens: Login, Dashboard, Kindergartens list, Create KG wizard */

// =========================================================================
// LOGIN
// =========================================================================
function ScreenLogin() {
  return (
    <div className="ab ab--login" style={{ background: "var(--bg-canvas)", height: "100%" }}>
      <div style={{ width: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "var(--brand)",
            color: "white", fontFamily: "var(--font-mono)", letterSpacing: -1,
            fontWeight: 600, fontSize: 16, display: "grid", placeItems: "center",
          }}>SH</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: -0.3 }}>Shyraq</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>SuperAdmin</div>
          </div>
        </div>

        <Card style={{ width: "100%", padding: 28 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>
            Войдите в кабинет
          </h2>
          <p style={{ margin: "0 0 22px", color: "var(--text-tertiary)", fontSize: 13 }}>
            Только для сотрудников Shyraq
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Email" required>
              <Input value="ivan@shyraq.kz" />
            </Field>
            <Field label="Пароль" required>
              <Input value="••••••••••••" suffix={<Icon.Eye s={14} />} />
            </Field>

            <Button variant="primary" size="lg" fullWidth style={{ marginTop: 6 }}>Войти</Button>

            <a style={{ fontSize: 12.5, color: "var(--text-tertiary)", textAlign: "center", marginTop: 2 }}>
              Забыли пароль?
            </a>
          </div>
        </Card>

        <div style={{ fontSize: 11.5, color: "var(--text-quaternary)", fontFamily: "var(--font-mono)" }}>
          v0.1.0 · production
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// DASHBOARD
// =========================================================================
function ScreenDashboard() {
  return (
    <Shell active="home" breadcrumbs={["Главная"]} showSearch search="Поиск садика, пользователя...">
      <PageHeader title="Главная" subtitle="Обзор платформы Shyraq" />
      <Body>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Health */}
          <Card>
            <Row between style={{ marginBottom: 12 }}>
              <Row gap={8}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--success)", boxShadow: "0 0 0 4px color-mix(in oklab, var(--success) 18%, transparent)" }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Статус системы</h3>
              </Row>
              <Mono style={{ color: "var(--text-quaternary)", fontSize: 11 }}>обновлено 5с назад</Mono>
            </Row>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <HealthRow label="API process" status="up" />
              <HealthRow label="PostgreSQL" status="up" />
              <HealthRow label="Redis" status="up" />
            </div>

            <a style={{ fontSize: 12.5, color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              Подробнее <Icon.ChevronRight s={12} />
            </a>
          </Card>

          {/* Quick actions */}
          <Card>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Быстрые действия</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <QuickAction icon={<Icon.Plus />} label="Создать садик" />
              <QuickAction icon={<Icon.Play />} label="Monthly billing run" />
              <QuickAction icon={<Icon.CalendarSync />} label="Schedule rollout" />
              <QuickAction icon={<Icon.Alert />} label="Failed jobs" badge={3} warning />
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Платформа</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            <Stat label="Активных садиков" value="42" />
            <Stat label="Активных подписок" value="38" suffix={<Badge tone="success" dot>в норме</Badge>} divider />
            <Stat label="SaaS пользователей" value="6" divider />
            <Stat label="MRR (расчётный)" value="2.5M" suffix={<span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>₸ / мес</span>} divider />
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
          <Card>
            <Row between style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Ближайшие биллинги</h3>
              <a style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Все подписки →</a>
            </Row>
            <DenseList rows={[
              { name: "Солнышко", sub: "sunshine", right: "через 2 дня", rightSub: "18 мая · 90 000 ₸", tone: "warning" },
              { name: "Радуга", sub: "raduga", right: "через 5 дней", rightSub: "21 мая · 50 000 ₸", tone: "info" },
              { name: "Балапан", sub: "balapan", right: "через 12 дней", rightSub: "28 мая · 50 000 ₸" },
              { name: "Айналайын", sub: "aynalayin", right: "через 18 дней", rightSub: "3 июня · 120 000 ₸" },
            ]}/>
          </Card>

          <Card>
            <Row between style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Последние события</h3>
            </Row>
            <Timeline events={[
              { time: "сейчас", text: "Cron monthly-billing завершён", tone: "success", meta: "156 инвойсов" },
              { time: "23м", text: "Создан садик «Балапан»", meta: "Иван П." },
              { time: "1ч", text: "3 failed jobs · pro-rata-refund", tone: "warning" },
              { time: "4ч", text: "Подписка sunshine → active", tone: "success" },
              { time: "вчера", text: "Деактивирован садик «Тестовый»", tone: "error" },
            ]}/>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

function HealthRow({ label, status }) {
  const map = {
    up: { tone: "success", text: "up" },
    down: { tone: "error", text: "down" },
  }[status];
  return (
    <Row between>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
      <Badge tone={map.tone} dot>{map.text}</Badge>
    </Row>
  );
}

function QuickAction({ icon, label, badge, warning }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      border: `1px solid ${warning ? "color-mix(in oklab, var(--warning) 35%, white)" : "var(--border-default)"}`,
      background: warning ? "var(--warning-soft)" : "var(--bg-surface-2)",
      color: warning ? "var(--warning-text)" : "var(--text-primary)",
      borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
    }}>
      {React.cloneElement(icon, { s: 14 })}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{badge}</span>}
    </div>
  );
}

function Stat({ label, value, suffix, divider }) {
  return (
    <div style={{
      padding: "0 18px",
      borderLeft: divider ? "1px solid var(--border-subtle)" : "none",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{value}</span>
        {suffix}
      </div>
    </div>
  );
}

function DenseList({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 0",
          borderTop: i ? "1px solid var(--border-subtle)" : "none",
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</div>
            <Mono style={{ color: "var(--text-quaternary)", fontSize: 11 }}>{r.sub}</Mono>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, color: r.tone === "warning" ? "var(--warning-text)" : r.tone === "info" ? "var(--info-text)" : "var(--text-secondary)", fontWeight: 500 }}>
              {r.right}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-quaternary)", fontFamily: "var(--font-mono)" }}>{r.rightSub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ events }) {
  const toneColor = (t) => ({
    success: "var(--success)", warning: "var(--warning)", error: "var(--error)", info: "var(--info)",
  }[t] || "var(--text-quaternary)");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {events.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
          <Mono style={{ fontSize: 11, color: "var(--text-quaternary)", width: 42, flexShrink: 0, paddingTop: 2 }}>{e.time}</Mono>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: toneColor(e.tone), marginTop: 7, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{e.text}</div>
            {e.meta && <Mono style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{e.meta}</Mono>}
          </div>
        </div>
      ))}
    </div>
  );
}

// =========================================================================
// KINDERGARTENS LIST
// =========================================================================
function ScreenKindergartens() {
  const rows = [
    { name: "Солнышко", slug: "sunshine", status: "active", plan: "Standard", sub: "active", phone: "+7 727 222 33 44", created: "3 мес. назад" },
    { name: "Радуга", slug: "raduga", status: "active", plan: "Pro", sub: "active", phone: "+7 727 333 22 11", created: "4 мес. назад" },
    { name: "Балапан", slug: "balapan", status: "active", plan: "Pro", sub: "trial", phone: "+7 727 555 22 11", created: "2 нед. назад" },
    { name: "Айналайын", slug: "aynalayin", status: "active", plan: "Enterprise", sub: "active", phone: "+7 727 444 11 22", created: "1 год назад" },
    { name: "Звёздочка", slug: "zvezdochka", status: "inactive", plan: "Standard", sub: "cancelled", phone: "+7 727 111 99 00", created: "8 мес. назад" },
    { name: "Жұлдыз", slug: "zhuldyz", status: "active", plan: "Standard", sub: "suspended", phone: "+7 727 666 77 88", created: "5 мес. назад" },
    { name: "Күншуақ", slug: "kunshuak", status: "active", plan: "Pro", sub: "active", phone: "+7 727 999 11 22", created: "10 мес. назад" },
    { name: "Бөбек", slug: "bobek", status: "active", plan: "Standard", sub: "active", phone: "+7 727 333 44 55", created: "6 мес. назад" },
    { name: "Тестовый садик", slug: "test-kg", status: "inactive", plan: "Standard", sub: "cancelled", phone: "+7 700 000 00 00", created: "1 год назад" },
  ];

  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики"]} showSearch search="Поиск садика...">
      <PageHeader
        title="Садики"
        subtitle="Все тенанты платформы Shyraq · всего 42"
        actions={<Button variant="primary" icon={<Icon.Plus />}>Новый садик</Button>}
      />
      <Body>
        {/* Toolbar */}
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{
            padding: "12px 16px", display: "flex", gap: 10, alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            <Input prefix={<Icon.Search s={13} />} placeholder="Поиск по названию или slug" style={{ width: 280 }} />
            <Select placeholder="План: все" style={{ width: 140 }} />
            <Select placeholder="Статус: все" style={{ width: 140 }} />
            <Select placeholder="Подписка: все" style={{ width: 150 }} />
            <div style={{ flex: 1 }} />
            <Mono style={{ color: "var(--text-tertiary)", fontSize: 11.5 }}>9 из 42</Mono>
            <Button variant="ghost" size="sm" icon={<Icon.Download />}>Export</Button>
          </div>

          {/* Table */}
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th style={{ width: 36 }}><CheckBox /></Th>
                <Th>Название</Th>
                <Th sortable>Статус</Th>
                <Th sortable>План</Th>
                <Th>Подписка</Th>
                <Th>Телефон</Th>
                <Th sortable active>Создан ↓</Th>
                <Th style={{ width: 60 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={trStyle(i)}>
                  <Td><CheckBox /></Td>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    <Mono style={{ color: "var(--text-quaternary)", fontSize: 11 }}>{r.slug}</Mono>
                  </Td>
                  <Td>
                    {r.status === "active"
                      ? <Badge tone="success" dot>Активен</Badge>
                      : <Badge tone="neutral" dot>Неактивен</Badge>}
                  </Td>
                  <Td><Badge tone={r.plan === "Enterprise" ? "purple" : r.plan === "Pro" ? "brand" : "neutral"}>{r.plan}</Badge></Td>
                  <Td>
                    {r.sub === "active" && <Badge tone="success" dot>active</Badge>}
                    {r.sub === "trial" && <Badge tone="info" dot>trial</Badge>}
                    {r.sub === "suspended" && <Badge tone="warning" dot>suspended</Badge>}
                    {r.sub === "cancelled" && <Badge tone="neutral" dot>cancelled</Badge>}
                  </Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{r.phone}</Mono></Td>
                  <Td><span style={{ color: "var(--text-secondary)" }}>{r.created}</span></Td>
                  <Td><button style={iconBtnSm}><Icon.Dots s={14} /></button></Td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{
            padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: 12.5, color: "var(--text-tertiary)",
          }}>
            <span>Показано 1–9 из 42</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="outline" size="sm" icon={<Icon.ChevronLeft />}>Назад</Button>
              <Button variant="outline" size="sm" iconRight={<Icon.ChevronRight />}>Вперёд</Button>
            </div>
          </div>
        </Card>
      </Body>
    </Shell>
  );
}

// =========================================================================
// CREATE KINDERGARTEN WIZARD (Step 1)
// =========================================================================
function ScreenKgCreate() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Новый садик"]}>
      <PageHeader
        title="Новый садик"
        subtitle="Атомарный bootstrap: садик + первый администратор за один шаг"
        back="Все садики"
      />
      <Body>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Step n={1} label="Садик" active />
            <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
            <Step n={2} label="Первый администратор" />
          </div>

          <Card padding={28}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>Информация о садике</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--text-tertiary)" }}>
              Базовые данные тенанта. Slug используется в URL и интеграциях — его нельзя изменить после создания.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Название садика" required>
                <Input value="Солнышко" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Slug" required hint="Латиница, цифры, дефис. Автогенерация из названия.">
                  <Input value="sunshine" mono />
                </Field>
                <Field label="Телефон садика" required>
                  <Input value="+7 727 222 33 44" prefix={<Icon.Phone s={13} />} />
                </Field>
              </div>

              <Field label="Адрес" hint="Используется в инвойсах и SMS-шаблонах">
                <Input value="Алматы, ул. Абая 10" />
              </Field>

              <Field label="План" required>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <PlanCard plan="standard" name="Standard" price="50 000 ₸" features={["Базовый функционал", "До 100 детей"]} />
                  <PlanCard plan="pro" name="Pro" price="90 000 ₸" features={["+ Stories", "+ Расширенная аналитика"]} active />
                  <PlanCard plan="enterprise" name="Enterprise" price="from 150 000 ₸" features={["+ SLA", "+ Кастомизация"]} />
                </div>
              </Field>

              {/* Advanced accordion */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginTop: 4 }}>
                <Row gap={6} style={{ color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", marginBottom: 14 }}>
                  <Icon.ChevronDown s={13} /> Расширенные настройки
                </Row>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Field label="Timezone"><Select value="Asia/Almaty" /></Field>
                  <Field label="Currency"><Select value="KZT" /></Field>
                  <Field label="OTP expiry (сек)"><Input value="300" mono /></Field>
                  <Field label="Late pickup fee (₸)"><Input value="5000" mono /></Field>
                  <Field label="Payment grace (дней)"><Input value="5" mono /></Field>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 28, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost">Отмена</Button>
              <Button variant="primary" iconRight={<Icon.ChevronRight />}>Далее</Button>
            </div>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

function ScreenKgCreateStep2() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Новый садик"]}>
      <PageHeader
        title="Новый садик"
        subtitle="Контакты первого администратора — он получит welcome-SMS"
        back="Все садики"
      />
      <Body>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Step n={1} label="Садик" done />
            <div style={{ flex: 1, height: 1, background: "var(--brand)" }} />
            <Step n={2} label="Первый администратор" active />
          </div>

          <Card padding={28}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>Первый администратор</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--text-tertiary)" }}>
              На указанный телефон уйдёт welcome-SMS с инструкцией входа. Если телефон уже зарегистрирован — будет переиспользован существующий пользователь.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="ФИО" required>
                <Input value="Айгерим Касымова" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
                <Field label="Телефон" required hint="E.164 формат, например +77001234567">
                  <Input value="+7 700 123 45 67" prefix={<Icon.Phone s={13} />} />
                </Field>
                <Field label="Язык интерфейса" required>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <LangCard code="RU" name="Русский" active />
                    <LangCard code="KK" name="Қазақша" />
                  </div>
                </Field>
              </div>

              {/* Info banner */}
              <div style={{
                padding: 14, borderRadius: 8,
                background: "var(--info-soft)",
                border: "1px solid color-mix(in oklab, var(--info) 18%, white)",
                display: "flex", gap: 12, fontSize: 12.5, color: "var(--info-text)",
              }}>
                <Icon.Sparkle s={16} />
                <div style={{ flex: 1, color: "var(--text-secondary)" }}>
                  <div style={{ fontWeight: 600, color: "var(--info-text)", marginBottom: 2 }}>Что произойдёт после создания</div>
                  <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
                    <li>Создан tenant «Солнышко» (slug <Mono>sunshine</Mono>)</li>
                    <li>Создан admin с ролью <Mono>admin</Mono> в kindergarten</li>
                    <li>Welcome-SMS на <Mono>+7 700 123 45 67</Mono></li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 28, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="secondary" icon={<Icon.ChevronLeft />}>Назад</Button>
              <Button variant="primary">Создать садик</Button>
            </div>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

function PlanCard({ name, price, features, active }) {
  return (
    <div style={{
      padding: 14,
      border: `1px solid ${active ? "var(--brand)" : "var(--border-default)"}`,
      background: active ? "var(--brand-soft)" : "var(--bg-surface)",
      borderRadius: 8,
      cursor: "pointer",
      position: "relative",
    }}>
      {active && (
        <div style={{ position: "absolute", top: 10, right: 10, width: 16, height: 16, borderRadius: 999, background: "var(--brand)", display: "grid", placeItems: "center", color: "white" }}>
          <Icon.Check s={11} />
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: 13, color: active ? "var(--brand-text-on-soft)" : "var(--text-primary)" }}>{name}</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 8, fontFamily: "var(--font-mono)" }}>{price} / мес</div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
        {features.map(f => <li key={f} style={{ fontSize: 11.5, color: "var(--text-secondary)", display: "flex", gap: 6, alignItems: "center" }}>
          <Icon.Check s={11} /> {f}
        </li>)}
      </ul>
    </div>
  );
}

function LangCard({ code, name, active }) {
  return (
    <div style={{
      padding: "10px 12px",
      border: `1px solid ${active ? "var(--brand)" : "var(--border-default)"}`,
      background: active ? "var(--brand-soft)" : "var(--bg-surface)",
      borderRadius: 7, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: active ? "var(--brand-text-on-soft)" : "var(--text-tertiary)" }}>{code}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
      {active && <Icon.Check s={13} style={{ color: "var(--brand)", marginLeft: "auto" }} />}
    </div>
  );
}

function Step({ n, label, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        background: done || active ? "var(--brand)" : "var(--bg-surface)",
        border: `1px solid ${done || active ? "var(--brand)" : "var(--border-strong)"}`,
        color: done || active ? "white" : "var(--text-tertiary)",
        fontSize: 11, fontWeight: 600, display: "grid", placeItems: "center",
      }}>{done ? <Icon.Check s={12} /> : n}</div>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--text-primary)" : "var(--text-tertiary)" }}>{label}</span>
    </div>
  );
}

// =========================================================================
// SHELL
// =========================================================================
function Shell({ children, active, breadcrumbs, showSearch, search }) {
  return (
    <div className="ab" style={{ flexDirection: "row" }}>
      <Sidebar active={active} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Topbar breadcrumbs={breadcrumbs} showSearch={showSearch} searchPlaceholder={search} />
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Body({ children }) {
  return <div style={{ padding: 24, flex: 1 }}>{children}</div>;
}

// ---------- Table primitives ----------
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13 };

function Th({ children, style, sortable, active }) {
  return (
    <th style={{
      textAlign: "left", padding: "10px 14px",
      fontSize: 11.5, fontWeight: 500, color: "var(--text-tertiary)",
      textTransform: "uppercase", letterSpacing: 0.4,
      background: "var(--bg-surface-2)",
      borderBottom: "1px solid var(--border-default)",
      cursor: sortable ? "pointer" : "default",
      ...style,
    }}>{children}</th>
  );
}

function Td({ children, style, colSpan }) {
  return (
    <td colSpan={colSpan} style={{
      padding: "10px 14px",
      borderBottom: "1px solid var(--border-subtle)",
      verticalAlign: "middle",
      ...style,
    }}>{children}</td>
  );
}

const trStyle = (i) => ({ background: "var(--bg-surface)" });

function CheckBox({ checked }) {
  return (
    <div style={{
      width: 15, height: 15, borderRadius: 4,
      border: `1px solid ${checked ? "var(--brand)" : "var(--border-strong)"}`,
      background: checked ? "var(--brand)" : "var(--bg-surface)",
      display: "grid", placeItems: "center",
    }}>
      {checked && <Icon.Check s={10} style={{ color: "white" }} />}
    </div>
  );
}

const iconBtnSm = {
  display: "grid", placeItems: "center",
  width: 26, height: 26, border: "none", background: "transparent",
  color: "var(--text-tertiary)", borderRadius: 5, cursor: "pointer",
};

function Row({ children, between, gap = 8, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap,
      justifyContent: between ? "space-between" : undefined,
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, {
  ScreenLogin, ScreenDashboard, ScreenKindergartens, ScreenKgCreate, ScreenKgCreateStep2,
  Shell, Body, Row, Th, Td, CheckBox, tableStyle, trStyle, iconBtnSm,
});
