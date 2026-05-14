import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ruCommon from '@/locales/ru/common.json';
import kkCommon from '@/locales/kk/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { common: ruCommon },
      kk: { common: kkCommon },
    },
    fallbackLng: 'ru',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'shyraq.sa.lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
