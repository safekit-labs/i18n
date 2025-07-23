// Type for flat translations
export type FlatTranslations = Record<string, string>;

// Helper type to extract interpolation keys from a string
export type ExtractInterpolationKeys<S extends string> =
  S extends `${infer _}{{${infer Key}}}${infer Rest}`
    ? Key | ExtractInterpolationKeys<Rest>
    : never;

// Check if a translation string has interpolation
export type HasInterpolation<
  T extends Record<string, string>,
  K extends keyof T & string,
> = T[K] extends `${string}{{${string}}}${string}` ? true : false;

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
export type SimpleOptions = { defaultValue?: string };

// Options type for translations with interpolation
export type InterpolationOptions<
  T extends Record<string, string>,
  K extends keyof T & string,
> = {
  defaultValue?: string;
} & {
  [P in InterpolationKeys<T, K>]: string | number;
};