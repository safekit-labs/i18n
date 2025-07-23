# @safekit/i18n

This package is in active development. Expect breaking changes between versions.

A lightweight, type-safe internationalization (i18n) library for TypeScript applications with support for interpolation and namespace scoping.

[![npm version](https://badge.fury.io/js/@safekit%2Fi18n.svg)](https://badge.fury.io/js/@safekit%2Fi18n)
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
npm install @safekit/i18n
yarn add @safekit/i18n
bun add @safekit/i18n
```

## createTranslator

The main function for creating a translator with type-safe translation keys and interpolation.

```typescript
import { createTranslator } from '@safekit/i18n';

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
import { getFixedT } from '@safekit/i18n';

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
- **With `defaultValue`**: Returns the provided default value
- **Warnings**: Logged in development, silent in production (unless overridden)

```typescript
// @ts-expect-error - runtime behavior
t("missing.key"); // Returns "missing.key" (with warning in dev)
t("missing.key", { defaultValue: "Fallback" }); // Returns "Fallback"

// Disable warnings
const t = createTranslator(translations, { silent: true });
```

## Source of Truth: Where Do You Maintain Your Translations?

To achieve full type safety, `@safekit/i18n` requires TypeScript objects with `as const` assertions. Your application will **always** consume TypeScript objects at runtime. The choice is: **what file format will you and your team edit by hand?**

### Workflow 1: TypeScript as Source of Truth

You directly write and maintain translations in `.ts` files. These files serve as both your source of truth and what your application imports.

**Best for:** Solo developers, small teams, or projects where developers manage all translations.

```typescript
// translations/en.ts (You edit this file)
export const en = {
  "welcome": "Welcome!",
  "greeting": "Hello {{name}}!",
  "task.count": "You have {{count}} tasks"
} as const;

// app.ts (Your application code)
import { en } from './translations/en';
import { createTranslator } from '@safekit/i18n';

const t = createTranslator(en);
t("greeting", { name: "Alex" }); // ✅ Full compile-time type safety
```

**Benefits:**
- ✅ **Maximum type safety** - Strict compile-time validation of keys and parameters
- ✅ **Zero configuration** - No build steps or tooling required
- ✅ **Instant feedback** - IDE autocompletion and error checking

**Limitations:**
- ⚠️ **Developer-only** - Requires TypeScript knowledge to edit
- ⚠️ **No TMS integration** - Can't use professional translation tools

### Workflow 2: JSON as Source of Truth (Recommended for Teams)

You maintain translations in `.json` files and use code generation to create the TypeScript objects your application needs.

**Best for:** Teams with translators, applications using Translation Management Systems, or projects requiring non-developer collaboration.

**Flow:** `Translators edit JSON → Code generation → TypeScript objects → Your app`

```json
// translations/en.json (Translators edit this file)
{
  "welcome": "Welcome!",
  "greeting": "Hello {{name}}!",
  "task.count": "You have {{count}} tasks"
}
```

```typescript
// generated/translations.ts (Auto-generated - DO NOT EDIT)
export const en = {
  "welcome": "Welcome!",
  "greeting": "Hello {{name}}!",
  "task.count": "You have {{count}} tasks"
} as const;

// app.ts (Your application code)
import { en } from './generated/translations';
import { createTranslator } from '@safekit/i18n';

const t = createTranslator(en);
t("greeting", { name: "Alex" }); // ✅ Same type safety as Workflow 1
```

**Benefits:**
- ✅ **Full type safety** - Same compile-time validation as TypeScript source
- ✅ **Translator-friendly** - JSON is universally editable
- ✅ **TMS compatible** - Works with professional translation tools
- ✅ **Separation of concerns** - Content separate from code

**Requirements:**
- ⚠️ **Build step needed** - Requires code generation script
- ⚠️ **One-time setup** - Initial configuration of generation process

### Migration Path

Start with **Workflow 1** for simplicity, then migrate to **Workflow 2** as your team grows:

1. Begin with TypeScript files for rapid development
2. Add code generation when you need translator collaboration
3. Convert existing TypeScript files to JSON sources
4. Maintain the same type safety throughout the transition

Both workflows provide identical runtime behavior and type safety - the difference is only in the authoring experience.

## What's Not Included

**Nested Object Structure**: This library only supports flat translations with dot notation keys. Nested objects are not supported by design.

```typescript
// ❌ Not supported
const translations = {
  user: {
    greeting: "Hello {{name}}!",
    profile: { title: "Settings" }
  }
} as const;

// ✅ Use flat keys instead
const translations = {
  "user.greeting": "Hello {{name}}!",
  "user.profile.title": "Settings"
} as const;
```

**Why Flat Keys?**

This design choice offers several benefits:

**Pros:**
- ✅ **Simpler type system** - No complex recursive type traversal needed
- ✅ **Better performance** - Key lookup is O(1) instead of nested traversal
- ✅ **Easier tooling** - Translation management systems work better with flat keys
- ✅ **Consistent naming** - Prevents inconsistent nesting patterns across locales
- ✅ **Namespace flexibility** - Can easily scope to any level (`form.validation`, `user.settings.privacy`)

**Tradeoffs:**
- ⚠️ **Verbose keys** - `"user.profile.settings.privacy.email"` instead of nested objects
- ⚠️ **No structural validation** - Can't enforce that all `user.*` keys exist

## Examples

See the [examples](./examples/) directory for comprehensive usage examples:
- `examples/ts/` - TypeScript translations (direct authoring)
- `examples/json-codegen/` - JSON → TypeScript code generation workflow (recommended)
- `examples/json-direct/` - Direct JSON imports (reference only - not recommended)

## Code Generation API

For teams using the JSON → TypeScript workflow, `@safekit/i18n` provides a `generateTypes` function to automate the conversion process.

```typescript
import { generateTypes } from '@safekit/i18n';

// Generate TypeScript files from JSON translations
generateTypes({
  translationsDir: './src/translations',  // Directory with JSON files
  outputDir: './src/generated',          // Output directory for TS files
  ignorePattern: (filename) => filename.startsWith('$'),  // Optional: ignore files (default: '$*')
  continueOnError: false,               // Optional: stop on validation errors (default: false)
  silent: false                         // Optional: suppress console output (default: false)
});
```

### Generated Structure

The function creates modular TypeScript files:

```
generated/
├── types.ts           # Type definitions (TranslationSchema, SupportedLocale, Translation)
├── en-US.ts           # Individual locale constants
├── es-ES.ts           # Individual locale constants
├── [locale].ts        # One file per locale
├── utils.ts           # Translation loaders and getTranslations function
└── index.ts           # Barrel exports (clean re-exports of everything)
```

### Integration Examples

**Build Script:**
```typescript
// scripts/generate-translations.ts
import { generateTypes } from '@safekit/i18n';

generateTypes({
  translationsDir: './translations',
  outputDir: './src/generated'
});
```

**Package.json:**
```json
{
  "scripts": {
    "build:i18n": "bun run scripts/generate-translations.ts",
    "build": "npm run build:i18n && tsc"
  }
}
```

### Validation and Error Handling

The `generateTypes` function includes comprehensive validation:

- **Structure consistency** - Ensures all translation files have the same keys
- **Data type validation** - Only allows string values in translations
- **Empty value detection** - Warns about missing translations
- **JSON parsing** - Catches malformed JSON files
- **Variable name validation** - Ensures locale names create valid TypeScript identifiers

**Options:**
- `continueOnError: true` - Generate files even with validation errors
- `silent: true` - Suppress console output for CI/build scripts
- `ignorePattern` - Custom function to ignore specific files (defaults to files starting with `$`)

The generated files provide the same compile-time type safety as direct TypeScript authoring, while allowing translators to work with familiar JSON files.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT © [safekit](https://github.com/safekit-labs)