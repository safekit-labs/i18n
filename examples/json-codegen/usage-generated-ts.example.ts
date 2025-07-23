import { createTranslator, getFixedT } from '../../src';
import { getTranslations } from './generated';
import type { SupportedLocale } from './generated';

// Run this example with: bun run examples/json-codegen/usage-generated-ts.example.ts
//
// NOTE: This example demonstrates the RECOMMENDED JSON → TypeScript workflow.
// 1. Translators edit JSON files in translations/ directory
// 2. Run "bun run generate" to generate TypeScript definitions using the codegen API
// 3. Import and use the generated TypeScript for full type safety

async function runExample() {
  // Load translations dynamically with full type safety
  const locale: SupportedLocale = 'en-US';
  const translations = await getTranslations(locale);
  
  console.log(`Loaded translations for: ${locale}\n`);

  // ------------------------------------------------------------------------------------------------
  // createTranslator - Full Type Safety from Generated Code
  // ------------------------------------------------------------------------------------------------

  const t = createTranslator(translations);

  // ✅ Full compile-time type safety (same as direct TypeScript approach)
  console.log(t("app.title")); // "Task Manager"
  console.log(t("nav.home")); // "Home"
  console.log(t("user.greeting", { name: "Alice" })); // "Hello Alice!"
  console.log(t("user.welcome", { firstName: "John", lastName: "Doe" })); // "Welcome John Doe!"
  console.log(t("tasks.count", { count: 5 })); // "You have 5 tasks"
  console.log(t("form.validation.required", { field: "Email" })); // "Email is required"

  // With default values
  console.log(t("app.title", { defaultValue: "My App" })); // "Task Manager"
  console.log(t("user.greeting", { name: "Bob", defaultValue: "Hi there!" })); // "Hello Bob!"

  // ❌ These show compile-time errors (same as direct TypeScript)
  // @ts-expect-error - this is a test
  console.log(t("invalid.key")); // typeError: invalid.key is not a valid key
  // @ts-expect-error - this is a test
  console.log(t("user.greeting")); // typeError: greeting should require interpolation values
  // @ts-expect-error - this is a test
  console.log(t("user.greeting", { wrongParam: "Alice" })); // typeError: wrongParam is not an interpolated value
  // @ts-expect-error - this is a test
  console.log(t("app.title", { notNeeded: "hi" })); // typeError: notNeeded is not an interpolated value

  // ------------------------------------------------------------------------------------------------
  // getFixedT - Namespace Scoping with Full Type Safety
  // ------------------------------------------------------------------------------------------------

  const tUser = getFixedT(translations, "user");
  const tForm = getFixedT(translations, "form.validation");
  const tButtons = getFixedT(translations, "form.buttons");
  const tNav = getFixedT(translations, "nav");

  // ✅ Full compile-time type safety
  console.log(tUser("greeting", { name: "Sarah" })); // "Hello Sarah!"
  console.log(tUser("welcome", { firstName: "Emma", lastName: "Smith" })); // "Welcome Emma Smith!"
  console.log(tForm("required", { field: "Password" })); // "Password is required"
  console.log(tForm("email")); // "Please enter a valid email"
  console.log(tButtons("save")); // "Save"
  console.log(tButtons("cancel")); // "Cancel"
  console.log(tNav("home")); // "Home"
  console.log(tNav("about")); // "About"

  // ❌ These show compile-time errors
  // @ts-expect-error - this is a test
  console.log(tUser("invalid")); // typeError: invalid is not a valid key in user namespace
  // @ts-expect-error - this is a test
  console.log(tUser("greeting")); // typeError: greeting should require interpolation values
  // @ts-expect-error - this is a test
  console.log(tForm("save")); // typeError: save is not in form.validation namespace
  // @ts-expect-error - this is a test
  console.log(tNav("greeting", { name: "test" })); // typeError: greeting is not in nav namespace

  // ------------------------------------------------------------------------------------------------
  // Silent Option
  // ------------------------------------------------------------------------------------------------

  // Default behavior: warnings in development, silent in production
  const tDefault = createTranslator(translations);

  // Force silent mode
  const tSilent = createTranslator(translations, { silent: true });

  // Force warnings (even in production)  
  const tVerbose = createTranslator(translations, { silent: false });

  console.log("Silent option examples:");
  // @ts-expect-error - testing runtime behavior
  console.log(tDefault("missing.key")); // "missing.key" (with warning in dev)
  // @ts-expect-error - testing runtime behavior
  console.log(tSilent("missing.key")); // "missing.key" (no warning)
  // @ts-expect-error - testing runtime behavior
  console.log(tVerbose("missing.key")); // "missing.key" (always warns)

  // ------------------------------------------------------------------------------------------------
  // Multi-language Support
  // ------------------------------------------------------------------------------------------------

  console.log("Multi-language examples:");

  // Load different languages dynamically with full type safety
  const locales: SupportedLocale[] = ['en-US', 'es-ES', 'fr-FR', 'zh-CN'];
  
  for (const currentLocale of locales) {
    const currentTranslations = await getTranslations(currentLocale);
    const tLang = createTranslator(currentTranslations);
    
    console.log(`${currentLocale}: ${tLang("user.greeting", { name: "Maria" })}`);
  }

  // ------------------------------------------------------------------------------------------------
  // Fallback Behavior
  // ------------------------------------------------------------------------------------------------

  console.log("Fallback behavior examples:");

  // Missing keys return the key itself
  // @ts-expect-error - testing runtime behavior
  console.log(t("nonexistent.key")); // "nonexistent.key"

  // With default values
  // @ts-expect-error - testing runtime behavior
  console.log(t("missing.key", { defaultValue: "Fallback text" })); // "Fallback text"

  // Missing interpolation parameters
  console.log(t("user.greeting", { wrongParam: "test" } as any)); // "Hello {{name}}!"

  // Undefined interpolation values
  console.log(t("user.greeting", { name: undefined } as any)); // "Hello {{name}}!"
}

// Run the example
runExample().catch(console.error);