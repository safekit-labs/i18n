// Type for flat translations
type FlatTranslations = Record<string, string>;

// Helper type to extract interpolation keys from a string
type ExtractInterpolationKeys<S extends string> =
  S extends `${infer _}{{${infer Key}}}${infer Rest}`
    ? Key | ExtractInterpolationKeys<Rest>
    : never;

// Check if a translation string has interpolation
type HasInterpolation<
  T extends Record<string, string>,
  K extends keyof T & string,
> = T[K] extends `${string}{{${string}}}${string}` ? true : false;

// Get interpolation keys for a translation string
type InterpolationKeys<
  T extends Record<string, string>,
  K extends keyof T & string,
> =
  HasInterpolation<T, K> extends true ? ExtractInterpolationKeys<T[K]> : never;

// Keys with no interpolation
type NoInterpolationKey<T extends Record<string, string>> = {
  [K in keyof T & string]: HasInterpolation<T, K> extends false ? K : never;
}[keyof T & string];

// Keys with interpolation
type InterpolationKey<T extends Record<string, string>> = {
  [K in keyof T & string]: HasInterpolation<T, K> extends true ? K : never;
}[keyof T & string];

// Options type for translations without interpolation
type SimpleOptions = { defaultValue?: string };

// Options type for translations with interpolation
type InterpolationOptions<
  T extends Record<string, string>,
  K extends keyof T & string,
> = {
  defaultValue?: string;
} & {
  [P in InterpolationKeys<T, K>]: string | number;
};

/**
 * Creates a translator function for flat translations with strict type checking
 * and required interpolation values
 */
export function createTranslator<T extends Record<string, string>>(
  translations: T,
) {
  type TranslationKey = keyof T & string;

  // Function overloads
  function translate<K extends InterpolationKey<T>>(
    key: K,
    options: InterpolationOptions<T, K>,
  ): string;

  function translate<K extends NoInterpolationKey<T>>(
    key: K,
    options?: SimpleOptions,
  ): string;

  function translate<K extends TranslationKey>(key: K, options?: any): string {
    const value = translations[key];

    // If no translation found, use defaultValue or key itself
    if (typeof value !== "string") {
      if (options?.defaultValue !== undefined) {
        console.warn(
          `Translation key "${key.toString()}" not found, using default value.`,
        );
        return options.defaultValue;
      }
      console.warn(
        `Translation key "${key.toString()}" not found, using key as value.`,
      );
      return key.toString();
    }

    // Handle interpolation if needed
    if (options && Object.keys(options).length > 0) {
      const interpolationValues = { ...options };
      delete interpolationValues.defaultValue;

      if (Object.keys(interpolationValues).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
          const typedParamKey = paramKey as string;
          if (typedParamKey in interpolationValues) {
            const replacement =
              interpolationValues[
                typedParamKey as keyof typeof interpolationValues
              ];
            if (replacement !== undefined) {
              return String(replacement);
            }
            console.warn(
              `Interpolation key "{{${paramKey}}}" has an undefined value.`,
            );
            return `{{${paramKey}}}`;
          }
          console.warn(
            `Interpolation key "{{${paramKey}}}" not found in options.`,
          );
          return `{{${paramKey}}}`;
        });
      }
    }

    return value;
  }

  return translate;
}

/**
 * Creates a scoped translator function for a specific namespace
 */
