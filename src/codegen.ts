import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';

export interface CodegenOptions {
  /** Directory containing JSON translation files */
  translationsDir: string;
  /** Output directory for generated TypeScript files */
  outputDir: string;
  /** Files to ignore (defaults to files starting with '$') */
  ignorePattern?: (filename: string) => boolean;
  /** Whether to continue generation even if validation errors are found (default: false) */
  continueOnError?: boolean;
  /** Whether to suppress console output (default: false) */
  silent?: boolean;
}

interface TranslationFile {
  locale: string;
  content: Record<string, string>;
  varName: string;
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
 * Default ignore pattern - ignores files starting with '$' (like $schema.json)
 */
const defaultIgnorePattern = (filename: string): boolean => {
  return filename.startsWith('$');
};

/**
 * Validate that all translation files have consistent structure
 */
function validateTranslationFiles(translationFiles: TranslationFile[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (translationFiles.length === 0) {
    return { isValid: false, errors: [{ file: 'general', errors: ['No translation files found'] }] };
  }

  // Get reference keys from the first file
  const referenceFile = translationFiles[0];
  const referenceKeys = new Set(Object.keys(referenceFile.content));
  
  // Check each file for consistency
  translationFiles.forEach(file => {
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
    
    // Check for non-string values
    Object.entries(file.content).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        fileErrors.push(`Key "${key}" has non-string value: ${typeof value}`);
      }
    });
    
    // Check for empty values
    Object.entries(file.content).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() === '') {
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
 * Read and parse all JSON translation files
 */
function readTranslationFiles(translationsDir: string, ignorePattern: (filename: string) => boolean): TranslationFile[] {
  if (!existsSync(translationsDir)) {
    throw new Error(`Translations directory does not exist: ${translationsDir}`);
  }

  const jsonFiles = readdirSync(translationsDir)
    .filter(file => {
      return extname(file) === '.json' && !ignorePattern(basename(file, '.json'));
    })
    .sort();

  if (jsonFiles.length === 0) {
    throw new Error(`No JSON translation files found in: ${translationsDir}`);
  }

  return jsonFiles.map(file => {
    const locale = basename(file, '.json');
    const filePath = join(translationsDir, file);
    
    let content: any;
    try {
      content = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid JSON in file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Remove $schema property if it exists
    delete content.$schema;
    
    // Validate that content is an object
    if (typeof content !== 'object' || content === null || Array.isArray(content)) {
      throw new Error(`Translation file ${file} must contain a JSON object`);
    }
    
    // Convert locale to valid variable name (e.g., en-US -> enUS)
    const varName = locale.replace(/[-_]/g, '');
    
    // Validate variable name is valid
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(varName)) {
      throw new Error(`Locale "${locale}" generates invalid variable name "${varName}". Use alphanumeric characters and hyphens/underscores only.`);
    }
    
    return { locale, content, varName };
  });
}

/**
 * Generate TranslationSchema in a separate $schema.ts file
 */
function generateSchemaFile(translationFiles: TranslationFile[]): string {
  const firstTranslation = translationFiles[0];
  const keys = Object.keys(firstTranslation.content);

  let schemaContent = `// This file is auto-generated. Do not edit manually.\n`;
  schemaContent += `// Translation schema definition\n\n`;
  schemaContent += `// Schema that all translations must satisfy\n`;
  schemaContent += `export type TranslationSchema = {\n`;
  keys.forEach(key => {
    schemaContent += `  "${key}": string;\n`;
  });
  schemaContent += `};\n`;

  return schemaContent;
}

/**
 * Generate utility types (SupportedLocale, Translation)
 */
function generateTypesFile(translationFiles: TranslationFile[]): string {
  let typesContent = `// This file is auto-generated. Do not edit manually.\n`;
  typesContent += `// Utility types for translations\n\n`;
  
  // Add supported locales type
  const locales = translationFiles.map(t => t.locale);
  typesContent += `// Supported locales\n`;
  typesContent += `export type SupportedLocale = ${locales.map(l => `'${l}'`).join(' | ')};\n\n`;
  
  // Add translation type (now references translations folder)
  const firstVarName = translationFiles[0].varName;
  typesContent += `// Translation type (based on the first locale)\n`;
  typesContent += `export type Translation = typeof import('./translations/${translationFiles[0].locale}').${firstVarName};\n`;

  return typesContent;
}

/**
 * Generate individual translation file
 */
function generateTranslationFile(translation: TranslationFile): string {
  let content = `// This file is auto-generated. Do not edit manually.\n`;
  content += `// Generated from ${translation.locale}.json\n\n`;
  content += `import type { TranslationSchema } from './$schema';\n\n`;
  content += `// ${translation.locale} translations\n`;
  content += `export const ${translation.varName} = {\n`;
  
  Object.entries(translation.content).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      content += `  "${key}": "${escapedValue}",\n`;
    }
  });
  
  content += `} as const satisfies TranslationSchema;\n`;
  return content;
}

/**
 * Generate utilities file with translation loaders and functions
 */
