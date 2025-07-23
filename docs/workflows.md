# Translation Workflows

To achieve full type safety, `@safekit/i18n` requires TypeScript objects with `as const` assertions. Your application will **always** consume TypeScript objects at runtime. The choice is: **what file format will you and your team edit by hand?**

## Workflow 1: TypeScript as Source of Truth

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

## Workflow 2: JSON as Source of Truth (Recommended for Teams)

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

## Migration Path

Start with **Workflow 1** for simplicity, then migrate to **Workflow 2** as your team grows:

1. Begin with TypeScript files for rapid development
2. Add code generation when you need translator collaboration
3. Convert existing TypeScript files to JSON sources
4. Maintain the same type safety throughout the transition

Both workflows provide identical runtime behavior and type safety - the difference is only in the authoring experience.