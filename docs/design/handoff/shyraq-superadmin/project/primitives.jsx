/* Shared UI primitives for SuperAdmin design mocks */
const { useState } = React;

// ---------- Icons (Lucide-style minimal stroke set) ----------
const I = {
  size: (s = 16) => ({ width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" }),
};
const Icon = {
  Home:        (p) => <svg {...I.size(p?.s)}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>,
  Building:    (p) => <svg {...I.size(p?.s)}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 21V12h6v9" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" /></svg>,
  Card:        (p) => <svg {...I.size(p?.s)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
  Flag:        (p) => <svg {...I.size(p?.s)}><path d="M4 21V4" /><path d="M4 5h13l-2 4 2 4H4" /></svg>,
  Users:       (p) => <svg {...I.size(p?.s)}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4a3.5 3.5 0 0 1 0 7" /><path d="M21 20c0-2.5-1.7-4.6-4-5.3" /></svg>,
  Receipt:     (p) => <svg {...I.size(p?.s)}><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>,
  FileText:    (p) => <svg {...I.size(p?.s)}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h5" /></svg>,
  CalendarSync:(p) => <svg {...I.size(p?.s)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /><path d="M14 16a2.5 2.5 0 1 0-1 3" /><path d="m15 19-2 0 0-2" /></svg>,
  Alert:       (p) => <svg {...I.size(p?.s)}><path d="M12 3 2 21h20Z" /><path d="M12 10v5" /><path d="M12 18h.01" /></svg>,
  Activity:    (p) => <svg {...I.size(p?.s)}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>,
  ChevronDown: (p) => <svg {...I.size(p?.s)}><path d="m6 9 6 6 6-6" /></svg>,
  ChevronRight:(p) => <svg {...I.size(p?.s)}><path d="m9 6 6 6-6 6" /></svg>,
  ChevronLeft: (p) => <svg {...I.size(p?.s)}><path d="m15 6-6 6 6 6" /></svg>,
  Search:      (p) => <svg {...I.size(p?.s)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  Plus:        (p) => <svg {...I.size(p?.s)}><path d="M12 5v14M5 12h14" /></svg>,
  Dots:        (p) => <svg {...I.size(p?.s)}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>,
  Check:       (p) => <svg {...I.size(p?.s)}><path d="m5 13 4 4L19 7" /></svg>,
  X:           (p) => <svg {...I.size(p?.s)}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  Filter:      (p) => <svg {...I.size(p?.s)}><path d="M3 5h18l-7 9v6l-4-2v-4z" /></svg>,
  Eye:         (p) => <svg {...I.size(p?.s)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  Lock:        (p) => <svg {...I.size(p?.s)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  Play:        (p) => <svg {...I.size(p?.s)}><path d="M7 4v16l13-8z" /></svg>,
  Refresh:     (p) => <svg {...I.size(p?.s)}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>,
  Menu:        (p) => <svg {...I.size(p?.s)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  Globe:       (p) => <svg {...I.size(p?.s)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
  Phone:       (p) => <svg {...I.size(p?.s)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>,
  Copy:        (p) => <svg {...I.size(p?.s)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>,
  Calendar:    (p) => <svg {...I.size(p?.s)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>,
  Download:    (p) => <svg {...I.size(p?.s)}><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>,
  ArrowLeft:   (p) => <svg {...I.size(p?.s)}><path d="M19 12H5" /><path d="m12 5-7 7 7 7" /></svg>,
  Empty:       (p) => <svg {...I.size(p?.s)}><path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>,
  Sparkle:     (p) => <svg {...I.size(p?.s)}><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></svg>,
};

// ---------- Sidebar ----------
function Sidebar({ active = "kindergartens", opsOpen = true, collapsed = false }) {
  const items = [
    { key: "home", label: "Главная", icon: Icon.Home, route: "/" },
    { key: "kindergartens", label: "Садики", icon: Icon.Building, route: "/kindergartens" },
    { key: "subscriptions", label: "Подписки", icon: Icon.Card, route: "/subscriptions" },
    { key: "flags", label: "Feature Flags", icon: Icon.Flag, route: "/feature-flags" },
    { key: "users", label: "Пользователи", icon: Icon.Users, route: "/users" },
  ];
  const ops = [
    { key: "ops-billing", label: "Биллинг", icon: Icon.Receipt },
    { key: "ops-content", label: "Контент", icon: Icon.FileText },
    { key: "ops-schedule", label: "Rollout недели", icon: Icon.CalendarSync },
    { key: "ops-dlq", label: "Failed jobs", icon: Icon.Alert, badge: 3 },
  ];

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      flex: `0 0 ${collapsed ? 64 : 240}px`,
      borderRight: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        height: 56, display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "0 18px" : "0 16px", borderBottom: "1px solid var(--border-default)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: "var(--brand)",
          color: "white", fontWeight: 600, fontSize: 13, display: "grid", placeItems: "center",
          fontFamily: "var(--font-mono)", letterSpacing: -0.4,
        }}>SH</div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Shyraq</span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>SuperAdmin</span>
          </div>
        )}
      </div>

      <nav style={{ padding: 8, display: "flex", flexDirection: "column", gap: 1, flex: 1, overflow: "hidden" }}>
        {items.map(it => <NavItem key={it.key} {...it} active={active === it.key} collapsed={collapsed} />)}

        <div style={{ height: 1, background: "var(--border-subtle)", margin: "10px 8px" }} />

        <div style={{ padding: collapsed ? "4px 8px" : "4px 10px", marginBottom: 2 }}>
          {!collapsed ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 500 }}>
              <span>Операции</span>
              <Icon.ChevronDown s={12} />
            </div>
          ) : (
            <div style={{ height: 1, background: "var(--border-subtle)" }} />
          )}
        </div>

        {opsOpen && ops.map(it => (
          <NavItem key={it.key} {...it} active={active === it.key} collapsed={collapsed} indent={!collapsed} />
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 8px 6px" }} />

        <NavItem
          icon={Icon.Activity}
          label="Статус системы"
          active={active === "status"}
          collapsed={collapsed}
          rightSlot={<span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--success)" }} />}
        />
      </nav>
    </aside>
  );
}

function NavItem({ icon: Ic, label, active, collapsed, indent, rightSlot, badge }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "8px 10px" : indent ? "7px 10px 7px 18px" : "7px 10px",
      borderRadius: 7,
      border: "none",
      background: active ? "var(--brand-soft)" : "transparent",
      color: active ? "var(--brand-text-on-soft)" : "var(--text-secondary)",
      fontSize: 13.5,
      fontWeight: active ? 500 : 450,
      cursor: "pointer",
      width: "100%",
      textAlign: "left",
      justifyContent: collapsed ? "center" : "flex-start",
    }}>
      <Ic s={collapsed ? 18 : 16} />
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge != null && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: "var(--warning-soft)", color: "var(--warning-text)",
          padding: "1px 6px", borderRadius: 999, lineHeight: 1.4,
          fontFamily: "var(--font-mono)",
        }}>{badge}</span>
      )}
      {!collapsed && rightSlot}
    </button>
  );
}

