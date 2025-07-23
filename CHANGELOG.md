# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [0.0.2] - 2025-07-23
- Updated package name to be called @safekit/safe-i18n

### [0.0.1] - 2025-07-23

### Added
- `createTranslator` function for type-safe translation with interpolation support
- `getFixedT` function for namespace-scoped translations
- Full TypeScript support with compile-time key validation
- Interpolation support with `{{parameter}}` syntax
- Type-safe parameter validation for interpolated values
- Fallback behavior for missing translation keys
- Support for default values when keys are missing
- Comprehensive test suite with vitest
- Complete documentation and usage examples
- Advanced type system with differentiated handling for TypeScript vs JSON imports
- TypeScript code generation script (`generate-types.ts`) for JSON-to-TypeScript workflow
- Complete JSON → TypeScript code generation example in `examples/json-codegen/`
- Template literal types for compile-time interpolation parameter detection
- Environment-aware silent option (auto-detects development vs production)
- "What's Not Included" documentation section explaining flat key design choice
- Comprehensive workflow guidance distinguishing "Source of Truth" approaches

### Enhanced
- Updated README with clearer workflow comparison and migration guidance
- Improved examples structure with separate directories for different approaches:
  - `examples/ts/` - Direct TypeScript authoring workflow
  - `examples/json-codegen/` - JSON source with TypeScript generation workflow
- Enhanced type safety with `HasLiteralStrings` conditional type detection
- Better error handling for both TypeScript and JSON import scenarios

### Documentation
- Rewrote "Choosing Your Workflow" section as "Source of Truth" for clarity
- Added detailed explanation of flat key structure benefits and tradeoffs
- Included practical code generation examples with copy-pasteable scripts
- Clarified TypeScript-first positioning while supporting JSON workflows

### Features
- Zero dependencies
- Lightweight runtime with minimal overhead
- Full IntelliSense support for translation keys and parameters
- Console warnings for missing keys and interpolation values
- Support for nested namespace organization
- Multi-language support patterns
