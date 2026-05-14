/* Screens: Kindergarten Detail (tabs: Overview, Settings, Subscription, Flags, View-as) */

function KgHeader({ activeTab, deactivated }) {
  return (
    <>
      <div style={{
        padding: "16px 28px 14px",
        borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
      }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: 12.5, padding: 0, cursor: "pointer", marginBottom: 8 }}>
          <Icon.ArrowLeft s={12} /> Все садики
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <Row gap={10} style={{ marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>Солнышко</h1>
              {!deactivated
                ? <Badge tone="success" dot>Активен</Badge>
                : <Badge tone="neutral" dot>Неактивен</Badge>}
              <Badge tone="brand">Pro</Badge>
              <Badge tone="success" dot>Подписка active</Badge>
            </Row>
            <Row gap={14} style={{ color: "var(--text-tertiary)", fontSize: 12.5 }}>
              <Mono>sunshine</Mono>
              <span>·</span>
              <span>Алматы, ул. Абая 10</span>
              <span>·</span>
              <Mono>+7 727 222 33 44</Mono>
              <span>·</span>
              <span>создан 15 янв 2026</span>
            </Row>
          </div>

          <Row gap={8}>
            <Button variant="secondary" icon={<Icon.Eye />}>View as</Button>
            <Button variant="destructive-outline" icon={<Icon.Alert />}>Деактивировать</Button>
          </Row>
        </div>
      </div>

      <Tabs
        tabs={["Обзор", "Настройки", "Подписка", "Feature Flags", "View as"]}
        active={activeTab}
      />
    </>
  );
}

// =========================================================================
// TAB: OVERVIEW
// =========================================================================
function ScreenKgOverview() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко"]}>
      <KgHeader activeTab="Обзор" />
      <Body>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <KpiCard label="Активных детей" value="42" delta="+3 за месяц" tone="success" />
          <KpiCard label="Архивных детей" value="8" delta="2 в этом году" />
          <KpiCard label="Активных staff" value="12" delta="1 admin · 11 teacher" />
          <KpiCard label="Групп" value="5" delta="2 младшие · 3 старшие" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Subscription card */}
          <Card>
            <Row between style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Подписка</h3>
              <Badge tone="success" dot>active</Badge>
            </Row>
            <KV rows={[
              ["План", <Badge tone="brand">Pro</Badge>],
              ["Сумма", <Mono>90 000 ₸ / месяц</Mono>],
              ["Начало", "15 января 2026"],
              ["Следующий биллинг", <span><Mono>18 мая 2026</Mono> <span style={{ color: "var(--warning-text)", fontSize: 11.5 }}>· через 2 дня</span></span>],
              ["Отменён", <span style={{ color: "var(--text-quaternary)" }}>—</span>],
            ]}/>
            <Button variant="secondary" fullWidth style={{ marginTop: 14 }} iconRight={<Icon.ChevronRight />}>
              Управлять подпиской
            </Button>
          </Card>

          {/* System info */}
          <Card>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Системная информация</h3>
            <KV rows={[
              ["ID", <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mono style={{ color: "var(--text-secondary)" }}>01J7H2M8KQR3S5T9V0X2Y4Z6N8</Mono>
                <Icon.Copy s={12} style={{ color: "var(--text-quaternary)" }} />
              </span>],
              ["Slug", <Mono>sunshine</Mono>],
              ["Timezone", <Mono>Asia/Almaty</Mono>],
              ["Currency", <Mono>KZT</Mono>],
              ["Создан", <span>15 янв 2026 · <Mono style={{ color: "var(--text-quaternary)", fontSize: 11.5 }}>14:22 UTC</Mono></span>],
              ["Обновлён", <span>3 дня назад · <Mono style={{ color: "var(--text-quaternary)", fontSize: 11.5 }}>10 мая 11:08</Mono></span>],
            ]}/>
          </Card>
        </div>

        {/* Recent activity */}
        <Card style={{ marginTop: 16 }}>
          <Row between style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Активность в этом садике</h3>
            <Mono style={{ color: "var(--text-quaternary)", fontSize: 11 }}>последние 7 дней</Mono>
          </Row>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            <MiniStat label="Инвойсов выставлено" value="38" sub="за месяц · 3 800 000 ₸" />
            <MiniStat label="Stories опубликовано" value="24" sub="за неделю" divider />
            <MiniStat label="Failed jobs" value="0" sub="всё в норме" tone="success" divider />
          </div>
        </Card>
      </Body>
    </Shell>
  );
}

function KpiCard({ label, value, delta, tone }) {
  const c = tone === "success" ? "var(--success-text)" : "var(--text-tertiary)";
  return (
    <Card padding={16}>
      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.6, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: c, marginTop: 2 }}>{delta}</div>
    </Card>
  );
}

