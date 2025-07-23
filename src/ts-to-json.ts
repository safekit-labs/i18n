import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, basename, extname } from "path";

export interface TsToJsonOptions {
  /** Directory containing TypeScript translation files */
  translationsDir: string;
  /** Output directory for generated JSON files */
  outputDir: string;
  /** Name for the schema file (defaults to empty string for $schema.json) */
  schemaName?: string;
  /** Files to ignore (defaults to files starting with '$') */
  ignorePattern?: (filename: string) => boolean;
  /** Whether to continue generation even if validation errors are found (default: false) */
  continueOnError?: boolean;
  /** Whether to suppress console output (default: false) */
  silent?: boolean;
}

interface TsTranslationFile {
  locale: string;
  content: Record<string, string>;
  filePath: string;
}

interface ValidationError {
  file: string;
  errors: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Default ignore pattern - ignores files starting with '$' (like $schema.ts)
 */
const defaultIgnorePattern = (filename: string): boolean => {
  return filename.startsWith("$");
};

/**
 * Extract translation object from TypeScript file content
 */
function extractTranslationObject(fileContent: string, locale: string): Record<string, string> {
  // Remove comments and find the main export
  const cleanContent = fileContent
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, ""); // Remove line comments

  // Look for export const [varName] = { ... } as const patterns
  const exportMatch = cleanContent.match(/export\s+const\s+(\w+)\s*=\s*({[\s\S]*?})\s*as\s+const/);

  if (!exportMatch) {
    throw new Error(`Could not find export const pattern in ${locale}.ts`);
  }

  const objectString = exportMatch[2];

  try {
    // Create a safe evaluation context
    const translationObject = Function(`"use strict"; return (${objectString})`)();

    // Validate that all values are strings
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(translationObject)) {
      if (typeof value !== "string") {
        throw new Error(`Key "${key}" has non-string value: ${typeof value}`);
      }
      result[key] = value;
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to parse translation object in ${locale}.ts: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Read and parse all TypeScript translation files
 */
function readTsTranslationFiles(
  translationsDir: string,
  ignorePattern: (filename: string) => boolean,
): TsTranslationFile[] {
  if (!existsSync(translationsDir)) {
    throw new Error(`Translations directory does not exist: ${translationsDir}`);
  }

  const tsFiles = readdirSync(translationsDir)
    .filter((file) => {
      return extname(file) === ".ts" && !ignorePattern(basename(file, ".ts"));
    })
    .sort();

  if (tsFiles.length === 0) {
    throw new Error(`No TypeScript translation files found in: ${translationsDir}`);
  }

  return tsFiles.map((file) => {
    const locale = basename(file, ".ts");
    const filePath = join(translationsDir, file);

    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(
        `Could not read file ${file}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    const content = extractTranslationObject(fileContent, locale);

    return { locale, content, filePath };
  });
}

/**
 * Validate that all translation files have consistent structure
 */
function validateTsTranslationFiles(translationFiles: TsTranslationFile[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (translationFiles.length === 0) {
    return {
      isValid: false,
      errors: [{ file: "general", errors: ["No translation files found"] }],
    };
  }

  // Get reference keys from the first file
  const referenceFile = translationFiles[0];
  const referenceKeys = new Set(Object.keys(referenceFile.content));

  // Check each file for consistency
  translationFiles.forEach((file) => {
    const fileErrors: string[] = [];
    const currentKeys = new Set(Object.keys(file.content));

    // Check for missing keys
    for (const refKey of referenceKeys) {
      if (!currentKeys.has(refKey)) {
        fileErrors.push(`Missing key: "${refKey}"`);
      }
    }

    // Check for extra keys
    for (const currentKey of currentKeys) {
      if (!referenceKeys.has(currentKey)) {
        fileErrors.push(`Extra key: "${currentKey}" (not found in ${referenceFile.locale})`);
      }
    }

    // Check for empty values
    Object.entries(file.content).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() === "") {
        fileErrors.push(`Key "${key}" has empty value`);
      }
    });

    if (fileErrors.length > 0) {
      errors.push({ file: file.locale, errors: fileErrors });
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Create JSON schema file with properties and required array
 */
function createJsonSchemaFile(translationFiles: TsTranslationFile[]): string {
  const firstTranslation = translationFiles[0];
  const keys = Object.keys(firstTranslation.content).sort();

  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    additionalProperties: false,
    type: "object",
    properties: {
      $schema: { type: "string" },
      ...Object.fromEntries(keys.map((key) => [key, { type: "string" }])),
    },
    patternProperties: {
      "^[a-zA-Z_]+(\\.[a-zA-Z0-9_-]+)*$": {
        type: "string",
      },
    },
    required: ["$schema", ...keys],
  };

  return JSON.stringify(schema, null, 4);
}

/**
 * Create individual JSON translation file
 */
function createJsonTranslationFile(translation: TsTranslationFile, schemaName?: string): string {
  const schemaFileName = schemaName ? `$${schemaName}-schema.json` : "$schema.json";

  const jsonContent = {
    $schema: `./${schemaFileName}`,
    ...Object.fromEntries(
      Object.entries(translation.content).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };

  return JSON.stringify(jsonContent, null, 4);
}

/**
 * Generate JSON files from TypeScript translations
 */
export function tsToJson(options: TsToJsonOptions): void {
  const {
    translationsDir,
    outputDir,
    schemaName,
    ignorePattern = defaultIgnorePattern,
    continueOnError = false,
    silent = false,
  } = options;

  const log = (message: string) => {
    if (!silent) console.log(message);
  };

  const logError = (message: string) => {
    if (!silent) console.error(message);
  };

  try {
    // Preflight checks
    if (!existsSync(translationsDir)) {
      throw new Error(`Translations directory does not exist: ${translationsDir}`);
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Read all translation files
    const translationFiles = readTsTranslationFiles(translationsDir, ignorePattern);

    log(
      `Found ${translationFiles.length} TypeScript translation files: ${translationFiles.map((t) => t.locale).join(", ")}`,
    );

    // Validate translation files
    const validation = validateTsTranslationFiles(translationFiles);

    if (!validation.isValid) {
      logError("\n❌ Validation errors found:");
      validation.errors.forEach(({ file, errors }) => {
        logError(`\n📁 ${file}:`);
        errors.forEach((error) => logError(`  • ${error}`));
      });

      if (!continueOnError) {
        throw new Error(
          `Translation validation failed. Fix the errors above or use { continueOnError: true } to proceed anyway.`,
        );
      } else {
        logError("\n⚠️  Continuing with errors due to continueOnError: true\n");
      }
    } else {
      log("✅ All translation files are valid");
    }

    // Generate schema file
    const schemaContent = createJsonSchemaFile(translationFiles);
    const schemaFileName = schemaName ? `$${schemaName}-schema.json` : "$schema.json";
    writeFileSync(join(outputDir, schemaFileName), schemaContent);

    // Generate individual JSON translation files
    translationFiles.forEach((translation) => {
      const jsonContent = createJsonTranslationFile(translation, schemaName);
      writeFileSync(join(outputDir, `${translation.locale}.json`), jsonContent);
    });

    log(`\n✅ Generated JSON files in: ${outputDir}`);
    log(`📦 Schema file: ${schemaFileName}`);
    log(`📦 Translation files: ${translationFiles.map((t) => `${t.locale}.json`).join(", ")}`);
  } catch (error) {
    logError(
      `\n❌ Code generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}
