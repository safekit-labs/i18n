# Code Generation API

For teams using the JSON → TypeScript workflow, `@safekit/i18n` provides a `generateTypes` function to automate the conversion process.

## Basic Usage

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

## Generated Structure

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

## Integration Examples

### Build Script

```typescript
// scripts/generate-translations.ts
import { generateTypes } from '@safekit/i18n';

generateTypes({
  translationsDir: './translations',
  outputDir: './src/generated'
});
```

### Package.json

```json
{
  "scripts": {
    "build:i18n": "bun run scripts/generate-translations.ts",
    "build": "npm run build:i18n && tsc"
  }
}
```

## Validation and Error Handling

The `generateTypes` function includes comprehensive validation:

- **Structure consistency** - Ensures all translation files have the same keys
- **Data type validation** - Only allows string values in translations
- **Empty value detection** - Warns about missing translations
- **JSON parsing** - Catches malformed JSON files
- **Variable name validation** - Ensures locale names create valid TypeScript identifiers

### Options

- `continueOnError: true` - Generate files even with validation errors
- `silent: true` - Suppress console output for CI/build scripts
- `ignorePattern` - Custom function to ignore specific files (defaults to files starting with `$`)

The generated files provide the same compile-time type safety as direct TypeScript authoring, while allowing translators to work with familiar JSON files.