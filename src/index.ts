// Client-safe runtime exports only - no Node.js dependencies
export { createTranslator } from "./create-translator";
export { getFixedT } from "./get-fixed-t";

export type { TranslatorOptions } from "./create-translator";
export type {
	FlatTranslations,
	InterpolationKey,
	NoInterpolationKey,
	InterpolationOptions,
	SimpleOptions,
	HasInterpolation,
	ExtractInterpolationKeys,
	JsonInterpolationOptions,
} from "./types";
