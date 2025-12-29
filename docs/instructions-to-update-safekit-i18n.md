# Instructions: Add `$ref:` Reference Syntax to @safekit/i18n

## Goal

Update the `createTranslator` function in `@safekit/i18n` to support self-referencing translation keys using a `$ref:` prefix syntax. This allows translation values to reference other keys in the same translations object, reducing duplication.

## Example Usage

```typescript
const translations = {
  "worksheet.line002.label": "Eligible portion of taxable capital gains for the year",
  "simplified.line002.label": "$ref:worksheet.line002.label", // References the above
} as const;

const t = createTranslator(translations, { resolveRefs: true });

t("simplified.line002.label");
// Returns: "Eligible portion of taxable capital gains for the year"
```

---

## Syntax Specification

- **Prefix**: `$ref:`
- **Format**: `$ref:<target-key>`
- **Example**: `"$ref:worksheet.line002.label"`

This aligns with OpenAPI/JSON Schema conventions for internal references.

---

## Implementation Requirements

### 1. Add `resolveRefs` Option

Add a new option to `TranslatorOptions`:

```typescript
export interface TranslatorOptions {
  silent?: boolean;
  resolveRefs?: boolean; // NEW: opt-in to enable $ref: resolution
}
```

**Default**: `false` (opt-in, not enabled by default)

### 2. Reference Resolution Logic

Implement lazy resolution (resolve when `t()` is called, not eagerly at creation time).

**Resolution rules:**

- If `resolveRefs` is `false` or `undefined`, return value as-is (no resolution)
- If value starts with `$ref:`, extract the target key and look it up
- Support chained references (A -> B -> C where B is also a `$ref:`)
- **Max depth**: 10 levels (prevent runaway recursion)
- **Circular detection**: Track visited keys; if a cycle is detected, warn and return the original key
- **Missing target**: If the referenced key doesn't exist, warn and return the original key (the one that was requested, not the ref target)

### 3. Pseudo-implementation

```typescript
function resolveValue(
  key: string,
  translations: Record<string, string>,
  visited: Set<string> = new Set(),
  depth: number = 0
): string {
  const MAX_DEPTH = 10;

  // CHECK: Depth limit
  if (depth >= MAX_DEPTH) {
    if (shouldLog(globalOptions.silent)) {
      console.warn(
        `Reference resolution exceeded max depth (${MAX_DEPTH}) for key "${key}"`
      );
    }
    return key;
  }

  const value = translations[key];

  // CHECK: Key doesn't exist
  if (typeof value !== "string") {
    return key; // Will be handled by existing logic
  }

  // CHECK: Not a reference
  if (!value.startsWith("$ref:")) {
    return value;
  }

  // TRANSFORM: Extract target key
  const refKey = value.slice(5); // Remove "$ref:" prefix

  // CHECK: Circular reference
  if (visited.has(refKey)) {
    if (shouldLog(globalOptions.silent)) {
      console.warn(`Circular reference detected: "${key}" -> "${refKey}"`);
    }
    return key;
  }

  // CHECK: Target doesn't exist
  if (!(refKey in translations)) {
    if (shouldLog(globalOptions.silent)) {
      console.warn(`Reference target "${refKey}" not found for key "${key}"`);
    }
    return key;
  }

  // RESOLVE: Recurse with updated visited set
  visited.add(key);
  return resolveValue(refKey, translations, visited, depth + 1);
}
```

### 4. Integration Point

In the `translate` function, after looking up the value but before interpolation:

```typescript
function translate<K extends TranslationKey>(key: K, options?: any): string {
  let value = translations[key];

  // NEW: Resolve $ref: if enabled
  if (
    globalOptions.resolveRefs &&
    typeof value === "string" &&
    value.startsWith("$ref:")
  ) {
    value = resolveValue(key, translations);
    // If resolution returned the key itself (error case), fall through to existing "not found" logic
    if (value === key) {
      value = undefined as any; // Trigger existing fallback logic
    }
  }

  // ... rest of existing logic (not found handling, interpolation, etc.)
}
```

### 5. Interpolation with References

References should work with interpolation. The resolved value may contain `{{placeholders}}`:

```typescript
const translations = {
  "common.greeting": "Hello, {{name}}!",
  "page.welcome": "$ref:common.greeting",
};

t("page.welcome", { name: "John" }); // Returns: "Hello, John!"
```

