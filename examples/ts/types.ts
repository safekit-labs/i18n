// Utility types for translations

// Supported locales
export type SupportedLocale = 'en-US' | 'es-ES' | 'fr-FR' | 'zh-CN';

// Translation type (based on the first locale)
export type Translation = typeof import('./translations/en-US').enUS;