/* Screens: Operations — Billing, Content, Schedule Rollout, Lifecycle DLQ */

// =========================================================================
// OPERATIONS · BILLING
// =========================================================================
function ScreenOpsBilling() {
  return (
    <Shell active="ops-billing" breadcrumbs={["Главная", "Операции", "Биллинг"]}>
      <PageHeader
        title="Биллинг · Ручные триггеры"
        subtitle="Запуск backend cron'ов вручную: для backfill, после deploy, для demo"
      />
      <Body>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16, alignItems: "start" }}>
          {/* Monthly billing (showing success result) */}
          <Card>
            <OpHeader
              icon={<Icon.Receipt />}
              title="Monthly Invoice Generation"
              cron="1-го числа · 02:00 Asia/Almaty"
              description="Генерация ежемесячных инвойсов родителям для всех активных садиков. Идемпотентно — пропускает уже сгенерированные."
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Period start" required hint="Только первое число месяца">
                <Input value="01.06.2026" prefix={<Icon.Calendar s={13} />} />
              </Field>
              <Field label="Kindergarten" hint="По умолчанию — все активные">
                <Select value="Все активные (42)" />
              </Field>
            </div>

            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 16 }} fullWidth>
              Запустить генерацию
            </Button>

            {/* Result */}
            <div style={{ marginTop: 18, padding: 16, background: "var(--bg-surface-2)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              <Row between style={{ marginBottom: 10 }}>
                <Row gap={8}>
                  <Badge tone="success" dot>Success</Badge>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Последний запуск · 1 мая 2026, 02:00 (auto)</span>
                </Row>
                <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>длительность 47с</Mono>
              </Row>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <ResultStat value="42" label="Садиков обработано" />
                <ResultStat value="156" label="Инвойсов создано" tone="success" />
                <ResultStat value="12" label="Пропущено" tone="info" />
              </div>
            </div>
          </Card>

          {/* Discount expire */}
          <Card>
            <OpHeader
              icon={<Icon.Sparkle />}
              title="Discount Expire Run"
              cron="ежедневно · 03:00 Asia/Almaty"
              description="Закрытие истёкших custom-скидок: status active → expired."
            />
            <Field label="Kindergarten">
              <Select value="Все активные" />
            </Field>
            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 16 }} fullWidth>Запустить</Button>

            <div style={{ marginTop: 18, padding: 14, background: "var(--bg-surface-2)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              <Row between>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Последний запуск</span>
                <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>13 мая, 03:00</Mono>
              </Row>
              <Row between style={{ marginTop: 8 }}>
                <span style={{ fontSize: 13 }}>Закрыто скидок</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>7</span>
              </Row>
            </div>
          </Card>

          {/* Overdue sweep (showing pending state) */}
          <Card>
            <OpHeader
              icon={<Icon.Alert />}
              title="Overdue Invoice Sweep"
              cron="ежедневно · 03:00 Asia/Almaty"
              description="Перевод pending/partial → overdue для просроченных. Async — отвечает 202."
            />
            <Field label="Now override" hint="ISO datetime для backfill, можно оставить пустым">
              <Input placeholder="2026-05-13T00:00:00" mono />
            </Field>
            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 16 }} fullWidth>Запустить</Button>

            <div style={{ marginTop: 18, padding: 14, background: "var(--info-soft)", borderRadius: 8, border: "1px solid color-mix(in oklab, var(--info) 18%, white)" }}>
              <Row gap={10}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--info)", marginTop: 4, animation: "pulse 2s infinite" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--info-text)", fontWeight: 600 }}>Enqueued · ожидает worker'а</div>
                  <Mono style={{ fontSize: 11, color: "var(--text-tertiary)" }}>job_id: bullmq-overdue-1747107600</Mono>
                </div>
              </Row>
            </div>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

