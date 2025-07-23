// Type for flat translations
export type FlatTranslations = Record<string, string>;

// Helper type to detect if a string type is literal (not generic string)
export type IsLiteralString<T> = T extends string 
  ? string extends T 
    ? false 
    : true 
  : false;

// Helper type to check if an object has literal string properties
export type HasLiteralStrings<T extends Record<string, string>> = {
  [K in keyof T]: IsLiteralString<T[K]>;
}[keyof T] extends false ? false : true;

// Helper type to extract interpolation keys from a string
export type ExtractInterpolationKeys<S extends string> =
  S extends `${string}{{${infer Key}}}${infer Rest}`
    ? Key | ExtractInterpolationKeys<Rest>
    : never;

// Check if a translation string has interpolation (only for literal strings)
export type HasInterpolation<
  T extends Record<string, string>,
  K extends keyof T & string,
> = HasLiteralStrings<T> extends true
    ? T[K] extends `${string}{{${string}}}${string}` ? true : false
    : false;

// Get interpolation keys for a translation string
export type InterpolationKeys<
  T extends Record<string, string>,
  K extends keyof T & string,
> =
  HasInterpolation<T, K> extends true ? ExtractInterpolationKeys<T[K]> : never;

// Keys with no interpolation
export type NoInterpolationKey<T extends Record<string, string>> = {
  [K in keyof T & string]: HasInterpolation<T, K> extends false ? K : never;
}[keyof T & string];

// Keys with interpolation
export type InterpolationKey<T extends Record<string, string>> = {
  [K in keyof T & string]: HasInterpolation<T, K> extends true ? K : never;
}[keyof T & string];

// Options type for translations without interpolation
export type SimpleOptions = { $defaultValue?: string };

// Options type for translations with interpolation
export type InterpolationOptions<
  T extends Record<string, string>,
  K extends keyof T & string,
> = {
  $defaultValue?: string;
} & {
  [P in InterpolationKeys<T, K>]: string | number;
};

// Fallback options for JSON imports (non-literal strings)
export type JsonInterpolationOptions = {
  $defaultValue?: string;
  [key: string]: string | number | undefined;
};