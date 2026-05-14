/* Screens: Misc — Destructive modal, Global search palette, Empty/Error states, Mobile alert, Create FF modal */

// =========================================================================
// DESTRUCTIVE MODAL (deactivate KG)
// =========================================================================
function ScreenDestructiveModal() {
  return (
    <div className="ab" style={{ background: "var(--bg-canvas)", position: "relative" }}>
      {/* Dimmed shell underneath */}
      <Shell active="kindergartens" breadcrumbs={["Главная", "Садики", "Солнышко"]}>
        <KgHeader activeTab="Обзор" />
      </Shell>

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(20, 20, 28, 0.4)",
        display: "grid", placeItems: "center",
        backdropFilter: "blur(2px)",
      }}>
        <div style={{
          width: 520, background: "white", borderRadius: 12,
          boxShadow: "var(--shadow-overlay)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <Row gap={12}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--error-soft)", color: "var(--error-text)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon.Alert s={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Деактивировать садик «Солнышко»?</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-tertiary)" }}>
                  Действие можно отменить через реактивацию, но сущности нужно восстанавливать вручную
                </p>
              </div>
            </Row>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Это действие:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <li>Установит <Mono>is_active = false</Mono></li>
              <li>Архивирует <b>42</b> активных детей</li>
              <li>Отменит SaaS-подписку (status → <Mono>cancelled</Mono>)</li>
              <li>Admin садика потеряет доступ к Admin Web</li>
              <li>Pending инвойсы (<b>3 шт</b>) останутся — решите вручную</li>
            </ul>

            <div style={{ marginTop: 18 }}>
              <Field label="Для подтверждения введите slug садика" hint="">
                <Input value="sunsh" placeholder="sunshine" mono />
              </Field>
            </div>
          </div>

          <div style={{ padding: "12px 20px", background: "var(--bg-surface-2)", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--border-subtle)" }}>
            <Button variant="ghost">Отмена</Button>
            <Button variant="destructive" icon={<Icon.Alert />} style={{ opacity: 0.5 }}>Деактивировать</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// GLOBAL SEARCH (Cmd+K)
// =========================================================================
function ScreenGlobalSearch() {
  return (
    <div className="ab" style={{ background: "var(--bg-canvas)", position: "relative" }}>
      <Shell active="kindergartens" breadcrumbs={["Главная", "Садики"]} showSearch search="Поиск...">
        <PageHeader title="Садики" />
      </Shell>

      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(20, 20, 28, 0.35)",
        display: "flex", justifyContent: "center", paddingTop: 100,
        backdropFilter: "blur(2px)",
      }}>
        <div style={{
          width: 560, background: "white", borderRadius: 12,
          boxShadow: "var(--shadow-overlay)",
          border: "1px solid var(--border-default)",
          overflow: "hidden", height: "fit-content",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <Icon.Search s={16} style={{ color: "var(--text-tertiary)" }} />
            <input style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", color: "var(--text-primary)" }} defaultValue="солн" placeholder="Поиск садика, пользователя, операции..." />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-quaternary)", border: "1px solid var(--border-default)", padding: "2px 6px", borderRadius: 4 }}>ESC</span>
          </div>

          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <SearchGroup title="Садики">
              <SearchItem icon={<Icon.Building />} title="Солнышко" sub="sunshine · Pro · active" highlight />
              <SearchItem icon={<Icon.Building />} title="Күншуақ" sub="kunshuak · Pro · active" />
            </SearchGroup>
            <SearchGroup title="Пользователи">
              <SearchItem icon={<Icon.Users />} title="Иван Петров" sub="ivan@shyraq.kz · super_admin" />
            </SearchGroup>
            <SearchGroup title="Операции">
              <SearchItem icon={<Icon.Play />} title="Запустить monthly billing" sub="operations · billing" />
              <SearchItem icon={<Icon.Alert />} title="Открыть Lifecycle DLQ" sub="operations · failed jobs (3)" />
              <SearchItem icon={<Icon.CalendarSync />} title="Запустить weekly rollout" sub="operations · schedule" />
            </SearchGroup>
          </div>

          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)", display: "flex", gap: 16, fontSize: 11, color: "var(--text-tertiary)" }}>
            <Row gap={5}><Kbd>↑↓</Kbd> навигация</Row>
            <Row gap={5}><Kbd>↵</Kbd> открыть</Row>
            <Row gap={5}><Kbd>esc</Kbd> закрыть</Row>
            <div style={{ flex: 1 }} />
            <span>9 результатов</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchGroup({ title, children }) {
  return (
    <div>
      <div style={{ padding: "8px 18px 4px", fontSize: 10.5, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
function SearchItem({ icon, title, sub, highlight }) {
  return (
    <Row gap={12} style={{
      padding: "8px 18px",
      background: highlight ? "var(--bg-surface-2)" : "transparent",
      borderLeft: highlight ? "2px solid var(--brand)" : "2px solid transparent",
      cursor: "pointer",
    }}>
      <div style={{ width: 24, height: 24, borderRadius: 5, background: "var(--bg-surface-2)", color: "var(--text-tertiary)", display: "grid", placeItems: "center" }}>
        {React.cloneElement(icon, { s: 13 })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <Mono style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{sub}</Mono>
      </div>
      {highlight && <Icon.ChevronRight s={12} style={{ color: "var(--text-quaternary)" }} />}
    </Row>
  );
}
function Kbd({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, padding: "1px 5px", border: "1px solid var(--border-default)", borderRadius: 3, background: "white" }}>{children}</span>;
}

// =========================================================================
// CREATE FEATURE FLAG MODAL
// =========================================================================
function ScreenFlagCreate() {
  return (
    <div className="ab" style={{ background: "var(--bg-canvas)", position: "relative" }}>
      <Shell active="flags" breadcrumbs={["Главная", "Feature Flags"]}>
        <PageHeader title="Feature Flags" />
      </Shell>
      <div style={{ position: "absolute", inset: 0, background: "rgba(20, 20, 28, 0.4)", display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }}>
        <div style={{ width: 540, background: "white", borderRadius: 12, boxShadow: "var(--shadow-overlay)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Новый feature flag</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>Глобальный или для конкретного садика</p>
            </div>
            <button style={iconBtnSm}><Icon.X /></button>
          </div>

          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Scope" required>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <ScopeCard icon={<Icon.Globe />} title="Глобальный" sub="действует на всю платформу" active />
                <ScopeCard icon={<Icon.Building />} title="Для садика" sub="переопределяет глобальный" />
              </div>
            </Field>

            <Field label="Key" required hint="Латиница, цифры, точка для namespacing">
              <Input value="face_id_enabled" mono />
            </Field>

            <Field label="Value (JSON)" required>
              <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-default)", borderRadius: 7, overflow: "hidden" }}>
                <Row between style={{ padding: "6px 10px", background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <Row gap={6}>
                    <Badge tone="success" dot>valid JSON</Badge>
                    <Mono style={{ fontSize: 11, color: "var(--text-tertiary)" }}>type: boolean</Mono>
                  </Row>
                  <Row gap={4}>
                    <Button variant="ghost" size="sm">true</Button>
                    <Button variant="ghost" size="sm">false</Button>
                    <Button variant="ghost" size="sm">{`{}`}</Button>
                  </Row>
                </Row>
                <pre style={{ margin: 0, padding: 12, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-primary)", background: "white", minHeight: 80 }}>{`true`}</pre>
              </div>
            </Field>

            <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 7, fontSize: 12, color: "var(--text-tertiary)" }}>
              <Row gap={8}><Icon.Sparkle s={13} /><span>Простой toggle для boolean</span><Toggle on /></Row>
            </div>
          </div>

          <div style={{ padding: "12px 20px", background: "var(--bg-surface-2)", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--border-subtle)" }}>
            <Button variant="ghost">Отмена</Button>
            <Button variant="primary">Сохранить</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeCard({ icon, title, sub, active }) {
  return (
    <div style={{
      padding: 12,
      border: `1px solid ${active ? "var(--brand)" : "var(--border-default)"}`,
      background: active ? "var(--brand-soft)" : "var(--bg-surface)",
      borderRadius: 7, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 6, background: active ? "white" : "var(--bg-surface-2)", color: active ? "var(--brand-text-on-soft)" : "var(--text-tertiary)", display: "grid", placeItems: "center" }}>
        {React.cloneElement(icon, { s: 14 })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{sub}</div>
      </div>
      {active && <Icon.Check s={13} style={{ color: "var(--brand)" }} />}
    </div>
  );
}

// =========================================================================
// STATES: Empty, Loading, Error
// =========================================================================
function ScreenStates() {
  return (
    <div className="ab" style={{ background: "var(--bg-app)", padding: 28, gap: 16, display: "block", overflow: "auto" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Состояния DataTable</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-tertiary)", maxWidth: 720 }}>
        Каждая страница со списком имеет четыре основных состояния: loading (skeleton), loaded (есть данные), empty (нет данных) и error (ошибка запроса).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Loading */}
        <Card padding={0}>
          <Row between style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading (initial)</h4>
            <Badge tone="info" dot>loading</Badge>
          </Row>
          <div style={{ padding: "8px 14px" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 12, padding: "10px 0", borderTop: i > 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <Skel width={120 + (i*23) % 80} />
                <Skel width={60} />
                <Skel width={70} />
                <Skel width={40} />
              </div>
            ))}
          </div>
        </Card>

        {/* Empty */}
        <Card padding={0}>
          <Row between style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Empty (200 OK · 0 items)</h4>
            <Badge tone="neutral" dot>empty</Badge>
          </Row>
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-surface-2)", color: "var(--text-tertiary)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
              <Icon.Empty s={20} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Пока нет ни одного флага</div>
            <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--text-tertiary)" }}>Создайте первый feature flag для платформы</p>
            <Button variant="primary" size="sm" icon={<Icon.Plus />}>Новый флаг</Button>
          </div>
        </Card>

        {/* Error */}
        <Card padding={0}>
          <Row between style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Error (4xx/5xx)</h4>
            <Badge tone="error" dot>error</Badge>
          </Row>
          <div style={{ padding: 20 }}>
            <div style={{
              padding: 16, border: "1px solid color-mix(in oklab, var(--error) 25%, white)",
              background: "var(--error-soft)", borderRadius: 8,
            }}>
              <Row gap={12}>
                <Icon.Alert s={18} style={{ color: "var(--error-text)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--error-text)" }}>Не удалось загрузить</div>
                  <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>
                    Сервер ответил <Mono>500 internal_error</Mono>. Возможно, проблема временная.
                  </p>
                  <Mono style={{ fontSize: 10.5, color: "var(--text-tertiary)", display: "block", marginBottom: 12 }}>request_id: req-7H2M8K-220514-1032</Mono>
                  <Button variant="secondary" size="sm" icon={<Icon.Refresh />}>Повторить</Button>
                </div>
              </Row>
            </div>
          </div>
        </Card>

        {/* Refetching */}
        <Card padding={0}>
          <Row between style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Refetching (background)</h4>
            <Badge tone="info" dot>updating</Badge>
          </Row>
          <div style={{ height: 2, background: "var(--brand-soft)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, width: "40%", background: "var(--brand)", animation: "progress 1.4s linear infinite" }} />
          </div>
          <div style={{ padding: "8px 14px", opacity: 0.7 }}>
            {[
              ["Солнышко", "Pro", "active"],
              ["Радуга", "Pro", "active"],
              ["Балапан", "Pro", "trial"],
            ].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 12, padding: "9px 0", borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none", fontSize: 13 }}>
                <span>{r[0]}</span>
                <Badge tone="brand">{r[1]}</Badge>
                <Badge tone={r[2] === "trial" ? "info" : "success"} dot>{r[2]}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h2 style={{ margin: "32px 0 16px", fontSize: 16, fontWeight: 600 }}>Toasts</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <ToastDemo tone="success" title="Сохранено" body="Изменения применены к Солнышко" />
        <ToastDemo tone="info" title="Запуск..." body="Генерация инвойсов · 47с" loading />
        <ToastDemo tone="error" title="Ошибка" body="Не удалось деактивировать (500)" action="Повторить" />
        <ToastDemo tone="warning" title="Сессия истекает" body="Войдите снова через 2 минуты" action="Продлить" />
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function Skel({ width = 100, height = 12 }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, var(--bg-surface-2), var(--border-subtle), var(--bg-surface-2))",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.6s ease-in-out infinite",
    }} />
  );
}

function ToastDemo({ tone, title, body, action, loading }) {
  const map = {
    success: { dot: "var(--success)", bg: "var(--bg-surface)" },
    info: { dot: "var(--info)", bg: "var(--bg-surface)" },
    error: { dot: "var(--error)", bg: "var(--bg-surface)" },
    warning: { dot: "var(--warning)", bg: "var(--bg-surface)" },
  }[tone];
  return (
    <div style={{
      background: map.bg, border: "1px solid var(--border-default)",
      borderRadius: 8, padding: 12,
      boxShadow: "var(--shadow-md)",
      display: "flex", gap: 10,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: map.dot,
        marginTop: 4, flexShrink: 0,
        animation: loading ? "pulse 1.2s infinite" : undefined,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        <p style={{ margin: "2px 0 6px", fontSize: 12, color: "var(--text-tertiary)" }}>{body}</p>
        {action && <a style={{ fontSize: 12, color: "var(--brand)", fontWeight: 500 }}>{action}</a>}
      </div>
      <button style={{ ...iconBtnSm, marginTop: -2 }}><Icon.X s={12} /></button>
    </div>
  );
}

// =========================================================================
// MOBILE NOT SUPPORTED
// =========================================================================
function ScreenMobileAlert() {
  return (
    <div className="ab ab--centered" style={{ background: "var(--bg-canvas)", padding: 40 }}>
      <Card style={{ maxWidth: 380, textAlign: "center", padding: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 18px",
          background: "var(--warning-soft)", color: "var(--warning-text)",
          display: "grid", placeItems: "center",
        }}>
          <Icon.Phone s={24} />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 600 }}>Только desktop / tablet</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          SuperAdmin — внутренний инструмент. Доступен на экранах от <Mono>768px</Mono>.
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-tertiary)" }}>
          Откройте кабинет на компьютере или планшете в горизонтальной ориентации.
        </p>
      </Card>
    </div>
  );
}

Object.assign(window, {
  ScreenDestructiveModal, ScreenGlobalSearch, ScreenFlagCreate, ScreenStates,
  ScreenMobileAlert, Skel, ToastDemo,
});
