import enUS from './en-US.json';
import esES from './es-ES.json';
import frFR from './fr-FR.json';
import zhCN from './zh-CN.json';

export const translations = {
  'en-US': enUS,
  'es-ES': esES,
  'fr-FR': frFR,
  'zh-CN': zhCN,
} as const;

export type SupportedLocale = keyof typeof translations;
export type TranslationKeys = keyof typeof enUS;

// Export individual translation objects for direct use
export { enUS, esES, frFR, zhCN };