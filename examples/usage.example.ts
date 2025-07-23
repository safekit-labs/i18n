import { createTranslator, getFixedT } from '@safekit/i18n';

// Run this example with: bun run examples/usage.example.ts

// Example translations
const translations = {
  "app.title": "Task Manager",
  "user.greeting": "Hello {{name}}!",
  "user.welcome": "Welcome {{firstName}} {{lastName}}!",
  "tasks.count": "You have {{count}} tasks",
  "form.validation.required": "{{field}} is required",
  "form.validation.email": "Please enter a valid email",
  "form.buttons.save": "Save",
  "form.buttons.cancel": "Cancel",
  "nav.home": "Home",
  "nav.about": "About",
} as const;

// ------------------------------------------------------------------------------------------------
// createTranslator
// ------------------------------------------------------------------------------------------------

const t = createTranslator(translations);

// ✅ Should not show type error
console.log(t("app.title")); // "Task Manager"
console.log(t("nav.home")); // "Home"
console.log(t("user.greeting", { name: "Alice" })); // "Hello Alice!"
console.log(t("user.welcome", { firstName: "John", lastName: "Doe" })); // "Welcome John Doe!"
console.log(t("tasks.count", { count: 5 })); // "You have 5 tasks"
console.log(t("form.validation.required", { field: "Email" })); // "Email is required"

// With default values
console.log(t("app.title", { defaultValue: "My App" })); // "Task Manager"
console.log(t("user.greeting", { name: "Bob", defaultValue: "Hi there!" })); // "Hello Bob!"

// ❌ Should show type error
// @ts-expect-error - this is a test
console.log(t("invalid.key")); // typeError: invalid.key is not a valid key
// @ts-expect-error - this is a test
console.log(t("user.greeting")); // typeError: greeting should require interpolation values
// @ts-expect-error - this is a test
console.log(t("user.greeting", { wrongParam: "Alice" })); // typeError: wrongParam is not an interpolated value
// @ts-expect-error - this is a test
console.log(t("app.title", { notNeeded: "hi" })); // typeError: notNeeded is not an interpolated value

// ------------------------------------------------------------------------------------------------
// getFixedT - Namespace Scoping
// ------------------------------------------------------------------------------------------------

const tUser = getFixedT(translations, "user");
const tForm = getFixedT(translations, "form.validation");
const tButtons = getFixedT(translations, "form.buttons");
const tNav = getFixedT(translations, "nav");

// ✅ Should not show type error
console.log(tUser("greeting", { name: "Sarah" })); // "Hello Sarah!"
console.log(tUser("welcome", { firstName: "Emma", lastName: "Smith" })); // "Welcome Emma Smith!"
console.log(tForm("required", { field: "Password" })); // "Password is required"
console.log(tForm("email")); // "Please enter a valid email"
console.log(tButtons("save")); // "Save"
console.log(tButtons("cancel")); // "Cancel"
console.log(tNav("home")); // "Home"
console.log(tNav("about")); // "About"

// ❌ Should show type error
// @ts-expect-error - this is a test
console.log(tUser("invalid")); // typeError: invalid is not a valid key in user namespace
// @ts-expect-error - this is a test
console.log(tUser("greeting")); // typeError: greeting should require interpolation values
// @ts-expect-error - this is a test
console.log(tForm("save")); // typeError: save is not in form.validation namespace
// @ts-expect-error - this is a test
console.log(tNav("greeting", { name: "test" })); // typeError: greeting is not in nav namespace


