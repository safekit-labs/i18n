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
	resolveRefs?: boolean;
}

// Helper function to determine if we should log warnings
function shouldLog(silent?: boolean): boolean {
	if (silent !== undefined) return !silent;

	// Auto-detect environment: only log in development
	// eslint-disable-next-line no-undef
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
	const REF_PREFIX = "$ref:";
	const MAX_REF_DEPTH = 10;

	// ------------------ Reference Resolution ------------------

	function resolveValue(
		key: string,
		originalKey?: string,
		visited: Set<string> = new Set(),
		depth: number = 0
	): string {
		const rootKey = originalKey ?? key;

		if (depth >= MAX_REF_DEPTH) {
			if (shouldLog(globalOptions.silent)) {
				console.warn(
					`Reference resolution exceeded max depth (${MAX_REF_DEPTH}) for key "${key}"`
				);
			}
			return rootKey;
		}

		const value = translations[key];

		if (typeof value !== "string") {
			return rootKey;
		}

		if (!value.startsWith(REF_PREFIX)) {
			return value;
		}

		const refKey = value.slice(REF_PREFIX.length);

		if (!refKey) {
			if (shouldLog(globalOptions.silent)) {
				console.warn(`Empty reference target for key "${key}"`);
			}
			return rootKey;
		}

		if (visited.has(refKey)) {
			if (shouldLog(globalOptions.silent)) {
				console.warn(`Circular reference detected: "${key}" -> "${refKey}"`);
			}
			return rootKey;
		}

		if (!(refKey in translations)) {
			if (shouldLog(globalOptions.silent)) {
				console.warn(`Reference target "${refKey}" not found for key "${key}"`);
			}
			return rootKey;
		}

		visited.add(key);
		return resolveValue(refKey, rootKey, visited, depth + 1);
	}

	// ------------------ Translate Function ------------------

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
		let value: string | undefined = translations[key];

		// Resolve $ref: if enabled
		if (globalOptions.resolveRefs && typeof value === "string" && value.startsWith(REF_PREFIX)) {
			const resolved = resolveValue(key);
			// If resolution returned the key itself (error case), treat as not found
			value = resolved === key ? undefined : resolved;
		}

		// If no translation found, use $defaultValue or key itself
		if (typeof value !== "string") {
			if (options?.$defaultValue !== undefined) {
				if (shouldLog(globalOptions.silent)) {
					console.warn(
						`Translation key "${key.toString()}" not found, using default value.`
					);
				}
				return options.$defaultValue;
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
			delete interpolationValues.$defaultValue;

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
