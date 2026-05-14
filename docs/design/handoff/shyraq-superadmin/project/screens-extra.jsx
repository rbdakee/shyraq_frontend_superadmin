/* Screens: Users/new, Users/:id, 404, 403, 500 */

// =========================================================================
// USER NEW
// =========================================================================
function ScreenUserNew() {
  return (
    <Shell active="users" breadcrumbs={["Главная", "Пользователи", "Новый"]}>
      <PageHeader
        title="Новый SaaS пользователь"
        subtitle="Создать сотрудника платформы (super_admin или support)"
        back="Все пользователи"
      />
      <Body>
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
          <Card padding={28}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="ФИО" required>
                <Input value="Айгүл Серікова" />
              </Field>

              <Field label="Email" required hint="На этот адрес отправляются служебные уведомления">
                <Input value="aigul@shyraq.kz" />
              </Field>

              <Field label="Телефон" hint="Опционально · E.164 формат">
                <Input placeholder="+7 700 000 00 00" prefix={<Icon.Phone s={13} />} />
              </Field>

              <Field label="Пароль" required hint="Минимум 8 символов">
                <Input value="••••••••••••" suffix={<Icon.Eye s={14} />} />
              </Field>

              <Field label="Подтверждение пароля" required>
                <Input value="••••••••••••" suffix={<Icon.Eye s={14} />} />
              </Field>

              <Field label="Роль" required>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <RoleCard role="super_admin" name="super_admin" description="Полный доступ ко всем тенантам и операциям" tone="purple" active />
                  <RoleCard role="support" name="support" description="Read-mostly + retry failed jobs" tone="blue" />
                </div>
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost">Отмена</Button>
              <Button variant="primary">Создать пользователя</Button>
            </div>
          </Card>

          {/* Info alert */}
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 8,
            background: "var(--info-soft)",
            border: "1px solid color-mix(in oklab, var(--info) 18%, white)",
            display: "flex", gap: 12,
          }}>
            <Icon.Sparkle s={16} style={{ color: "var(--info-text)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: "var(--info-text)" }}>Передача пароля</span>
              <p style={{ margin: "2px 0 0" }}>
                После создания передайте пароль офлайн (Slack DM, личная встреча). Email с паролем <b>не отправляется</b> — это решение безопасности.
              </p>
            </div>
          </div>
        </div>
      </Body>
    </Shell>
  );
}

function RoleCard({ name, description, tone, active }) {
  const colors = {
    purple: { strong: "var(--role-super)", soft: "var(--role-super-soft)", text: "var(--role-super-text)" },
    blue:   { strong: "var(--role-support)", soft: "var(--role-support-soft)", text: "var(--role-support-text)" },
  }[tone];
  return (
    <div style={{
      padding: 12,
      border: `1px solid ${active ? colors.strong : "var(--border-default)"}`,
      background: active ? colors.soft : "var(--bg-surface)",
      borderRadius: 7, cursor: "pointer",
      position: "relative",
    }}>
      {active && (
        <div style={{ position: "absolute", top: 10, right: 10, width: 14, height: 14, borderRadius: 999, background: colors.strong, display: "grid", placeItems: "center", color: "white" }}>
          <Icon.Check s={10} />
        </div>
      )}
      <Mono style={{
        fontWeight: 600, fontSize: 12.5,
        color: active ? colors.text : "var(--text-primary)",
      }}>{name}</Mono>
      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.45 }}>{description}</div>
    </div>
  );
}

