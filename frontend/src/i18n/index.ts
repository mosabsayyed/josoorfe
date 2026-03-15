import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enApp from './en.json';
import arApp from './ar.json';
import enLanding from './en-landing.json';
import arLanding from './ar-landing.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...enApp, ...enLanding } },
    ar: { translation: { ...arApp, ...arLanding } },
  },
  lng: 'ar', // Arabic as default
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// HMR: hot-swap translations without full page reload
if (import.meta.hot) {
  import.meta.hot.accept('./en.json', (mod) => {
    i18n.addResourceBundle('en', 'translation', mod?.default, true, true);
  });
  import.meta.hot.accept('./ar.json', (mod) => {
    i18n.addResourceBundle('ar', 'translation', mod?.default, true, true);
  });
  import.meta.hot.accept('./en-landing.json', (mod) => {
    i18n.addResourceBundle('en', 'translation', mod?.default, true, true);
  });
  import.meta.hot.accept('./ar-landing.json', (mod) => {
    i18n.addResourceBundle('ar', 'translation', mod?.default, true, true);
  });
}

export default i18n;