// ---------- Topbar ----------
function Topbar({ breadcrumbs = [], showSearch = false, searchPlaceholder = "Поиск...", user = "Иван Петров", initials = "ИП" }) {
  return (
    <header style={{
      height: 56, flex: "0 0 56px",
      borderBottom: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
    }}>
      <button style={iconBtn}><Icon.Menu /></button>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, fontSize: 13, color: "var(--text-tertiary)", minWidth: 0 }}>
        {breadcrumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon.ChevronRight s={12} />}
            <span style={{
              color: i === breadcrumbs.length - 1 ? "var(--text-primary)" : "var(--text-tertiary)",
              fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 200,
            }}>{c}</span>
          </React.Fragment>
        ))}
      </nav>

      {showSearch && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px", border: "1px solid var(--border-default)",
          borderRadius: 7, background: "var(--bg-surface-2)", width: 280,
          color: "var(--text-tertiary)",
        }}>
          <Icon.Search s={14} />
          <span style={{ fontSize: 13, flex: 1 }}>{searchPlaceholder}</span>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-quaternary)", border: "1px solid var(--border-default)", padding: "1px 5px", borderRadius: 4, background: "var(--bg-surface)" }}>⌘K</span>
        </div>
      )}

      <button style={{ ...pillBtn }}>
        <Icon.Globe s={14} /> RU <Icon.ChevronDown s={12} />
      </button>

      <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 4px 4px", borderRadius: 999, border: "1px solid transparent", background: "transparent", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-text-on-soft)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>{initials}</div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{user}</span>
        <Icon.ChevronDown s={12} />
      </button>
    </header>
  );
}

