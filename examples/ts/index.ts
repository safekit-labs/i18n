// Main barrel exports for all files

// Re-export all translations and schema
export * from './translations';

// Export utility types
export type { SupportedLocale, Translation } from './types';

// Export utility functions
export { getTranslations } from './utils';