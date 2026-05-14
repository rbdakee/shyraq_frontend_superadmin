/* Screens: Subscriptions cross-kg, Feature Flags cross-kg, Users, Users create/edit */

// =========================================================================
// SUBSCRIPTIONS (cross-kg)
// =========================================================================
function ScreenSubscriptions() {
  const rows = [
    { kg: "Айналайын", slug: "aynalayin", plan: "Enterprise", period: "yearly", amount: "1 800 000 ₸", status: "active", started: "12 дек 2025", next: "12 дек 2026", nextRel: "через 7 мес" },
    { kg: "Солнышко", slug: "sunshine", plan: "Pro", period: "monthly", amount: "90 000 ₸", status: "active", started: "15 янв 2026", next: "18 мая 2026", nextRel: "через 2 дня", warn: true },
    { kg: "Радуга", slug: "raduga", plan: "Pro", period: "monthly", amount: "90 000 ₸", status: "active", started: "2 фев 2026", next: "2 июня 2026", nextRel: "через 17 дней" },
    { kg: "Балапан", slug: "balapan", plan: "Pro", period: "monthly", amount: "0 ₸", status: "trial", started: "1 мая 2026", next: "1 июня 2026", nextRel: "через 16 дней" },
    { kg: "Бөбек", slug: "bobek", plan: "Standard", period: "monthly", amount: "50 000 ₸", status: "active", started: "8 нояб 2025", next: "8 июня 2026", nextRel: "через 23 дня" },
    { kg: "Жұлдыз", slug: "zhuldyz", plan: "Standard", period: "monthly", amount: "50 000 ₸", status: "suspended", started: "10 окт 2025", next: "10 мая 2026", nextRel: "просрочено на 3 дня", overdue: true },
    { kg: "Күншуақ", slug: "kunshuak", plan: "Pro", period: "yearly", amount: "1 080 000 ₸", status: "active", started: "5 июля 2025", next: "5 июля 2026", nextRel: "через 2 мес" },
    { kg: "Звёздочка", slug: "zvezdochka", plan: "Standard", period: "monthly", amount: "50 000 ₸", status: "cancelled", started: "1 сент 2025", next: "—", nextRel: "—", cancelled: "10 мар 2026" },
  ];

  return (
    <Shell active="subscriptions" breadcrumbs={["Главная", "Подписки"]}>
      <PageHeader title="Подписки" subtitle="Все SaaS-подписки Shyraq ↔ садики" />
      <Body>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <Card padding={16}>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>MRR</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 4 }}>2 540 000 ₸</div>
            <div style={{ fontSize: 11.5, color: "var(--success-text)", marginTop: 2 }}>+8% к прошлому месяцу</div>
          </Card>
          <Card padding={16}>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Active</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 4 }}>38</div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>87% от всех</div>
          </Card>
          <Card padding={16}>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Trial</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 4 }}>2</div>
            <div style={{ fontSize: 11.5, color: "var(--info-text)", marginTop: 2 }}>в работе</div>
          </Card>
          <Card padding={16}>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Suspended · Cancelled</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 4 }}>3 <span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>· 1</span></div>
            <div style={{ fontSize: 11.5, color: "var(--warning-text)", marginTop: 2 }}>1 просрочка</div>
          </Card>
        </div>

        <Card padding={0}>
          <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <Select placeholder="Статус: все" style={{ width: 150 }} />
            <Select placeholder="План: все" style={{ width: 130 }} />
            <Select placeholder="Период: все" style={{ width: 130 }} />
            <div style={{ flex: 1 }} />
            <Mono style={{ color: "var(--text-tertiary)", fontSize: 11.5 }}>сортировка: next_billing ↑</Mono>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Садик</Th>
                <Th>План</Th>
                <Th>Период</Th>
                <Th>Сумма</Th>
                <Th>Статус</Th>
                <Th>Начало</Th>
                <Th sortable active>Следующий биллинг ↑</Th>
                <Th style={{ width: 50 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{r.kg}</div>
                    <Mono style={{ color: "var(--text-quaternary)", fontSize: 11 }}>{r.slug}</Mono>
                  </Td>
                  <Td><Badge tone={r.plan === "Enterprise" ? "purple" : r.plan === "Pro" ? "brand" : "neutral"}>{r.plan}</Badge></Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{r.period}</Mono></Td>
                  <Td><Mono style={{ fontWeight: 500 }}>{r.amount}</Mono></Td>
                  <Td>
                    {r.status === "active" && <Badge tone="success" dot>active</Badge>}
                    {r.status === "trial" && <Badge tone="info" dot>trial</Badge>}
                    {r.status === "suspended" && <Badge tone="warning" dot>suspended</Badge>}
                    {r.status === "cancelled" && <Badge tone="neutral" dot>cancelled</Badge>}
                  </Td>
                  <Td><span style={{ color: "var(--text-secondary)" }}>{r.started}</span></Td>
                  <Td>
                    <div style={{ color: r.cancelled ? "var(--text-quaternary)" : "var(--text-primary)" }}>{r.next}</div>
                    <span style={{ fontSize: 11.5, color: r.overdue ? "var(--error-text)" : r.warn ? "var(--warning-text)" : "var(--text-quaternary)" }}>
                      {r.nextRel}
                    </span>
                  </Td>
                  <Td><button style={iconBtnSm}><Icon.Dots s={14} /></button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Body>
    </Shell>
  );
}