---

## Edge Cases to Handle

| Case                                   | Behavior                   |
| -------------------------------------- | -------------------------- |
| `$ref:missing.key`                     | Warn, return original key  |
| `A -> B -> A` (circular)               | Warn, return original key  |
| `A -> B -> C -> D -> ...` (>10 deep)   | Warn, return original key  |
| `$ref:` with no key                    | Warn, return original key  |
| `$ref:key` where key has interpolation | Resolve first, then interpolate |
| `resolveRefs: false`                   | Return literal `$ref:...` string (no resolution) |

---

## Test Cases to Add

```typescript
describe("$ref resolution", () => {
  it("resolves a simple reference", () => {
    const t = createTranslator(
      {
        source: "Hello",
        alias: "$ref:source",
      },
      { resolveRefs: true }
    );
    expect(t("alias")).toBe("Hello");
  });

  it("resolves chained references", () => {
    const t = createTranslator(
      {
        a: "Value",
        b: "$ref:a",
        c: "$ref:b",
      },
      { resolveRefs: true }
    );
    expect(t("c")).toBe("Value");
  });

  it("returns key on circular reference", () => {
    const t = createTranslator(
      {
        a: "$ref:b",
        b: "$ref:a",
      },
      { resolveRefs: true }
    );
    expect(t("a")).toBe("a");
  });

  it("returns key on missing target", () => {
    const t = createTranslator(
      {
        alias: "$ref:nonexistent",
      },
      { resolveRefs: true }
    );
    expect(t("alias")).toBe("alias");
  });

  it("does not resolve when resolveRefs is false", () => {
    const t = createTranslator(
      {
        alias: "$ref:source",
      },
      { resolveRefs: false }
    );
    expect(t("alias")).toBe("$ref:source");
  });

  it("applies interpolation after resolution", () => {
    const t = createTranslator(
      {
        source: "Hello, {{name}}!",
        alias: "$ref:source",
      },
      { resolveRefs: true }
    );
    expect(t("alias", { name: "World" })).toBe("Hello, World!");
  });

  it("respects max depth limit", () => {
    const translations: Record<string, string> = {};
    for (let i = 0; i < 15; i++) {
      translations[`key${i}`] = `$ref:key${i + 1}`;
    }
    translations["key15"] = "Final";

    const t = createTranslator(translations, { resolveRefs: true });
    expect(t("key0")).toBe("key0"); // Exceeds depth, returns original key
  });
});
```

---

## Reference: Current Implementation

The current `createTranslator` function structure:

```typescript
import {
  FlatTranslations,
  HasLiteralStrings,
  InterpolationKey,
  NoInterpolationKey,
  InterpolationOptions,
  SimpleOptions,
  JsonInterpolationOptions,
} from "./types";

export interface TranslatorOptions {
  silent?: boolean;
}

function shouldLog(silent?: boolean): boolean {
  if (silent !== undefined) return !silent;
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV !== "production"
  );
}

export function createTranslator<T extends FlatTranslations>(
  translations: T,
  globalOptions: TranslatorOptions = {}
) {
  type TranslationKey = keyof T & string;

  // Overloaded signatures for type safety...

  function translate<K extends TranslationKey>(key: K, options?: any): string {
    const value = translations[key];

    // If no translation found, use $defaultValue or key itself
    if (typeof value !== "string") {
      // ... fallback logic
    }

    // Handle interpolation if needed
    if (options && Object.keys(options).length > 0) {
      // ... interpolation logic with {{placeholder}} regex
    }

    return value;
  }

  return translate;
}
```

Key aspects:

- Uses `TranslatorOptions` with `silent?: boolean`
- Has overloaded function signatures for type safety (interpolation vs no interpolation)
- Uses `shouldLog()` helper for warning output
- Handles interpolation via `{{placeholder}}` regex replacement
- Falls back to key itself if translation not found

---

## Summary Checklist

- [ ] Add `resolveRefs?: boolean` to `TranslatorOptions`
- [ ] Implement `resolveValue()` helper function with:
  - [ ] `$ref:` prefix detection
  - [ ] Recursive resolution
  - [ ] Max depth (10) protection
  - [ ] Circular reference detection
  - [ ] Missing target handling
- [ ] Integrate into `translate()` function before interpolation
- [ ] Add tests for all edge cases
- [ ] Update README/docs if applicable
