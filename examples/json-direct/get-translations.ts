import type { SupportedLocale } from './translations';

// Define the translation type based on the en-US structure
export type Translation = typeof import('./translations/en-US.json');

// Translation loader functions
const translationLoaders = {
  'en-US': () => import('./translations/en-US.json'),
  'es-ES': () => import('./translations/es-ES.json'),
  'fr-FR': () => import('./translations/fr-FR.json'),
  'zh-CN': () => import('./translations/zh-CN.json'),
} as const;

/**
 * Dynamically loads translations for the specified locale via direct JSON imports
 * 
 * ⚠️  WARNING: This approach loses literal string types and compile-time type safety.
 * Use examples/json-codegen/ for the recommended approach with full type safety.
 */
export const getTranslations = async (
  locale: SupportedLocale
): Promise<Translation> => {
  const loader = translationLoaders[locale];
  const module = await loader();
  return module.default;
};