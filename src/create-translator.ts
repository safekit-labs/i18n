import { 
	FlatTranslations, 
	HasLiteralStrings,
	InterpolationKey, 
	NoInterpolationKey, 
	InterpolationOptions, 
	SimpleOptions,
	JsonInterpolationOptions
} from "./types";

export interface TranslatorOptions {
	silent?: boolean;
}

// Helper function to determine if we should log warnings
function shouldLog(silent?: boolean): boolean {
	if (silent !== undefined) return !silent;

	// Auto-detect environment: only log in development
	return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}

/**
 * Creates a translator function for flat translations with strict type checking
 * and required interpolation values
 */
export function createTranslator<T extends FlatTranslations>(
	translations: T,
	globalOptions: TranslatorOptions = {}
) {
	type TranslationKey = keyof T & string;

	// TypeScript literal strings - full type safety
	function translate<K extends InterpolationKey<T>>(
		key: HasLiteralStrings<T> extends true ? K : never,
		options: InterpolationOptions<T, K>,
	): string;

	function translate<K extends NoInterpolationKey<T>>(
		key: HasLiteralStrings<T> extends true ? K : never,
		options?: SimpleOptions,
	): string;

	// JSON imports - relaxed type safety
	function translate<K extends TranslationKey>(
		key: HasLiteralStrings<T> extends false ? K : never,
		options?: JsonInterpolationOptions,
	): string;

	function translate<K extends TranslationKey>(key: K, options?: any): string {
		const value = translations[key];

		// If no translation found, use defaultValue or key itself
		if (typeof value !== "string") {
			if (options?.defaultValue !== undefined) {
				if (shouldLog(globalOptions.silent)) {
					console.warn(
						`Translation key "${key.toString()}" not found, using default value.`
					);
				}
				return options.defaultValue;
			}
			if (shouldLog(globalOptions.silent)) {
				console.warn(
					`Translation key "${key.toString()}" not found, using key as value.`
				);
			}
			return key.toString();
		}

		// Handle interpolation if needed
		if (options && Object.keys(options).length > 0) {
			const interpolationValues = { ...options };
			delete interpolationValues.defaultValue;

			if (Object.keys(interpolationValues).length > 0) {
				return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
					if (paramKey in interpolationValues) {
						const replacement = interpolationValues[paramKey];
						if (replacement !== undefined) {
							return String(replacement);
						}
						if (shouldLog(globalOptions.silent)) {
							console.warn(
								`Interpolation key "{{${paramKey}}}" has an undefined value.`
							);
						}
						return `{{${paramKey}}}`;
					}
					if (shouldLog(globalOptions.silent)) {
						console.warn(
							`Interpolation key "{{${paramKey}}}" not found in options.`
						);
					}
					return `{{${paramKey}}}`;
				});
			}
		}

		return value;
	}

	return translate;
}
