/* Main app: assemble all screens into design canvas */

function App() {
  return (
    <DesignCanvas
      title="Shyraq SuperAdmin · Design"
      subtitle="Все ключевые экраны для MVP · light theme, RU"
    >
      <DCSection id="foundation" title="Foundation" subtitle="Дизайн-токены и принципы">
        <DCArtboard id="tokens" label="Design tokens & components" width={1200} height={1700}>
          <ScreenTokens />
        </DCArtboard>
      </DCSection>

      <DCSection id="auth" title="Auth & Dashboard" subtitle="Вход, главная, статус системы">
        <DCArtboard id="login" label="Login" width={920} height={720}>
          <ScreenLogin />
        </DCArtboard>
        <DCArtboard id="dashboard" label="Dashboard / Главная" width={1440} height={920}>
          <ScreenDashboard />
        </DCArtboard>
        <DCArtboard id="status" label="System status" width={1440} height={920}>
          <ScreenSystemStatus />
        </DCArtboard>
      </DCSection>

      <DCSection id="kg" title="Kindergartens" subtitle="Список, онбординг, детали тенанта (tabs)">
        <DCArtboard id="kg-list" label="Kindergartens list" width={1440} height={920}>
          <ScreenKindergartens />
        </DCArtboard>
        <DCArtboard id="kg-create-1" label="Create KG · step 1 (садик)" width={1440} height={1080}>
          <ScreenKgCreate />
        </DCArtboard>
        <DCArtboard id="kg-create-2" label="Create KG · step 2 (admin)" width={1440} height={920}>
          <ScreenKgCreateStep2 />
        </DCArtboard>
        <DCArtboard id="kg-overview" label="KG detail · Обзор" width={1440} height={920}>
          <ScreenKgOverview />
        </DCArtboard>
        <DCArtboard id="kg-settings" label="KG detail · Настройки" width={1440} height={1180}>
          <ScreenKgSettings />
        </DCArtboard>
        <DCArtboard id="kg-subscription" label="KG detail · Подписка" width={1440} height={920}>
          <ScreenKgSubscription />
        </DCArtboard>
        <DCArtboard id="kg-flags" label="KG detail · Feature Flags" width={1440} height={680}>
          <ScreenKgFlags />
        </DCArtboard>
        <DCArtboard id="kg-viewas" label="KG detail · View as (placeholder)" width={1440} height={720}>
          <ScreenKgViewAs />
        </DCArtboard>
      </DCSection>

      <DCSection id="platform" title="Platform · cross-KG" subtitle="Подписки, флаги, пользователи">
        <DCArtboard id="subs" label="All subscriptions (cross-kg)" width={1440} height={920}>
          <ScreenSubscriptions />
        </DCArtboard>
        <DCArtboard id="ff" label="All feature flags" width={1440} height={820}>
          <ScreenFeatureFlags />
        </DCArtboard>
        <DCArtboard id="users" label="SaaS users" width={1440} height={760}>
          <ScreenUsers />
        </DCArtboard>
        <DCArtboard id="users-new" label="User · create" width={1440} height={920}>
          <ScreenUserNew />
        </DCArtboard>
        <DCArtboard id="users-edit" label="User · edit (self)" width={1440} height={1180}>
          <ScreenUserEdit />
        </DCArtboard>
      </DCSection>

      <DCSection id="ops" title="Operations" subtitle="Ручные триггеры cron'ов и DLQ">
        <DCArtboard id="ops-billing" label="Operations · Billing (3 triggers)" width={1440} height={760}>
          <ScreenOpsBilling />
        </DCArtboard>
        <DCArtboard id="ops-content" label="Operations · Content (3 triggers)" width={1440} height={720}>
          <ScreenOpsContent />
        </DCArtboard>
        <DCArtboard id="ops-rollout" label="Operations · Weekly Rollout" width={1440} height={1000}>
          <ScreenOpsRollout />
        </DCArtboard>
        <DCArtboard id="ops-dlq" label="Operations · Lifecycle DLQ" width={1440} height={800}>
          <ScreenOpsDLQ />
        </DCArtboard>
      </DCSection>

      <DCSection id="overlays" title="Overlays & States" subtitle="Модалки, command palette, состояния">
        <DCArtboard id="destructive" label="Destructive confirm (slug-typing)" width={1440} height={760}>
          <ScreenDestructiveModal />
        </DCArtboard>
        <DCArtboard id="global-search" label="Global search · ⌘K" width={1440} height={760}>
          <ScreenGlobalSearch />
        </DCArtboard>
        <DCArtboard id="ff-modal" label="Create Feature Flag modal" width={1440} height={760}>
          <ScreenFlagCreate />
        </DCArtboard>
        <DCArtboard id="states" label="Loading / Empty / Error / Toasts" width={1200} height={780}>
          <ScreenStates />
        </DCArtboard>
        <DCArtboard id="mobile" label="Mobile not supported (< 768px)" width={560} height={720}>
          <ScreenMobileAlert />
        </DCArtboard>
      </DCSection>

      <DCSection id="errors" title="Errors" subtitle="404 / 403 / 500">
        <DCArtboard id="err-404" label="404 · Not found" width={1440} height={720}>
          <ScreenError404 />
        </DCArtboard>
        <DCArtboard id="err-403" label="403 · Forbidden" width={1440} height={720}>
          <ScreenError403 />
        </DCArtboard>
        <DCArtboard id="err-500" label="500 · Internal error" width={1440} height={720}>
          <ScreenError500 />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