function MiniStat({ label, value, sub, divider, tone }) {
  const c = tone === "success" ? "var(--success-text)" : "var(--text-tertiary)";
  return (
    <div style={{
      padding: "4px 18px",
      borderLeft: divider ? "1px solid var(--border-subtle)" : "none",
    }}>
      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: c, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function KV({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "140px 1fr", gap: 12,
          padding: "8px 0",
          borderTop: i ? "1px solid var(--border-subtle)" : "none",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{k}</span>
          <span style={{ fontSize: 13 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// =========================================================================
// TAB: SETTINGS
// =========================================================================
function ScreenKgSettings() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко", "Настройки"]}>
      <KgHeader activeTab="Настройки" />
      <Body>
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>
          <Card padding={28}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>Основные</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--text-tertiary)" }}>
              Информация о тенанте и базовые настройки
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Название" required>
                  <Input value="Солнышко" />
                </Field>
                <Field label="Slug" hint="Slug нельзя изменить после создания">
                  <Input value="sunshine" mono disabled suffix={<Icon.Lock s={12} />} />
                </Field>
              </div>

              <Field label="Адрес">
                <Input value="Алматы, ул. Абая 10" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Телефон" required>
                  <Input value="+7 727 222 33 44" prefix={<Icon.Phone s={13} />} />
                </Field>
                <Field label="План">
                  <Select value="Pro" />
                </Field>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: 8, background: "var(--bg-surface-2)" }}>
                <Toggle on />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Тенант активен</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Для безопасной деактивации используйте красную кнопку в шапке</div>
                </div>
              </div>
            </div>

            <h3 style={{ margin: "28px 0 4px", fontSize: 15, fontWeight: 600 }}>Региональные</h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-tertiary)" }}>
              Часовой пояс и валюта тенанта
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Timezone"><Select value="Asia/Almaty" /></Field>
              <Field label="Currency"><Select value="KZT" /></Field>
            </div>

            <h3 style={{ margin: "28px 0 4px", fontSize: 15, fontWeight: 600 }}>Settings (JSONB)</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-tertiary)" }}>
              Произвольные настройки тенанта. Используются backend-сервисами по ключу.
            </p>

            <div style={{ border: "1px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
              {[
                ["otp_expiry_sec", "300", "Время жизни OTP-кода (сек)"],
                ["payment_grace_days", "5", "Льготный период перед переводом инвойса в overdue"],
                ["late_pickup_fee_kzt", "5 000", "Стоимость опоздания за ребёнком"],
                ["meal_upgrade_premium_pct", "15", "Премия за upgrade меню (%)"],
              ].map(([k, v, hint], i) => (
                <div key={k} style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 32px", gap: 12, alignItems: "center",
                  padding: "10px 12px",
                  borderTop: i ? "1px solid var(--border-subtle)" : "none",
                  background: "var(--bg-surface)",
                }}>
                  <div>
                    <Mono style={{ fontWeight: 500, fontSize: 12.5 }}>{k}</Mono>
                    <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{hint}</div>
                  </div>
                  <Input value={v} mono />
                  <button style={iconBtnSm}><Icon.Dots s={13} /></button>
                </div>
              ))}
            </div>

            <Button variant="ghost" size="sm" icon={<Icon.Plus />} style={{ marginTop: 8 }}>
              Добавить ключ
            </Button>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 28, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost">Отменить</Button>
              <Button variant="primary">Сохранить</Button>
            </div>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

// =========================================================================
// TAB: SUBSCRIPTION
// =========================================================================
function ScreenKgSubscription() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко", "Подписка"]}>
      <KgHeader activeTab="Подписка" />
      <Body>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, maxWidth: 1120, margin: "0 auto", width: "100%" }}>
          <Card padding={28}>
            <Row between style={{ marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Параметры подписки</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-tertiary)" }}>
                  SaaS-договор Shyraq ↔ Солнышко
                </p>
              </div>
              <Badge tone="success" dot>active</Badge>
            </Row>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="План"><Select value="Pro" /></Field>
                <Field label="Статус"><Select value="active" /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Период биллинга"><Select value="Monthly" /></Field>
                <Field label="Сумма" hint="В валюте тенанта (KZT)"><Input value="90 000" mono suffix="₸" /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Начало подписки"><Input value="15 января 2026" prefix={<Icon.Calendar s={13} />} /></Field>
                <Field label="Следующий биллинг" hint="Через 2 дня — пора выставлять счёт"><Input value="18 мая 2026" prefix={<Icon.Calendar s={13} />} /></Field>
              </div>
              <Field label="Отменён" hint="Заполняется автоматически при переводе в cancelled">
                <Input value="" placeholder="—" disabled />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost">Отменить</Button>
              <Row gap={8}>
                <Button variant="secondary">Отменить подписку</Button>
                <Button variant="primary">Сохранить</Button>
              </Row>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>Финансовая сводка</h4>
              <div style={{ padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>MRR</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>90 000 ₸</div>
              </div>
              <div style={{ padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Total за 4 месяца</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>360 000 ₸</div>
              </div>
            </Card>

            <Card>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>История изменений</h4>
              <Timeline events={[
                { time: "сейчас", text: "Подписка active", meta: "Иван П." },
                { time: "15 янв", text: "Создана подписка Pro", meta: "monthly · 90 000 ₸" },
              ]}/>
            </Card>
          </div>
        </div>
      </Body>
    </Shell>
  );
}

// =========================================================================
// TAB: FEATURE FLAGS (per-KG)
// =========================================================================
function ScreenKgFlags() {
  const flags = [
    { key: "face_id_enabled", value: "true", type: "bool", created: "2 нед. назад" },
    { key: "module.diagnostics_v2", value: "true", type: "bool", created: "1 мес. назад" },
    { key: "notifications.story_new", value: '{"push":true,"email":false}', type: "json", created: "3 мес. назад" },
    { key: "billing.grace_days_override", value: "10", type: "number", created: "3 мес. назад" },
  ];
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко", "Feature Flags"]}>
      <KgHeader activeTab="Feature Flags" />
      <Body>
        <Card padding={0}>
          <Row between style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Флаги для Солнышко</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>
                Локальные флаги переопределяют глобальные. Также действуют глобальные.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={<Icon.Plus />}>Добавить флаг</Button>
          </Row>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Value</Th>
                <Th style={{ width: 100 }}>Тип</Th>
                <Th style={{ width: 140 }}>Создан</Th>
                <Th style={{ width: 100 }}></Th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f, i) => (
                <tr key={f.key}>
                  <Td><Mono style={{ fontWeight: 500 }}>{f.key}</Mono></Td>
                  <Td>
                    {f.type === "bool"
                      ? <Row gap={8}><Toggle on={f.value === "true"} /><Mono style={{ color: "var(--text-tertiary)" }}>{f.value}</Mono></Row>
                      : <Mono style={{
                          background: "var(--bg-surface-2)", padding: "2px 7px", borderRadius: 4,
                          color: "var(--text-secondary)", fontSize: 11.5, maxWidth: 320,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block",
                        }}>{f.value}</Mono>}
                  </Td>
                  <Td><Badge tone="neutral">{f.type}</Badge></Td>
                  <Td><span style={{ color: "var(--text-secondary)" }}>{f.created}</span></Td>
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

          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)" }}>
            <Row gap={8} style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
              <Icon.Sparkle s={13} />
              <span>Глобальные флаги, действующие также: <Mono style={{ color: "var(--text-secondary)" }}>module.face_id, notifications.email_digest, ui.dark_mode</Mono></span>
            </Row>
          </div>
        </Card>
      </Body>
    </Shell>
  );
}

// =========================================================================
// TAB: VIEW-AS (placeholder)
// =========================================================================
function ScreenKgViewAs() {
  return (
    <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко", "View as"]}>
      <KgHeader activeTab="View as" />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <Card style={{ maxWidth: 520, textAlign: "center", padding: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 18px",
            background: "var(--bg-surface-2)", border: "1px solid var(--border-default)",
            display: "grid", placeItems: "center", color: "var(--text-tertiary)",
            position: "relative",
          }}>
            <Icon.Eye s={26} />
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: 999, background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              display: "grid", placeItems: "center", color: "var(--text-tertiary)",
            }}>
              <Icon.Lock s={11} />
            </div>
          </div>

          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
            Read-only impersonation недоступно
          </h3>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Просмотр данных садика глазами админа kg в этой версии не реализован. Для базовой статистики используйте вкладку <b>Обзор</b>.
          </p>
          <p style={{ margin: "12px 0 18px", fontSize: 12.5, color: "var(--text-tertiary)", lineHeight: 1.55 }}>
            Если нужно помочь админу садика — попросите его сделать скриншот или share screen, либо запросите доступ к БД у команды разработки.
          </p>

          <Button variant="secondary" size="sm">Перейти к Обзору</Button>
        </Card>
      </div>
    </Shell>
  );
}

Object.assign(window, {
  ScreenKgOverview, ScreenKgSettings, ScreenKgSubscription, ScreenKgFlags, ScreenKgViewAs,
  KgHeader,
});
