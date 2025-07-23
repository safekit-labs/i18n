# TypeScript → JSON Code Generation

For teams using the TypeScript → JSON workflow, `@safekit/safe-i18n` provides a `tsToJson` function to automate the conversion process. This is ideal for teams who start with TypeScript translations but want to migrate to JSON-based workflows as they scale.

## Basic Usage

```typescript
import { tsToJson } from '@safekit/safe-i18n';

// Generate JSON files from TypeScript translations
tsToJson({
  translationsDir: './src/translations',  // Directory with TypeScript files
  outputDir: './json-translations',      // Output directory for JSON files
  schemaName: 'auth',                   // Optional: custom schema name (default: none)
  continueOnError: false,               // Optional: stop on validation errors (default: false)
  silent: false                         // Optional: suppress console output (default: false)
});
```

## Schema Naming

The `schemaName` parameter allows you to create domain-specific schemas:

```typescript
// Default schema
tsToJson({
  translationsDir: './src/translations',
  outputDir: './json-translations'
});
// Creates: $schema.json

// Custom schema  
tsToJson({
  translationsDir: './src/auth-translations',
  outputDir: './json-auth',
  schemaName: 'auth'
});
// Creates: $auth-schema.json
```

## Generated Structure

The function converts TypeScript translation files to a clean JSON structure:

**Input (TypeScript):**
```
src/translations/
├── en-US.ts              # export const enUS = { ... } as const
├── es-ES.ts              # export const esES = { ... } as const
└── fr-FR.ts              # export const frFR = { ... } as const
```

**Output (JSON):**
```
json-translations/
├── $schema.json          # JSON Schema with properties & required array
├── en-US.json           # JSON translation file
├── es-ES.json           # JSON translation file
└── fr-FR.json           # JSON translation file
```

## JSON Schema Format

The generated schema follows JSON Schema Draft 7 specification:

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "additionalProperties": false,
    "type": "object",
    "properties": {
        "$schema": { "type": "string" },
        "user.greeting": { "type": "string" },
        "user.welcome": { "type": "string" },
        "tasks.count": { "type": "string" }
    },
    "patternProperties": {
        "^[a-zA-Z_]+(\\.[a-zA-Z0-9_-]+)*$": {
            "type": "string"
        }
    },
    "required": [
        "$schema",
        "user.greeting", 
        "user.welcome",
        "tasks.count"
    ]
}
```

## TypeScript File Requirements

Your TypeScript translation files must follow this pattern:

```typescript
// en-US.ts
export const enUS = {
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "tasks.count": "You have {{count}} tasks"
} as const;
```

**Requirements:**
- Must use `export const [varName] = { ... } as const` pattern  
- All values must be strings
- Keys should be consistent across all locale files

## Integration Examples

### Build Script

```typescript
// scripts/generate-json.ts
import { tsToJson } from '@safekit/safe-i18n';

tsToJson({
  translationsDir: './src/translations',
  outputDir: './public/locales'
});
```

### Package.json

```json
{
  "scripts": {
    "build:json": "bun run scripts/generate-json.ts",
    "build:json:auth": "bun run scripts/generate-json.ts --schema-name=auth",
    "build": "npm run build:json && vite build"
  }
}
```

## Validation and Error Handling

The `tsToJson` function includes comprehensive validation:

- **Structure consistency** - Ensures all translation files have the same keys
- **Data type validation** - Only allows string values in translations  
- **Empty value detection** - Warns about missing translations
- **TypeScript parsing** - Catches malformed export patterns
- **Variable extraction** - Safely evaluates translation objects

### Options

- `continueOnError: true` - Generate files even with validation errors
- `silent: true` - Suppress console output for CI/build scripts  
- `schemaName: "auth"` - Create custom schema file naming

## Use Cases

This function is perfect for:

- **Migration workflows** - Moving from TypeScript to JSON-based translation management
- **Team scaling** - Allowing translators to work with familiar JSON files
- **Tooling integration** - Feeding JSON files into translation management systems
- **Schema validation** - Ensuring translation consistency across locales

The generated JSON files maintain the same type safety as the original TypeScript when used with the corresponding JSON Schema validation.