// =========================================================================
// USER EDIT
// =========================================================================
function ScreenUserEdit() {
  return (
    <Shell active="users" breadcrumbs={["Главная", "Пользователи", "Иван Петров"]}>
      <div style={{
        padding: "16px 28px 14px",
        borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
      }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: 12.5, padding: 0, cursor: "pointer", marginBottom: 8 }}>
          <Icon.ArrowLeft s={12} /> Все пользователи
        </button>
        <Row gap={14}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            background: "var(--role-super-soft)", color: "var(--role-super-text)",
            display: "grid", placeItems: "center",
            fontSize: 14, fontWeight: 600,
          }}>ИП</div>
          <div style={{ flex: 1 }}>
            <Row gap={10} style={{ marginBottom: 2 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>Иван Петров</h1>
              <Badge tone="purple">super_admin</Badge>
              <Badge tone="success" dot>Активен</Badge>
              <Badge tone="neutral">это вы</Badge>
            </Row>
            <Row gap={14} style={{ color: "var(--text-tertiary)", fontSize: 12.5 }}>
              <Mono>ivan@shyraq.kz</Mono>
              <span>·</span>
              <span>создан 10 нояб 2025</span>
              <span>·</span>
              <span>последний вход — сейчас</span>
            </Row>
          </div>
        </Row>
      </div>

      <Body>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Profile */}
          <Card padding={24}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Профиль</h3>
            <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--text-tertiary)" }}>
              Имя, контакты и роль
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="ФИО" required>
                <Input value="Иван Петров" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Email" hint="Email нельзя изменить">
                  <Input value="ivan@shyraq.kz" disabled mono suffix={<Icon.Lock s={12} />} />
                </Field>
                <Field label="Телефон">
                  <Input value="+7 700 555 12 34" prefix={<Icon.Phone s={13} />} />
                </Field>
              </div>

              <Field label="Роль" required>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <RoleCard role="super_admin" name="super_admin" description="Полный доступ ко всем тенантам и операциям" tone="purple" active />
                  <RoleCard role="support" name="support" description="Read-mostly + retry failed jobs" tone="blue" />
                </div>
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost">Отменить</Button>
              <Button variant="primary">Сохранить</Button>
            </div>
          </Card>

          {/* Change password */}
          <Card padding={24}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Сменить пароль</h3>
            <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--text-tertiary)" }}>
              После смены пользователю придётся войти заново — все активные сессии будут завершены
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Новый пароль" required hint="Минимум 8 символов">
                <Input placeholder="••••••••••••" suffix={<Icon.Eye s={14} />} />
              </Field>
              <Field label="Подтверждение" required>
                <Input placeholder="••••••••••••" suffix={<Icon.Eye s={14} />} />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Button variant="secondary" icon={<Icon.Lock />}>Изменить пароль</Button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card padding={0} style={{
            border: "1px solid color-mix(in oklab, var(--error) 25%, white)",
            background: "var(--bg-surface)",
          }}>
            <div style={{
              padding: "14px 20px",
              background: "var(--error-soft)",
              borderBottom: "1px solid color-mix(in oklab, var(--error) 20%, white)",
              borderRadius: "10px 10px 0 0",
            }}>
              <Row gap={10}>
                <Icon.Alert s={16} style={{ color: "var(--error-text)" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--error-text)" }}>Опасная зона</div>
              </Row>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Active toggle */}
              <Row between>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Пользователь активен</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    Управляйте через destructive-кнопку ниже — здесь только индикатор
                  </div>
                </div>
                <Toggle on />
              </Row>

              <div style={{ height: 1, background: "var(--border-subtle)" }} />

              {/* Deactivate */}
              <Row between style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Деактивировать пользователя</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", maxWidth: 460 }}>
                    Аккаунт потеряет доступ к SuperAdmin. Действие можно отменить через реактивацию.
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <Button variant="destructive-outline" icon={<Icon.Alert />} style={{ opacity: 0.55, cursor: "not-allowed" }}>
                    Деактивировать
                  </Button>
                  {/* Tooltip */}
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "var(--text-primary)", color: "white",
                    padding: "5px 10px", borderRadius: 5,
                    fontSize: 11.5, whiteSpace: "nowrap",
                    boxShadow: "var(--shadow-md)",
                  }}>
                    Нельзя деактивировать самого себя
                    <div style={{
                      position: "absolute", top: -3, right: 14,
                      width: 6, height: 6, background: "var(--text-primary)",
                      transform: "rotate(45deg)",
                    }} />
                  </div>
                </div>
              </Row>
            </div>
          </Card>
        </div>
      </Body>
    </Shell>
  );
}

