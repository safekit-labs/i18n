// Define the base translation type that all translations must satisfy
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

// Define each translation as const with satisfies
export const enUS = {
  "app.title": "Task Manager",
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "tasks.count": "You have {{count}} tasks",
  "form.validation.required": "{{field}} is required",
  "form.validation.email": "Please enter a valid email",
  "form.buttons.save": "Save",
  "form.buttons.cancel": "Cancel",
  "nav.home": "Home",
  "nav.about": "About"
} as const satisfies TranslationSchema;

export const esES = {
  "app.title": "Gestor de Tareas",
  "user.greeting": "¡Hola {{name}}!",
  "user.welcome": "¡Bienvenido {{firstName}} {{lastName}}!",
  "tasks.count": "Tienes {{count}} tareas",
  "form.validation.required": "{{field}} es obligatorio",
  "form.validation.email": "Por favor ingresa una dirección de correo válida",
  "form.buttons.save": "Guardar",
  "form.buttons.cancel": "Cancelar",
  "nav.home": "Inicio",
  "nav.about": "Acerca de"
} as const satisfies TranslationSchema;

export const frFR = {
  "app.title": "Gestionnaire de Tâches",
  "user.greeting": "Bonjour {{name}} !",
  "user.welcome": "Bienvenue {{firstName}} {{lastName}} !",
  "tasks.count": "Vous avez {{count}} tâches",
  "form.validation.required": "{{field}} est obligatoire",
  "form.validation.email": "Veuillez saisir une adresse email valide",
  "form.buttons.save": "Enregistrer",
  "form.buttons.cancel": "Annuler",
  "nav.home": "Accueil",
  "nav.about": "À propos"
} as const satisfies TranslationSchema;

export const zhCN = {
  "app.title": "任务管理器",
  "user.greeting": "您好 {{name}}！",
  "user.welcome": "欢迎 {{firstName}} {{lastName}}！",
  "tasks.count": "您有 {{count}} 个任务",
  "form.validation.required": "{{field}} 是必填项",
  "form.validation.email": "请输入有效的邮箱地址",
  "form.buttons.save": "保存",
  "form.buttons.cancel": "取消",
  "nav.home": "首页",
  "nav.about": "关于"
} as const satisfies TranslationSchema;

// Supported locales
export type SupportedLocale = 'en-US' | 'es-ES' | 'fr-FR' | 'zh-CN';

// Async loader functions (simulating dynamic imports)
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

// Export the type for static usage
export type Translation = typeof enUS;