export function getFixedT<T extends FlatTranslations, N extends string>(
  translations: T,
  namespace: N,
) {
  // Extract only the keys that start with the given namespace
  type PrefixedKeys = keyof T & string;
  type KeysWithNamespace = Extract<PrefixedKeys, `${N}.${string}`>;

  // Extract just the suffix part (everything after `namespace.`)
  type KeySuffix<K extends string> = K extends `${N}.${infer R}` ? R : never;
  type ValidSuffixes = KeySuffix<KeysWithNamespace>;

  // Map from suffix to full key for type safety
  type SuffixToFullKey = {
    [K in ValidSuffixes]: `${N}.${K}`;
  };

  // Identify interpolation keys in the namespace
  type NamespacedInterpolationKey = Extract<
    InterpolationKey<T>,
    KeysWithNamespace
  >;
  type NamespacedNoInterpolationKey = Extract<
    NoInterpolationKey<T>,
    KeysWithNamespace
  >;

  // Map to suffix versions
  type SuffixInterpolationKey = KeySuffix<NamespacedInterpolationKey>;
  type SuffixNoInterpolationKey = KeySuffix<NamespacedNoInterpolationKey>;

  // Function overloads for the scoped translator
  function scopedTranslate<K extends SuffixInterpolationKey>(
    key: K,
    options: InterpolationOptions<T, `${N}.${K}`>,
  ): string;

  function scopedTranslate<K extends SuffixNoInterpolationKey>(
    key: K,
    options?: SimpleOptions,
  ): string;

  function scopedTranslate(key: ValidSuffixes, options?: any): string {
    // Construct the full key
    const fullKey = `${namespace}.${key}` as KeysWithNamespace;

    // Call the base translator with the proper types
    const translator = createTranslator(translations);
    return translator(fullKey as any, options);
  }

  return scopedTranslate;
}
// Example Usage
const translations = {
  "general.hello": "Hello",
  "general.hello_custom": "Hello {{givenName}}",
} as const;

// ------------------------------------------------------------------------------------------------
// createTranslator
// ------------------------------------------------------------------------------------------------

const t = createTranslator(translations);

// ALL THESE TESTS ARE PASSING
// ✅ Should not show type error
console.log(t("general.hello")); // "Hello"
console.log(t("general.hello", { defaultValue: "hi" })); // "Hello"
console.log(t("general.hello_custom", { givenName: "Alice" })); // "Hello Alice"
console.log(
  t("general.hello_custom", { givenName: "Alice", defaultValue: "hi" }),
); // "Hello Alice"
console.log(t("general.hello_custom", { givenName: 98 })); // "Hello 98"

// ❌ Should show type error
// @ts-expect-error - this is a test
console.log(t("general.hello_custom")); // typeError: hello_custom should require interpolation values
// @ts-expect-error - this is a test
console.log(t("general.hello_custom", { givenName1: "Alice" })); // typeError: givenName1 is not an interpolated value
// @ts-expect-error - this is a test
console.log(t("general.hello_custom1", { givenName: "Alice" })); // typeError: hello_custom1 is not a valid key
// @ts-expect-error - this is a test
console.log(t("general.hello1")); // typeError: hello1 is not a valid key
// @ts-expect-error - this is a test
console.log(t("general.hello", { notNeeded: "hi" })); // typeError: notNeeded is not an interpolated value

// ------------------------------------------------------------------------------------------------
// getFixedT
// ------------------------------------------------------------------------------------------------

// DO NOT CHANGE THESE TESTS
const tFixed = getFixedT(translations, "general");

// ✅ Should not show type error / linter error
console.log(tFixed("hello")); // "Hello"
console.log(tFixed("hello", { defaultValue: "hi" })); // "Hello"
console.log(tFixed("hello_custom", { givenName: "Alice" })); // "Hello Alice"
console.log(tFixed("hello_custom", { givenName: "Alice", defaultValue: "hi" })); // "Hello Alice"

// ❌ Should show type error / linter error
// @ts-expect-error - this is a test
console.log(tFixed("hello_custom")); // typeError: hello_custom should require interpolation values
// @ts-expect-error - this is a test
console.log(tFixed("hello_custom", { givenName1: "Alice" })); // typeError: givenName1 is not an interpolated value
// @ts-expect-error - this is a test
console.log(tFixed("hello_custom1", { givenName: "Alice" })); // typeError: hello_custom1 is not a valid key
// @ts-expect-error - this is a test
console.log(tFixed("hello1")); // typeError: hello1 is not a valid key
// @ts-expect-error - this is a test
console.log(tFixed("hello", { notNeeded: "hi" })); // typeError: notNeeded is not an interpolated value