// =========================================================================
// FEATURE FLAGS (cross-kg)
// =========================================================================
function ScreenFeatureFlags() {
  const rows = [
    { key: "ui.dark_mode", scope: "global", value: "false", type: "bool", created: "2 мес. назад" },
    { key: "module.face_id", scope: "global", value: "true", type: "bool", created: "3 мес. назад" },
    { key: "face_id_enabled", scope: "kg:Солнышко", value: "true", type: "bool", created: "2 нед. назад" },
    { key: "module.diagnostics_v2", scope: "kg:Солнышко", value: "true", type: "bool", created: "1 мес. назад" },
    { key: "notifications.email_digest", scope: "global", value: '{"interval":"daily","time":"09:00"}', type: "json", created: "4 мес. назад" },
    { key: "billing.grace_days_override", scope: "kg:Жұлдыз", value: "10", type: "number", created: "3 мес. назад" },
    { key: "experiment.new_onboarding", scope: "kg:Балапан", value: "true", type: "bool", created: "2 дня назад" },
    { key: "notifications.story_new", scope: "global", value: "true", type: "bool", created: "5 мес. назад" },
  ];
  return (
    <Shell active="flags" breadcrumbs={["Главная", "Feature Flags"]}>
      <PageHeader
        title="Feature Flags"
        subtitle="Все флаги платформы · 8 записей"
        actions={<Button variant="primary" icon={<Icon.Plus />}>Новый флаг</Button>}
      />
      <Body>
        <Card padding={0}>
          <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <Input prefix={<Icon.Search s={13} />} placeholder="Поиск по key" style={{ width: 260 }} />
            <Select placeholder="Scope: все" style={{ width: 160 }} />
            <Select placeholder="Тип: все" style={{ width: 130 }} />
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Scope</Th>
                <Th>Value</Th>
                <Th style={{ width: 90 }}>Тип</Th>
                <Th>Создан</Th>
                <Th style={{ width: 100 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td><Mono style={{ fontWeight: 500 }}>{r.key}</Mono></Td>
                  <Td>
                    {r.scope === "global"
                      ? <Badge tone="brand" dot>Глобальный</Badge>
                      : <Row gap={6} style={{ fontSize: 12 }}><Icon.Building s={12} style={{ color: "var(--text-tertiary)" }} /><span style={{ color: "var(--text-secondary)" }}>{r.scope.replace("kg:", "")}</span></Row>}
                  </Td>
                  <Td>
                    {r.type === "bool"
                      ? <Row gap={8}><Toggle on={r.value === "true"} /><Mono style={{ color: "var(--text-tertiary)" }}>{r.value}</Mono></Row>
                      : <Mono style={{
                          background: "var(--bg-surface-2)", padding: "2px 7px", borderRadius: 4,
                          color: "var(--text-secondary)", fontSize: 11.5, maxWidth: 280,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block",
                        }}>{r.value}</Mono>}
                  </Td>
                  <Td><Badge tone="neutral">{r.type}</Badge></Td>
                  <Td><span style={{ color: "var(--text-secondary)" }}>{r.created}</span></Td>
                  <Td>
                    <Row gap={4}>
                      <button style={iconBtnSm}><Icon.FileText s={13} /></button>
                      <button style={iconBtnSm}><Icon.X s={13} /></button>
                    </Row>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Body>
    </Shell>
  );
}

// =========================================================================
// USERS
// =========================================================================
function ScreenUsers() {
  const rows = [
    { name: "Иван Петров", email: "ivan@shyraq.kz", role: "super_admin", active: true, last: "сейчас", you: true },
    { name: "Айгүл Серікова", email: "aigul@shyraq.kz", role: "super_admin", active: true, last: "2 часа назад" },
    { name: "Дамир Касенов", email: "damir@shyraq.kz", role: "support", active: true, last: "вчера" },
    { name: "Мария Ким", email: "maria@shyraq.kz", role: "support", active: true, last: "3 дня назад" },
    { name: "Алишер Бек", email: "alisher@shyraq.kz", role: "support", active: true, last: "1 нед. назад" },
    { name: "Тестовый Аккаунт", email: "test@shyraq.kz", role: "support", active: false, last: "никогда" },
  ];
  return (
    <Shell active="users" breadcrumbs={["Главная", "Пользователи"]} showSearch search="Поиск пользователя...">
      <PageHeader
        title="Пользователи"
        subtitle="Сотрудники Shyraq с доступом к SuperAdmin"
        actions={<Button variant="primary" icon={<Icon.Plus />}>Новый пользователь</Button>}
      />
      <Body>
        <Card padding={0}>
          <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <Input prefix={<Icon.Search s={13} />} placeholder="Поиск по ФИО или email" style={{ width: 280 }} />
            <Select placeholder="Роль: все" style={{ width: 140 }} />
            <Select placeholder="Статус: все" style={{ width: 140 }} />
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>ФИО</Th>
                <Th>Email</Th>
                <Th style={{ width: 130 }}>Роль</Th>
                <Th style={{ width: 130 }}>Статус</Th>
                <Th>Последний вход</Th>
                <Th style={{ width: 50 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td>
                    <Row gap={10}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 999,
                        background: r.role === "super_admin" ? "var(--role-super-soft)" : "var(--role-support-soft)",
                        color: r.role === "super_admin" ? "var(--role-super-text)" : "var(--role-support-text)",
                        display: "grid", placeItems: "center",
                        fontSize: 10.5, fontWeight: 600,
                      }}>{r.name.split(" ").map(x => x[0]).slice(0, 2).join("")}</div>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      {r.you && <Badge tone="neutral">это вы</Badge>}
                    </Row>
                  </Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{r.email}</Mono></Td>
                  <Td><Badge tone={r.role === "super_admin" ? "purple" : "blue"}>{r.role}</Badge></Td>
                  <Td>{r.active ? <Badge tone="success" dot>Активен</Badge> : <Badge tone="neutral" dot>Неактивен</Badge>}</Td>
                  <Td><span style={{ color: r.last === "никогда" ? "var(--text-quaternary)" : "var(--text-secondary)" }}>{r.last}</span></Td>
                  <Td><button style={iconBtnSm}><Icon.Dots s={14} /></button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Body>
    </Shell>
  );
}

Object.assign(window, {
  ScreenSubscriptions, ScreenFeatureFlags, ScreenUsers,
});
