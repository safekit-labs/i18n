// This file is auto-generated. Do not edit manually.
// Type definitions for translations

// Schema that all translations must satisfy
export type TranslationSchema = {
  "app.title": string;
  "user.greeting": string;
  "user.welcome": string;
  "tasks.count": string;
  "form.validation.required": string;
  "form.validation.email": string;
  "form.buttons.save": string;
  "form.buttons.cancel": string;
  "nav.home": string;
  "nav.about": string;
};

// Supported locales
export type SupportedLocale = 'en-US' | 'es-ES' | 'fr-FR' | 'zh-CN';

// Translation type (based on the first locale)
export type Translation = typeof import('./en-US').enUS;
