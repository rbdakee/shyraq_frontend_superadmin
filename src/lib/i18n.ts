import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useUiStore } from '@/stores/ui-store';
import ruCommon from '@/locales/ru/common.json';
import ruAuth from '@/locales/ru/auth.json';
import ruErrors from '@/locales/ru/errors.json';
import ruShell from '@/locales/ru/shell.json';
import ruDashboard from '@/locales/ru/dashboard.json';
import ruKindergartens from '@/locales/ru/kindergartens.json';
import ruOperations from '@/locales/ru/operations.json';
import kkCommon from '@/locales/kk/common.json';
import kkAuth from '@/locales/kk/auth.json';
import kkErrors from '@/locales/kk/errors.json';
import kkShell from '@/locales/kk/shell.json';
import kkDashboard from '@/locales/kk/dashboard.json';
import kkKindergartens from '@/locales/kk/kindergartens.json';
import kkOperations from '@/locales/kk/operations.json';

try {
  const oldLang = localStorage.getItem('shyraq.sa.lang');
  const uiPersist = localStorage.getItem('shyraq.sa.ui');
  if (oldLang && !uiPersist) {
    localStorage.setItem(
      'shyraq.sa.ui',
      JSON.stringify({
        state: { sidebarCollapsed: false, locale: oldLang === 'kk' ? 'kk' : 'ru' },
        version: 0,
      }),
    );
  }
  localStorage.removeItem('shyraq.sa.lang');
} catch {
  // localStorage unavailable — ignore.
}

const initialLocale = useUiStore.getState().locale;

void i18n.use(initReactI18next).init({
  resources: {
    ru: {
      common: ruCommon,
      auth: ruAuth,
      errors: ruErrors,
      shell: ruShell,
      dashboard: ruDashboard,
      kindergartens: ruKindergartens,
      operations: ruOperations,
    },
    kk: {
      common: kkCommon,
      auth: kkAuth,
      errors: kkErrors,
      shell: kkShell,
      dashboard: kkDashboard,
      kindergartens: kkKindergartens,
      operations: kkOperations,
    },
  },
  lng: initialLocale,
  fallbackLng: 'ru',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

useUiStore.subscribe((s, prev) => {
  if (s.locale !== prev.locale) void i18n.changeLanguage(s.locale);
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.resolvedLanguage ?? 'ru';

export default i18n;
