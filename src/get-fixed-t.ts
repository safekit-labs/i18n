import { createTranslator, type TranslatorOptions } from "./create-translator";
import { 
	FlatTranslations, 
	InterpolationKey, 
	NoInterpolationKey, 
	InterpolationOptions, 
	SimpleOptions 
} from "./types";

/**
 * Creates a scoped translator function for a specific namespace
 */
export function getFixedT<T extends FlatTranslations, N extends string>(
	translations: T,
	namespace: N,
	globalOptions?: TranslatorOptions
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
		const translator = createTranslator(translations, globalOptions);
		return translator(fullKey as any, options);
	}

	return scopedTranslate;
}