function OpHeader({ icon, title, cron, description }) {
  return (
    <>
      <Row gap={10} style={{ marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--brand-soft)", color: "var(--brand-text-on-soft)", display: "grid", placeItems: "center" }}>
          {React.cloneElement(icon, { s: 15 })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>{cron}</Mono>
        </div>
      </Row>
      <p style={{ margin: "8px 0 16px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{description}</p>
    </>
  );
}

function ResultStat({ value, label, tone }) {
  const c = tone === "success" ? "var(--success-text)" : tone === "info" ? "var(--info-text)" : "var(--text-primary)";
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: c }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}

// =========================================================================
// OPERATIONS · CONTENT
// =========================================================================
function ScreenOpsContent() {
  return (
    <Shell active="ops-content" breadcrumbs={["Главная", "Операции", "Контент"]}>
      <PageHeader
        title="Контент · Ручные триггеры"
        subtitle="Birthday-посты, очистка stories, публикация scheduled-постов"
      />
      <Body>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <Card>
            <OpHeader
              icon={<Icon.Sparkle />}
              title="Birthday Posts"
              cron="ежедневно · 07:00 Almaty"
              description="Создаёт content_posts (type=birthday) для именинников дня. Идемпотентно."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Date" hint="Default — сегодня">
                <Input value="13.05.2026" prefix={<Icon.Calendar s={13} />} />
              </Field>
              <Field label="Kindergarten"><Select value="Все активные" /></Field>
            </div>
            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 16 }} fullWidth>Запустить</Button>
            <ResultPanel rows={[["Постов создано", "3"], ["Пропущено", "2"]]} timestamp="сегодня · 07:00" />
          </Card>

          <Card>
            <OpHeader
              icon={<Icon.X />}
              title="Story Cleanup"
              cron="ежечасно"
              description="Удаляет истёкшие stories из БД и FileStorage. Необратимо."
            />
            <Field label="Kindergarten"><Select value="Все активные" /></Field>

            <div style={{ marginTop: 12, padding: 12, background: "var(--warning-soft)", borderRadius: 7, border: "1px solid color-mix(in oklab, var(--warning) 30%, white)" }}>
              <Row gap={8} style={{ fontSize: 12, color: "var(--warning-text)" }}>
                <Icon.Alert s={14} />
                <span><b>Необратимая операция.</b> Удаляет файлы из FileStorage.</span>
              </Row>
            </div>

            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 12 }} fullWidth>Запустить</Button>
            <ResultPanel rows={[["Удалено", "14"]]} timestamp="12 мин назад" />
          </Card>

          <Card>
            <OpHeader
              icon={<Icon.FileText />}
              title="Publish Scheduled Posts"
              cron="каждые 5 мин"
              description="Переводит scheduled → published для постов, у которых scheduled_for ≤ now."
            />
            <Field label="Kindergarten"><Select value="Все активные" /></Field>
            <Button variant="primary" icon={<Icon.Play />} style={{ marginTop: 16 }} fullWidth>Запустить</Button>
            <ResultPanel rows={[["Опубликовано", "8"]]} timestamp="3 мин назад" />
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

function ResultPanel({ rows, timestamp }) {
  return (
    <div style={{ marginTop: 14, padding: 12, background: "var(--bg-surface-2)", borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
      <Row between style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Последний запуск</span>
        <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>{timestamp}</Mono>
      </Row>
      {rows.map(([k, v]) => (
        <Row between key={k} style={{ padding: "4px 0" }}>
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{k}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
        </Row>
      ))}
    </div>
  );
}

// =========================================================================
// OPERATIONS · SCHEDULE ROLLOUT
// =========================================================================
function ScreenOpsRollout() {
  const perKg = [
    { kg: "Солнышко", groups: "5 grp / 145 evt", meal: "5 plans", error: null },
    { kg: "Радуга", groups: "4 grp / 112 evt", meal: "4 plans", error: null },
    { kg: "Айналайын", groups: "8 grp / 268 evt", meal: "8 plans", error: null },
    { kg: "Балапан", groups: "3 grp / 78 evt", meal: "3 plans", error: null },
    { kg: "Күншуақ", groups: "5 grp / 145 evt", meal: "5 plans", error: null },
    { kg: "Звёздочка", groups: "3 grp / 0 evt", meal: "0 plans", error: "MealService: provider_id_not_set in kindergarten settings" },
    { kg: "Бөбек", groups: "4 grp / 116 evt", meal: "4 plans", error: null },
  ];
  return (
    <Shell active="ops-schedule" breadcrumbs={["Главная", "Операции", "Rollout недели"]}>
      <PageHeader
        title="Weekly Schedule + Meal Rollout"
        subtitle="Копирует расписание и меню со текущей недели на следующую для всех активных садиков"
      />
      <Body>
        <Card padding={24} style={{ marginBottom: 16 }}>
          <Row gap={14} style={{ marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-text-on-soft)", display: "grid", placeItems: "center" }}>
              <Icon.CalendarSync s={18} />
            </div>
            <div style={{ flex: 1 }}>
              <Mono style={{ fontSize: 11.5, color: "var(--text-quaternary)" }}>cron · каждое воскресенье 23:00 Asia/Almaty</Mono>
            </div>
          </Row>

          <p style={{ margin: "12px 0 18px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 720, lineHeight: 1.55 }}>
            Идемпотентно — пропускает уже скопированные группы и план-меню. Безопасно запускать повторно для backfill пропущенной недели.
          </p>

          <Row gap={12} style={{ alignItems: "flex-end" }}>
            <Field label="From Monday" required hint="Date picker привязан только к понедельникам">
              <Input value="12 мая 2026 · понедельник" prefix={<Icon.Calendar s={13} />} style={{ width: 280 }} />
            </Field>
            <Button variant="primary" icon={<Icon.Play />}>Запустить роллаут</Button>
          </Row>
        </Card>

        {/* Result */}
        <Card padding={0}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
            <Row between>
              <Row gap={10}>
                <Badge tone="success" dot>Завершено</Badge>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Результат запуска</span>
                <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>· 13 мая 2026, 10:32 (manual)</span>
              </Row>
              <Mono style={{ fontSize: 11.5, color: "var(--text-quaternary)" }}>длительность 1м 12с</Mono>
            </Row>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, marginTop: 16 }}>
              <ResultBlock label="Садиков" value="42" />
              <ResultBlock label="Групп скопировано" value="187" tone="success" divider />
              <ResultBlock label="Пропущено" value="23" divider />
              <ResultBlock label="Событий" value="5 421" divider />
              <ResultBlock label="Ошибок" value="1" tone="error" divider />
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Садик</Th>
                <Th>Schedule</Th>
                <Th>Meal</Th>
                <Th>Status</Th>
                <Th style={{ width: 40 }}></Th>
              </tr>
            </thead>
            <tbody>
              {perKg.map((r, i) => (
                <tr key={i}>
                  <Td><span style={{ fontWeight: 500 }}>{r.kg}</span></Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{r.groups}</Mono></Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{r.meal}</Mono></Td>
                  <Td>
                    {r.error
                      ? <Row gap={8}><Badge tone="error" dot>error</Badge><span style={{ fontSize: 12, color: "var(--error-text)" }}>{r.error}</span></Row>
                      : <Badge tone="success" dot>ok</Badge>}
                  </Td>
                  <Td>{r.error && <button style={iconBtnSm}><Icon.ChevronDown s={13} /></button>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Body>
    </Shell>
  );
}

function ResultBlock({ label, value, tone, divider }) {
  const c = tone === "success" ? "var(--success-text)" : tone === "error" ? "var(--error-text)" : "var(--text-primary)";
  return (
    <div style={{
      padding: "0 22px",
      borderLeft: divider ? "1px solid var(--border-subtle)" : "none",
    }}>
      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color: c, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// =========================================================================
// OPERATIONS · LIFECYCLE DLQ
// =========================================================================
function ScreenOpsDLQ() {
  const rows = [
    {
      id: "01J7H4A8KQ", processor: "pro-rata-refund", kg: "Солнышко",
      reason: "TimeoutError: PaymentProvider request timed out after 30000ms",
      attempts: "3 / 3", failedAt: "12 мин назад", finishedOn: "13 мая 10:20",
    },
    {
      id: "01J7H4A2BC", processor: "pro-rata-refund", kg: "Радуга",
      reason: "TypeError: Cannot read properties of null (reading 'tariff_plan_id')",
      attempts: "3 / 3", failedAt: "47 мин назад", finishedOn: "13 мая 09:45",
    },
    {
      id: "01J7G8M9XR", processor: "pro-rata-refund", kg: "Жұлдыз",
      reason: "ChildNotFound: child_id 01J6Z... was archived before refund calculation",
      attempts: "3 / 3", failedAt: "вчера 18:32", finishedOn: "12 мая 18:32",
    },
  ];
  return (
    <Shell active="ops-dlq" breadcrumbs={["Главная", "Операции", "Failed jobs"]}>
      <PageHeader
        title="Failed Jobs · Lifecycle DLQ"
        subtitle="Очередь failed jobs из BullMQ lifecycle queue · auto-cleanup через 30 дней"
        actions={<Button variant="secondary" icon={<Icon.Refresh />}>Обновить</Button>}
      />
      <Body>
        <Card padding={0}>
          <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <Select placeholder="Processor: все" style={{ width: 200 }} />
            <Select placeholder="Kindergarten: все" style={{ width: 200 }} />
            <Select placeholder="Failed in: 24h" style={{ width: 160 }} />
            <div style={{ flex: 1 }} />
            <Mono style={{ color: "var(--text-tertiary)", fontSize: 11.5 }}>3 jobs</Mono>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <Th style={{ width: 120 }}>ID</Th>
                <Th style={{ width: 160 }}>Processor</Th>
                <Th style={{ width: 130 }}>Kindergarten</Th>
                <Th>Failed reason</Th>
                <Th style={{ width: 90 }}>Attempts</Th>
                <Th style={{ width: 130 }}>Failed at</Th>
                <Th style={{ width: 100 }}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <React.Fragment key={r.id}>
                  <tr>
                    <Td><Mono style={{ color: "var(--text-secondary)", fontSize: 11.5 }}>{r.id}…</Mono></Td>
                    <Td><Badge tone="brand">{r.processor}</Badge></Td>
                    <Td><span style={{ fontSize: 13 }}>{r.kg}</span></Td>
                    <Td>
                      <Mono style={{
                        color: "var(--error-text)", fontSize: 11.5,
                        background: "var(--error-soft)", padding: "2px 7px", borderRadius: 4,
                        maxWidth: 380, display: "inline-block",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{r.reason}</Mono>
                    </Td>
                    <Td>
                      <Row gap={3}>
                        {[1,2,3].map(n => <span key={n} style={{ width: 10, height: 5, borderRadius: 1, background: "var(--error)" }} />)}
                      </Row>
                      <Mono style={{ fontSize: 10.5, color: "var(--text-quaternary)" }}>{r.attempts}</Mono>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12.5 }}>{r.failedAt}</span>
                      <Mono style={{ fontSize: 10.5, color: "var(--text-quaternary)", display: "block" }}>{r.finishedOn}</Mono>
                    </Td>
                    <Td>
                      <Row gap={4}>
                        <Button variant="outline" size="sm" icon={<Icon.Refresh />}>Retry</Button>
                      </Row>
                    </Td>
                  </tr>
                  {/* Expanded for first row */}
                  {i === 0 && (
                    <tr>
                      <Td colSpan={7} style={{ background: "var(--bg-surface-2)", padding: "14px 18px" }}>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
                          gap: 16,
                          alignItems: "stretch",
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <SectionHead>Payload</SectionHead>
                            <div style={{
                              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                              borderRadius: 6, padding: "8px 12px",
                            }}>
                              {[
                                ["kindergartenId", "01J7H2M8KQR3S5T9V0X"],
                                ["childId", "01J6Z9N7XR8T2W5Y3A6"],
                                ["tariffPlanId", "01J6Y8H5LM4N9P2K7B1"],
                                ["periodStart", "2026-05-01"],
                                ["periodEnd", "2026-05-31"],
                                ["archivedAt", "2026-05-13T10:18:42Z"],
                              ].map(([k, v], j) => (
                                <div key={k} style={{
                                  display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)",
                                  gap: 12, padding: "4px 0",
                                  borderTop: j ? "1px solid var(--border-subtle)" : "none",
                                }}>
                                  <Mono style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{k}</Mono>
                                  <Mono style={{ fontSize: 11.5, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</Mono>
                                </div>
                              ))}
                            </div>
                            <Row gap={6} style={{ marginTop: 8 }}>
                              <Button variant="ghost" size="sm" icon={<Icon.Copy />}>Copy JSON</Button>
                              <Button variant="ghost" size="sm" icon={<Icon.Building />}>Открыть Солнышко</Button>
                            </Row>
                          </div>

                          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <Row between style={{ marginBottom: 4 }}>
                              <SectionHead noMargin>Stack trace</SectionHead>
                              <Mono style={{ fontSize: 10.5, color: "var(--text-quaternary)" }}>finished_on 2026-05-13 10:20:14Z · queue: lifecycle</Mono>
                            </Row>
                            <pre style={{
                              margin: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.6,
                              color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
                              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                              borderRadius: 6, padding: "10px 12px", flex: 1,
                            }}>
                              <span style={{ color: "var(--error-text)", fontWeight: 600 }}>TimeoutError</span>: PaymentProvider request timed out after 30000ms{"\n"}
                              <span style={{ color: "var(--text-quaternary)" }}>{"  at "}</span>PaymentProvider.refund <span style={{ color: "var(--text-quaternary)" }}>(payment-provider.ts:142)</span>{"\n"}
                              <span style={{ color: "var(--text-quaternary)" }}>{"  at "}</span>ProRataRefundProcessor.execute <span style={{ color: "var(--text-quaternary)" }}>(pro-rata-refund.ts:67)</span>{"\n"}
                              <span style={{ color: "var(--text-quaternary)" }}>{"  at "}</span>Worker.processJob <span style={{ color: "var(--text-quaternary)" }}>(lifecycle-worker.ts:23)</span>
                            </pre>
                          </div>
                        </div>
                      </Td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      </Body>
    </Shell>
  );
}

const preStyle = {
  margin: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.55,
  color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
  borderRadius: 6, padding: 10,
};

function SectionHead({ children, noMargin }) {
  return (
    <div style={{
      fontSize: 10.5, color: "var(--text-tertiary)",
      textTransform: "uppercase", letterSpacing: 0.5,
      fontWeight: 600, marginBottom: noMargin ? 0 : 6,
    }}>{children}</div>
  );
}

// =========================================================================
// SYSTEM STATUS
// =========================================================================
function ScreenSystemStatus() {
  return (
    <Shell active="status" breadcrumbs={["Главная", "Статус системы"]}>
      <PageHeader
        title="Статус системы"
        subtitle="Health check каждые 30с · последнее обновление 3 сек назад"
        actions={<Button variant="secondary" icon={<Icon.Refresh />}>Refresh now</Button>}
      />
      <Body>
        <Card padding={24} style={{ marginBottom: 16, background: "linear-gradient(135deg, var(--success-soft), transparent 50%)" }}>
          <Row gap={14}>
            <div style={{ position: "relative", width: 40, height: 40 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 999,
                background: "var(--success)", opacity: 0.18,
              }} />
              <div style={{
                position: "absolute", inset: 8, borderRadius: 999, background: "var(--success)",
              }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Все системы работают нормально</h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-tertiary)" }}>
                Все 3 компонента отвечают · uptime сегодня <Mono>99.98%</Mono>
              </p>
            </div>
          </Row>
        </Card>

        <Card padding={0} style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Компоненты</h3>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Component</Th>
                <Th>Status</Th>
                <Th>Last check</Th>
                <Th>p95 response</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "API process", desc: "Node.js / Nest", p95: "47 ms" },
                { name: "PostgreSQL", desc: "primary · pgvector enabled", p95: "12 ms" },
                { name: "Redis", desc: "BullMQ + cache", p95: "3 ms" },
              ].map(c => (
                <tr key={c.name}>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>{c.desc}</Mono>
                  </Td>
                  <Td><Badge tone="success" dot>up</Badge></Td>
                  <Td><span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>5 сек назад</span></Td>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{c.p95}</Mono></Td>
                  <Td></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>История последних 10 проверок</h3>
            <Mono style={{ fontSize: 11, color: "var(--text-quaternary)" }}>in-memory · сбрасывается при reload</Mono>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>DB</Th>
                <Th>Redis</Th>
                <Th>API</Th>
                <Th>Result</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["08:32:15", "up", "up", "up", "ok"],
                ["08:31:45", "up", "up", "up", "ok"],
                ["08:31:15", "up", "down", "up", "degraded"],
                ["08:30:45", "up", "up", "up", "ok"],
                ["08:30:15", "up", "up", "up", "ok"],
                ["08:29:45", "up", "up", "up", "ok"],
              ].map((row, i) => (
                <tr key={i}>
                  <Td><Mono style={{ color: "var(--text-secondary)" }}>{row[0]}</Mono></Td>
                  {[1,2,3].map(idx => (
                    <Td key={idx}>{row[idx] === "up"
                      ? <Badge tone="success" dot>up</Badge>
                      : <Badge tone="error" dot>down</Badge>}
                    </Td>
                  ))}
                  <Td>{row[4] === "ok"
                    ? <Badge tone="success">OK</Badge>
                    : <Badge tone="warning">Degraded</Badge>}</Td>
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
  ScreenOpsBilling, ScreenOpsContent, ScreenOpsRollout, ScreenOpsDLQ, ScreenSystemStatus,
});
