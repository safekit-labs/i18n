import type { TranslationSchema } from './$schema';

// es-ES translations
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