function generateUtilsFile(translationFiles: TranslationFile[]): string {
  
  let content = `// This file is auto-generated. Do not edit manually.\n`;
  content += `// Utility functions for translation loading\n\n`;
  
  content += `import type { SupportedLocale } from './types';\n`;
  
  // Import all translation constants from translations folder
  translationFiles.forEach(translation => {
    content += `import { ${translation.varName} } from './translations/${translation.locale}';\n`;
  });
  content += `\n`;
  
  // Generate translation loaders
  content += `// Translation loaders\n`;
  content += `const translationLoaders = {\n`;
  translationFiles.forEach(translation => {
    content += `  '${translation.locale}': async () => ${translation.varName},\n`;
  });
  content += `} as const;\n\n`;
  
  // Generate getTranslations function
  content += `/**\n`;
  content += ` * Dynamically loads translations for the specified locale with preserved literal types\n`;
  content += ` */\n`;
  content += `export const getTranslations = async (locale: SupportedLocale) => {\n`;
  content += `  const loader = translationLoaders[locale];\n`;
  content += `  return await loader();\n`;
  content += `};\n`;
  
  return content;
}

/**
 * Generate translations folder index file
 */
function generateTranslationsIndexFile(translationFiles: TranslationFile[]): string {
  let content = `// This file is auto-generated. Do not edit manually.\n`;
  content += `// Barrel exports for translations\n\n`;
  
  // Export schema
  content += `// Export translation schema\n`;
  content += `export type { TranslationSchema } from './$schema';\n\n`;
  
  // Export all translation constants
  content += `// Export all translation constants\n`;
  translationFiles.forEach(translation => {
    content += `export { ${translation.varName} } from './${translation.locale}';\n`;
  });
  
  return content;
}

/**
 * Generate main index file
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMainIndexFile(_translationFiles: TranslationFile[]): string {
  let content = `// This file is auto-generated. Do not edit manually.\n`;
  content += `// Main barrel exports for all generated files\n\n`;
  
  // Re-export everything from translations
  content += `// Re-export all translations and schema\n`;
  content += `export * from './translations';\n\n`;
  
  // Export utility types
  content += `// Export utility types\n`;
  content += `export type { SupportedLocale, Translation } from './types';\n\n`;
  
  // Export utilities
  content += `// Export utility functions\n`;
  content += `export { getTranslations } from './utils';\n`;
  
  return content;
}

/**
 * Generate TypeScript files from JSON translations
 */
export function generateTypes(options: CodegenOptions): void {
  const { 
    translationsDir: inputTranslationsDir, 
    outputDir, 
    ignorePattern = defaultIgnorePattern,
    continueOnError = false,
    silent = false
  } = options;
  
  const log = (message: string) => {
    if (!silent) console.log(message);
  };
  
  const logError = (message: string) => {
    if (!silent) console.error(message);
  };

  try {
    // Preflight checks
    if (!existsSync(inputTranslationsDir)) {
      throw new Error(`Translations directory does not exist: ${inputTranslationsDir}`);
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Read all translation files
    const translationFiles = readTranslationFiles(inputTranslationsDir, ignorePattern);
    
    log(`Found ${translationFiles.length} translation files: ${translationFiles.map(t => t.locale).join(', ')}`);

    // Validate translation files
    const validation = validateTranslationFiles(translationFiles);
    
    if (!validation.isValid) {
      logError('\n❌ Validation errors found:');
      validation.errors.forEach(({ file, errors }) => {
        logError(`\n📁 ${file}:`);
        errors.forEach(error => logError(`  • ${error}`));
      });
      
      if (!continueOnError) {
        throw new Error(`Translation validation failed. Fix the errors above or use { continueOnError: true } to proceed anyway.`);
      } else {
        logError('\n⚠️  Continuing with errors due to continueOnError: true\n');
      }
    } else {
      log('✅ All translation files are valid');
    }

    // Create translations subdirectory
    const translationsDir = join(outputDir, 'translations');
    if (!existsSync(translationsDir)) {
      mkdirSync(translationsDir, { recursive: true });
    }

    // Generate schema file in translations folder
    const schemaContent = generateSchemaFile(translationFiles);
    writeFileSync(join(translationsDir, '$schema.ts'), schemaContent);

    // Generate individual translation files in translations folder
    translationFiles.forEach(translation => {
      const translationContent = generateTranslationFile(translation);
      writeFileSync(join(translationsDir, `${translation.locale}.ts`), translationContent);
    });

    // Generate translations index file
    const translationsIndexContent = generateTranslationsIndexFile(translationFiles);
    writeFileSync(join(translationsDir, 'index.ts'), translationsIndexContent);

    // Generate utility types file
    const typesContent = generateTypesFile(translationFiles);
    writeFileSync(join(outputDir, 'types.ts'), typesContent);

    // Generate utils file
    const utilsContent = generateUtilsFile(translationFiles);
    writeFileSync(join(outputDir, 'utils.ts'), utilsContent);

    // Generate main index file
    const mainIndexContent = generateMainIndexFile(translationFiles);
    writeFileSync(join(outputDir, 'index.ts'), mainIndexContent);

    log(`\n✅ Generated TypeScript files in: ${outputDir}`);
    log(`📦 Main files: types.ts, utils.ts, index.ts`);
    log(`📦 Translations folder: $schema.ts, ${translationFiles.map(t => `${t.locale}.ts`).join(', ')}, index.ts`);
    log(`📦 Exported: ${translationFiles.map(t => t.varName).join(', ')}, getTranslations, Translation, SupportedLocale, TranslationSchema`);
    
  } catch (error) {
    logError(`\n❌ Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}