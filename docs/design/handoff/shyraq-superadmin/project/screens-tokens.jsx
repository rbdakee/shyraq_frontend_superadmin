/* Design system tokens screen */

function ScreenTokens() {
  return (
    <div className="ab" style={{ background: "var(--bg-app)", padding: 32, overflow: "auto", display: "block" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, letterSpacing: -0.5 }}>Дизайн-система</h1>
        <p style={{ margin: "0 0 28px", fontSize: 13.5, color: "var(--text-tertiary)" }}>
          Базовые токены и компоненты SuperAdmin · density-first internal tool
        </p>

        {/* Colors */}
        <Section title="Colors" subtitle="Brand-палитра Shyraq · приоритет: #007BE0 / #47D848 / #FFAF36 на тёплых нейтралях">
          <ColorGroup title="Surfaces">
            <Swatch name="bg/canvas" value="#f4f3f1" />
            <Swatch name="bg/app" value="#faf9f7" />
            <Swatch name="bg/surface" value="#ffffff" border />
            <Swatch name="bg/surface-2" value="#f6f5f3" />
          </ColorGroup>

          <ColorGroup title="Text">
            <Swatch name="text/primary" value="#191410" dark />
            <Swatch name="text/secondary" value="#303030" dark />
            <Swatch name="text/tertiary" value="#6e6862" dark />
            <Swatch name="text/quaternary" value="#a8a39c" />
          </ColorGroup>

          <ColorGroup title="Brand · #007BE0">
            <Swatch name="brand" value="#007be0" dark />
            <Swatch name="brand/hover" value="#006bc4" dark />
            <Swatch name="brand/soft" value="#e6f1fc" />
            <Swatch name="brand/text" value="#0058a6" dark />
          </ColorGroup>

          <ColorGroup title="Semantic">
            <SwatchSemantic name="success · #47D848" var="--success" />
            <SwatchSemantic name="warning · #FFAF36" var="--warning" />
            <SwatchSemantic name="error · #E5484D" var="--error" />
            <SwatchSemantic name="info · #007BE0" var="--info" />
          </ColorGroup>
        </Section>

        {/* Typography */}
        <Section title="Typography" subtitle="Geist Sans для UI, Geist Mono для IDs / slug / JSON / timestamps">
          <Card padding={20}>
            <TypeRow size="22px" weight={600} family="sans" tracking="-0.4" label="H1 · Page title">Все тенанты платформы Shyraq</TypeRow>
            <TypeRow size="17px" weight={600} family="sans" label="H2 · Section title">Информация о садике</TypeRow>
            <TypeRow size="14px" weight={600} family="sans" label="H3 · Card title">Финансовая сводка</TypeRow>
            <TypeRow size="13.5px" weight={400} family="sans" label="Body / Default">Все sub-indicators в норме. Last check 5 секунд назад.</TypeRow>
            <TypeRow size="12.5px" weight={400} family="sans" color="var(--text-tertiary)" label="Subtitle / Help text">Slug нельзя изменить после создания тенанта</TypeRow>
            <TypeRow size="11.5px" weight={500} family="sans" color="var(--text-tertiary)" label="Eyebrow / Uppercase" tracking="0.4" transform="uppercase">Last billing</TypeRow>
            <TypeRow size="12.5px" weight={500} family="mono" label="Mono · ID / slug / value">01J7H2M8KQR3S5T9V0X · sunshine · 90 000 ₸</TypeRow>
            <TypeRow size="11.5px" weight={400} family="mono" color="var(--text-quaternary)" label="Mono small · timestamp">2026-05-13T10:32:15Z</TypeRow>
          </Card>
        </Section>

        {/* Spacing & radii */}
        <Section title="Spacing & Radii" subtitle="4px base — density важнее воздуха">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card padding={20}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Spacing scale</div>
              {[4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32].map(s => (
                <Row key={s} gap={14} style={{ padding: "5px 0" }}>
                  <span style={{ width: 36, fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{s}</span>
                  <div style={{ width: s, height: 14, background: "var(--brand)", borderRadius: 2 }} />
                </Row>
              ))}
            </Card>

            <Card padding={20}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Radii</div>
              {[
                ["xs", 4], ["sm", 6], ["md", 8], ["lg", 10], ["xl", 14], ["pill", 999],
              ].map(([name, r]) => (
                <Row key={name} gap={14} style={{ padding: "6px 0" }}>
                  <span style={{ width: 36, fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{name}</span>
                  <div style={{ width: 30, height: 30, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", borderRadius: r }} />
                  <Mono style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{r === 999 ? "9999" : r}px</Mono>
                </Row>
              ))}
            </Card>
          </div>
        </Section>

        {/* Components */}
        <Section title="Components" subtitle="Базовый набор · shadcn-style">
          <Card padding={22}>
            <SubLabel>Buttons</SubLabel>
            <Row gap={8} style={{ flexWrap: "wrap", marginBottom: 8 }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive" icon={<Icon.Alert />}>Destructive</Button>
              <Button variant="destructive-outline">Destructive outline</Button>
              <Button variant="primary" icon={<Icon.Plus />}>With icon</Button>
              <Button variant="secondary" iconRight={<Icon.ChevronRight />}>Trailing icon</Button>
            </Row>
            <Row gap={8} style={{ marginBottom: 22 }}>
              <Button variant="primary" size="sm">sm</Button>
              <Button variant="primary">default</Button>
              <Button variant="primary" size="lg">lg</Button>
              <Button variant="secondary" size="icon"><Icon.Dots /></Button>
            </Row>

            <SubLabel>Badges</SubLabel>
            <Row gap={6} style={{ flexWrap: "wrap", marginBottom: 22 }}>
              <Badge tone="success" dot>Active</Badge>
              <Badge tone="info" dot>Trial</Badge>
              <Badge tone="warning" dot>Suspended</Badge>
              <Badge tone="error" dot>Failed</Badge>
              <Badge tone="neutral" dot>Inactive</Badge>
              <Badge tone="brand">Pro</Badge>
              <Badge tone="purple">super_admin</Badge>
              <Badge tone="blue">support</Badge>
            </Row>

            <SubLabel>Inputs</SubLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
              <Field label="Text"><Input value="Солнышко" /></Field>
              <Field label="With prefix"><Input value="sunshine" prefix={<Icon.Search s={13} />} /></Field>
              <Field label="Disabled" hint="не редактируется"><Input value="sunshine" disabled mono suffix={<Icon.Lock s={12} />} /></Field>
              <Field label="With error" error="Slug уже занят"><Input value="sunshine" error /></Field>
              <Field label="Select"><Select value="Pro" /></Field>
              <Field label="Mono"><Input value="01J7H2M8KQ..." mono /></Field>
            </div>

            <SubLabel>Toggle</SubLabel>
            <Row gap={20} style={{ marginBottom: 22 }}>
              <Row gap={8}><Toggle on /><span style={{ fontSize: 13 }}>On</span></Row>
              <Row gap={8}><Toggle /><span style={{ fontSize: 13 }}>Off</span></Row>
            </Row>
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 600 }}>{title}</h2>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--text-tertiary)" }}>{subtitle}</p>
      {children}
    </div>
  );
}

function ColorGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>{children}</div>
    </div>
  );
}

function Swatch({ name, value, dark, border }) {
  return (
    <div style={{
      borderRadius: 8, overflow: "hidden",
      border: "1px solid var(--border-default)",
    }}>
      <div style={{
        height: 64, background: value,
        borderBottom: border ? "1px solid var(--border-default)" : "none",
      }} />
      <div style={{ padding: "8px 10px", background: "var(--bg-surface)" }}>
        <Mono style={{ fontSize: 11, color: "var(--text-secondary)", display: "block" }}>{name}</Mono>
        <Mono style={{ fontSize: 10, color: "var(--text-quaternary)" }}>{value}</Mono>
      </div>
    </div>
  );
}

function SwatchSemantic({ name, var: v }) {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, height: 64, background: `var(${v})` }} />
        <div style={{ flex: 1, height: 64, background: `var(${v}-soft)` }} />
      </div>
      <div style={{ padding: "8px 10px", background: "var(--bg-surface)" }}>
        <Mono style={{ fontSize: 11, color: "var(--text-secondary)", display: "block" }}>{name}</Mono>
        <Mono style={{ fontSize: 10, color: "var(--text-quaternary)" }}>solid · soft</Mono>
      </div>
    </div>
  );
}

function SubLabel({ children }) {
  return <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>{children}</div>;
}

function TypeRow({ label, size, weight, family, color, tracking, transform, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 220px", gap: 14, padding: "10px 0", borderTop: "1px solid var(--border-subtle)", alignItems: "center" }}>
      <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: size, fontWeight: weight,
        fontFamily: family === "mono" ? "var(--font-mono)" : "var(--font-sans)",
        color: color || "var(--text-primary)",
        letterSpacing: tracking ? `${tracking}px` : undefined,
        textTransform: transform,
      }}>{children}</span>
      <Mono style={{ fontSize: 10.5, color: "var(--text-quaternary)" }}>
        {family} · {size} · {weight}{tracking ? ` · ls ${tracking}` : ""}
      </Mono>
    </div>
  );
}

Object.assign(window, { ScreenTokens });