// =========================================================================
// ERROR PAGES — shared layout
// =========================================================================
function ErrorPageLayout({ icon, iconTone = "neutral", iconBg, title, subtitle, children, actions }) {
  const iconColor = {
    neutral: "var(--text-tertiary)",
    error: "var(--error-text)",
  }[iconTone];
  const iconBgColor = iconBg || (iconTone === "error" ? "var(--error-soft)" : "var(--bg-surface-2)");
  const iconBorder = iconTone === "error" ? "color-mix(in oklab, var(--error) 20%, white)" : "var(--border-default)";

  return (
    <div style={{
      flex: 1, display: "grid", placeItems: "center", padding: 40,
      background: "var(--bg-app)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22, margin: "0 auto 24px",
          background: iconBgColor, border: `1px solid ${iconBorder}`,
          display: "grid", placeItems: "center", color: iconColor,
        }}>
          {React.cloneElement(icon, { s: 38 })}
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{title}</h1>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>{subtitle}</p>
        {children}
        {actions && (
          <Row gap={8} style={{ justifyContent: "center", marginTop: 22 }}>
            {actions}
          </Row>
        )}
      </div>
    </div>
  );
}

function ScreenError404() {
  return (
    <Shell active="" breadcrumbs={["Главная", "404"]}>
      <ErrorPageLayout
        icon={<Icon.Empty />}
        iconTone="neutral"
        title="Страница не найдена"
        subtitle="Возможно, ссылка устарела или содержит опечатку."
        actions={
          <>
            <Button variant="primary" icon={<Icon.ArrowLeft />}>На главную</Button>
            <Button variant="ghost">Назад</Button>
          </>
        }
      >
        <Mono style={{ fontSize: 11.5, color: "var(--text-quaternary)", display: "inline-block", marginTop: 4 }}>
          код: 404 · /kindergartens/01J7H2M8KQ
        </Mono>
      </ErrorPageLayout>
    </Shell>
  );
}

function ScreenError403() {
  return (
    <Shell active="" breadcrumbs={["Главная", "403"]}>
      <ErrorPageLayout
        icon={<Icon.Lock />}
        iconTone="neutral"
        title="Доступ запрещён"
        subtitle="У вашей роли нет прав для просмотра этой страницы."
        actions={
          <>
            <Button variant="primary" icon={<Icon.ArrowLeft />}>На главную</Button>
            <Button variant="ghost">Войти под другим пользователем</Button>
          </>
        }
      >
        <Mono style={{ fontSize: 11.5, color: "var(--text-quaternary)", display: "inline-block", marginTop: 4 }}>
          код: 403 · role: support · required: super_admin
        </Mono>
      </ErrorPageLayout>
    </Shell>
  );
}

function ScreenError500() {
  return (
    <Shell active="" breadcrumbs={["Главная", "500"]}>
      <ErrorPageLayout
        icon={<Icon.Alert />}
        iconTone="error"
        title="Что-то пошло не так"
        subtitle="Внутренняя ошибка сервера. Если проблема повторяется — свяжитесь с командой разработки."
        actions={
          <>
            <Button variant="primary" icon={<Icon.Refresh />}>Обновить</Button>
            <Button variant="ghost" icon={<Icon.ArrowLeft />}>На главную</Button>
          </>
        }
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginTop: 8, padding: "6px 12px",
          background: "var(--bg-surface-2)", border: "1px solid var(--border-default)",
          borderRadius: 7,
        }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Error ID</span>
          <Mono style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>abc123-7H2M8K-220514</Mono>
          <Icon.Copy s={12} style={{ color: "var(--text-quaternary)", cursor: "pointer" }} />
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--text-quaternary)" }}>
          ID отправлен в Sentry — приложите его при обращении
        </p>
      </ErrorPageLayout>
    </Shell>
  );
}

Object.assign(window, {
  ScreenUserNew, ScreenUserEdit, ScreenError404, ScreenError403, ScreenError500,
});
