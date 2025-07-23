# @safekit/safe-i18n

⚠️ This package is in active development. Expect breaking changes between versions.

A lightweight, type-safe internationalization (i18n) library for TypeScript applications with support for interpolation and namespace scoping.

[![npm version](https://badge.fury.io/js/@safekit%2Fsafe-i18n.svg)](https://badge.fury.io/js/@safekit%2Fsafe-i18n)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Type-safe**: Full TypeScript support with compile-time key validation
- 🔧 **Interpolation**: Support for parameterized translations with type checking
- 📦 **Namespace scoping**: Organize translations by namespace for better maintainability
- 🪶 **Lightweight**: Zero dependencies and minimal runtime overhead
- 🎯 **IntelliSense**: Full autocomplete support for translation keys and parameters
- 📁 **TypeScript-first**: Works with TypeScript (`as const`) for maximum type safety
- 🌍 **Multi-language**: Dynamic locale loading with preserved type safety

## Installation

```bash
npm install @safekit/safe-i18n
yarn add @safekit/safe-i18n
bun add @safekit/safe-i18n
```

## createTranslator

The main function for creating a translator with type-safe translation keys and interpolation.

```typescript
import { createTranslator } from '@safekit/safe-i18n';

const translations = {
  "welcome": "Welcome!",
  "greeting": "Hello {{name}}!",
  "tasks.count": "You have {{count}} tasks"
} as const;

const t = createTranslator(translations);

// ✅ Type-safe usage
t("welcome"); // "Welcome!"
t("greeting", { name: "Alice" }); // "Hello Alice!"
t("tasks.count", { count: 5 }); // "You have 5 tasks"

// ❌ Compile-time errors (with TypeScript translations)
t("invalid.key"); // Error: invalid key
t("greeting"); // Error: missing required parameter 'name'
t("greeting", { wrongParam: "test" }); // Error: invalid parameter
```

## getFixedT

Create a scoped translator for a specific namespace to avoid repeating prefixes.

```typescript
import { getFixedT } from '@safekit/safe-i18n';

const translations = {
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "form.validation.required": "{{field}} is required",
  "form.validation.email": "Please enter a valid email"
} as const;

// Create scoped translators
const tUser = getFixedT(translations, "user");
const tForm = getFixedT(translations, "form.validation");

// Use without namespace prefix
tUser("greeting", { name: "Sarah" }); // "Hello Sarah!"
tUser("welcome", { firstName: "Emma", lastName: "Smith" }); // "Welcome Emma Smith!"
tForm("required", { field: "Password" }); // "Password is required"
tForm("email"); // "Please enter a valid email"
```

## Multi-language Support

For dynamic translation loading with multiple locales:

```typescript
// Define the schema that all translations must satisfy
export type TranslationSchema = {
  "app.title": string;
  "user.greeting": string;
  "user.welcome": string;
  "tasks.count": string;
};

// Define each translation
export const enUS = {
  "app.title": "Task Manager",
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "tasks.count": "You have {{count}} tasks"
} as const satisfies TranslationSchema;

export const esES = {
  "app.title": "Gestor de Tareas",
  "user.greeting": "¡Hola {{name}}!",
  "user.welcome": "¡Bienvenido {{firstName}} {{lastName}}!",
  "tasks.count": "Tienes {{count}} tareas"
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

// Usage
async function setupI18n(locale: SupportedLocale) {
  const translations = await getTranslations(locale);
  const t = createTranslator(translations);

  t("user.greeting", { name: "Maria" });
  // en-US: "Hello Maria!"
  // es-ES: "¡Hola Maria!"
}
```

## API Reference

### `createTranslator(translations, options?)`

Creates a translator function with type-safe key validation and interpolation support.

**Options:**
- `silent?: boolean` - Disable warning logs (default: auto-detect based on NODE_ENV)

### `getFixedT(translations, namespace, options?)`

Creates a scoped translator for a specific namespace, allowing shorter key names.

**Options:**
- Same as `createTranslator`

## Fallback Behavior

- **Missing keys**: Returns the key itself as a string (never undefined/null)
- **With `$defaultValue`**: Returns the provided default value
- **Warnings**: Logged in development, silent in production (unless overridden)

```typescript
// @ts-expect-error - runtime behavior
t("missing.key"); // Returns "missing.key" (with warning in dev)
t("missing.key", { $defaultValue: "Fallback" }); // Returns "Fallback"

// Disable warnings
const t = createTranslator(translations, { silent: true });
```

## Workflows

For comprehensive guides on translation workflows, see [Translation Workflows](./docs/workflows.md).


## Examples

See the [examples](./examples/) directory for comprehensive usage examples:
- `examples/ts/` - TypeScript translations (direct authoring)
- `examples/json-codegen/` - JSON → TypeScript code generation workflow (recommended)
- `examples/json-direct/` - Direct JSON imports (reference only - not recommended)

## Code Generation

For teams using JSON translations, see the [Code Generation API](./docs/codegen.md) documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT © [safekit](https://github.com/safekit-labs)