const iconBtn = {
  display: "grid", placeItems: "center",
  width: 30, height: 30, border: "none", background: "transparent",
  color: "var(--text-secondary)", borderRadius: 6, cursor: "pointer",
};

const pillBtn = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "5px 10px", border: "1px solid var(--border-default)",
  borderRadius: 7, background: "var(--bg-surface)", color: "var(--text-secondary)",
  fontSize: 12.5, cursor: "pointer", fontWeight: 500,
};

// ---------- PageHeader ----------
function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div style={{
      padding: "20px 28px 16px",
      borderBottom: "1px solid var(--border-default)",
      display: "flex", flexDirection: "column", gap: 4,
      background: "var(--bg-surface)",
    }}>
      {back && (
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: 12.5, padding: 0, cursor: "pointer", marginBottom: 6, alignSelf: "flex-start" }}>
          <Icon.ArrowLeft s={12} /> {back}
        </button>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-tertiary)" }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

// ---------- Button ----------
function Button({ variant = "default", size = "default", children, icon, iconRight, fullWidth, style }) {
  const sizes = {
    sm:  { padding: "5px 10px", fontSize: 12.5, height: 28, gap: 6, iconSize: 13 },
    default: { padding: "7px 14px", fontSize: 13, height: 34, gap: 7, iconSize: 14 },
    lg:  { padding: "10px 18px", fontSize: 14, height: 40, gap: 8, iconSize: 15 },
    icon: { padding: 0, fontSize: 13, height: 34, width: 34, gap: 0, iconSize: 15 },
  }[size];
  const variants = {
    default:    { background: "var(--brand)", color: "white", border: "1px solid var(--brand)" },
    primary:    { background: "var(--brand)", color: "white", border: "1px solid var(--brand)" },
    secondary:  { background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" },
    outline:    { background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-default)" },
    ghost:      { background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" },
    destructive:{ background: "var(--error)", color: "white", border: "1px solid var(--error)" },
    "destructive-outline":{ background: "var(--bg-surface)", color: "var(--error-text)", border: "1px solid color-mix(in oklab, var(--error) 28%, white)" },
    link:       { background: "transparent", color: "var(--brand)", border: "1px solid transparent", padding: 0 },
  }[variant];
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: sizes.gap, fontWeight: 500, fontSize: sizes.fontSize, height: sizes.height,
      padding: sizes.padding, borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap",
      width: size === "icon" ? sizes.height : fullWidth ? "100%" : "auto",
      ...variants, ...style,
    }}>
      {icon && React.cloneElement(icon, { s: sizes.iconSize })}
      {children}
      {iconRight && React.cloneElement(iconRight, { s: sizes.iconSize })}
    </button>
  );
}

