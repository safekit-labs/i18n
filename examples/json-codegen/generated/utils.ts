// This file is auto-generated. Do not edit manually.
// Utility functions for translation loading

import type { SupportedLocale } from './types';
import { enUS } from './en-US';
import { esES } from './es-ES';
import { frFR } from './fr-FR';
import { zhCN } from './zh-CN';

// Translation loaders
const translationLoaders = {
  'en-US': async () => enUS,
  'es-ES': async () => esES,
  'fr-FR': async () => frFR,
  'zh-CN': async () => zhCN,
} as const;

/**
 * Dynamically loads translations for the specified locale with preserved literal types
 */
export const getTranslations = async (locale: SupportedLocale) => {
  const loader = translationLoaders[locale];
  return await loader();
};
