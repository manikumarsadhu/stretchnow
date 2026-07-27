import { writable, derived } from 'svelte/store';

// Set active locale store. Defaults to 'en'.
export const localeStore = writable('en');

// Cache of loaded translation sets
const translationsCache = {
  en: {}
};

// Initial English bundles statically loaded for fast initial paints
import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enSettings from '../locales/en/settings.json';

translationsCache.en = {
  ...enCommon,
  ...enDashboard,
  ...enSettings
};

/**
 * Lazy loads translation files for a language and caches it.
 */
export async function loadLocale(lang) {
  if (!lang) return;
  if (translationsCache[lang]) {
    localeStore.set(lang);
    return;
  }

  try {
    let common, dashboard, settings;
    
    if (lang === 'te') {
      common = await import('../locales/te/common.json');
      dashboard = await import('../locales/te/dashboard.json');
      settings = await import('../locales/te/settings.json');
    } else if (lang === 'hi') {
      common = await import('../locales/hi/common.json');
      dashboard = await import('../locales/hi/dashboard.json');
      settings = await import('../locales/hi/settings.json');
    } else {
      localeStore.set('en');
      return;
    }

    translationsCache[lang] = {
      ...(common.default || common),
      ...(dashboard.default || dashboard),
      ...(settings.default || settings)
    };

    localeStore.set(lang);
  } catch (err) {
    console.error(`Failed to lazy load translation files for "${lang}". Falling back to English.`, err);
    localeStore.set('en');
  }
}

/**
 * Reactive translation helper with English fallback chain support.
 */
export const t = derived(localeStore, ($locale) => {
  return (key) => {
    const translations = translationsCache[$locale] || {};
    if (translations[key] !== undefined) {
      return translations[key];
    }
    // Fallback chain: 1. English
    const enTranslations = translationsCache.en || {};
    if (enTranslations[key] !== undefined) {
      return enTranslations[key];
    }
    // 2. Raw key name
    return key;
  };
});