// ---------- Badge ----------
function Badge({ tone = "neutral", children, dot = false, style }) {
  const tones = {
    success:  { bg: "var(--success-soft)", color: "var(--success-text)",  dotc: "var(--success)" },
    warning:  { bg: "var(--warning-soft)", color: "var(--warning-text)",  dotc: "var(--warning)" },
    error:    { bg: "var(--error-soft)",   color: "var(--error-text)",    dotc: "var(--error)" },
    info:     { bg: "var(--info-soft)",    color: "var(--info-text)",     dotc: "var(--info)" },
    neutral:  { bg: "var(--bg-surface-2)", color: "var(--text-secondary)", dotc: "var(--text-quaternary)" },
    brand:    { bg: "var(--brand-soft)",   color: "var(--brand-text-on-soft)", dotc: "var(--brand)" },
    purple:   { bg: "var(--role-super-soft)", color: "var(--role-super-text)", dotc: "var(--role-super)" },
    blue:     { bg: "var(--role-support-soft)", color: "var(--role-support-text)", dotc: "var(--role-support)" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: dot ? "2px 8px 2px 7px" : "2px 8px",
      borderRadius: 999, background: tones.bg, color: tones.color,
      fontSize: 11.5, fontWeight: 500, lineHeight: 1.5, whiteSpace: "nowrap",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: tones.dotc }} />}
      {children}
    </span>
  );
}

// ---------- Card ----------
function Card({ children, padding = 20, style }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 10,
      padding,
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}>{children}</div>
  );
}

// ---------- Input / Label ----------
function Field({ label, hint, error, required, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>
          {label}{required && <span style={{ color: "var(--error)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: 11.5, color: "var(--error-text)" }}>⚠ {error}</span>
      ) : hint && (
        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{hint}</span>
      )}
    </div>
  );
}

function Input({ value, placeholder, prefix, suffix, mono, disabled, error, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "0 10px",
      border: `1px solid ${error ? "var(--error)" : "var(--border-default)"}`,
      borderRadius: 7, height: 34,
      background: disabled ? "var(--bg-surface-2)" : "var(--bg-surface)",
      color: disabled ? "var(--text-tertiary)" : "var(--text-primary)",
      fontSize: 13,
      ...style,
    }}>
      {prefix && <span style={{ color: "var(--text-tertiary)", fontSize: 12.5 }}>{prefix}</span>}
      <span style={{
        flex: 1,
        color: value ? "inherit" : "var(--text-quaternary)",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
        fontSize: mono ? 12.5 : 13,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{value || placeholder}</span>
      {suffix && <span style={{ color: "var(--text-tertiary)" }}>{suffix}</span>}
    </div>
  );
}

function Select({ value, placeholder, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "0 10px",
      border: "1px solid var(--border-default)",
      borderRadius: 7, height: 34, background: "var(--bg-surface)",
      fontSize: 13, color: value ? "var(--text-primary)" : "var(--text-quaternary)",
      ...style,
    }}>
      <span style={{ flex: 1 }}>{value || placeholder}</span>
      <Icon.ChevronDown s={14} />
    </div>
  );
}

// ---------- Tabs ----------
function Tabs({ tabs, active }) {
  return (
    <div style={{
      display: "flex", gap: 0,
      borderBottom: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      padding: "0 28px",
    }}>
      {tabs.map(t => (
        <div key={t} style={{
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: t === active ? 600 : 500,
          color: t === active ? "var(--text-primary)" : "var(--text-tertiary)",
          borderBottom: `2px solid ${t === active ? "var(--brand)" : "transparent"}`,
          marginBottom: -1,
        }}>{t}</div>
      ))}
    </div>
  );
}

// ---------- Toggle ----------
function Toggle({ on }) {
  return (
    <div style={{
      width: 32, height: 18, borderRadius: 999,
      background: on ? "var(--brand)" : "var(--border-strong)",
      position: "relative", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: 999,
        background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
      }} />
    </div>
  );
}

// ---------- Mono ----------
const Mono = ({ children, style }) => (
  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.92em", ...style }}>{children}</span>
);

// expose
Object.assign(window, {
  Icon, Sidebar, Topbar, PageHeader, Button, Badge, Card, Field, Input, Select, Tabs, Toggle, Mono,
});
