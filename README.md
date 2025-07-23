# @safekit/i18n

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

## Installation

```bash
npm install @safekit/i18n
```

## Usage

```typescript
import { createTranslator, getFixedT } from '@safekit/i18n';

const translations = {
  "app.title": "Task Manager",
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "tasks.count": "You have {{count}} tasks",
  "form.validation.required": "{{field}} is required",
  "form.buttons.save": "Save",
} as const;

// ------------------------------------------------------------------------------------------------
// createTranslator
// ------------------------------------------------------------------------------------------------

const t = createTranslator(translations);

// Simple translation
t("app.title"); // "Task Manager"

// Single interpolation
t("user.greeting", { name: "Alice" }); // "Hello Alice!"

// Multiple interpolation  
t("user.welcome", { firstName: "John", lastName: "Doe" }); // "Welcome John Doe!"

// Numeric interpolation
t("tasks.count", { count: 5 }); // "You have 5 tasks"

// ❌ TypeScript errors
// t("user.greeting"); // Error: Missing required parameter 'name'
// t("user.greeting", { wrongParam: "Alice" }); // Error: Invalid parameter name
// t("app.title", { notNeeded: "hi" }); // Error: No parameters needed

// ------------------------------------------------------------------------------------------------
// getFixedT - Namespace Scoping
// ------------------------------------------------------------------------------------------------

const tUser = getFixedT(translations, "user");
const tFormValidation = getFixedT(translations, "form.validation");

// Scoped translation (shorter keys)
tUser("greeting", { name: "Bob" }); // "Hello Bob!"
tUser("welcome", { firstName: "Alice", lastName: "Smith" }); // "Welcome Alice Smith!"
tFormValidation("required", { field: "Email" }); // "Email is required"

// ❌ TypeScript errors  
// tUser("greeting"); // Error: Missing required parameter
// tFormValidation("save"); // Error: Key not in namespace

// ------------------------------------------------------------------------------------------------
// Multi-language Support
// ------------------------------------------------------------------------------------------------

const enTranslations = { "greeting": "Hello {{name}}!" } as const;
const esTranslations = { "greeting": "¡Hola {{name}}!" } as const;

const currentLang = 'es';
const t = currentLang === 'es' 
  ? createTranslator(esTranslations)
  : createTranslator(enTranslations);

t("greeting", { name: "Maria" }); // "¡Hola Maria!"
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

## Examples

See the [examples](./examples/) directory for comprehensive usage examples.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT © [safekit](https://github.com/safekit-labs)