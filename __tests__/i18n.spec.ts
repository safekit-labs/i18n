import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTranslator, getFixedT } from "@/index";

describe("@safekit/i18n", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const translations = {
    "app.title": "Task Manager",
    "nav.home": "Home", 
    "user.greeting": "Hello {{name}}!",
    "user.welcome": "Welcome {{firstName}} {{lastName}}!",
    "tasks.count": "You have {{count}} tasks",
    "form.validation.required": "{{field}} is required",
    "form.buttons.save": "Save",
  } as const;

  describe("createTranslator", () => {
    const t = createTranslator(translations);

    it("should translate simple keys", () => {
      expect(t("app.title")).toBe("Task Manager");
      expect(t("nav.home")).toBe("Home");
      expect(t("form.buttons.save")).toBe("Save");
    });

    it("should handle single interpolation", () => {
      expect(t("user.greeting", { name: "Alice" })).toBe("Hello Alice!");
      expect(t("form.validation.required", { field: "Email" })).toBe("Email is required");
    });

    it("should handle multiple interpolation", () => {
      expect(t("user.welcome", { firstName: "John", lastName: "Doe" })).toBe("Welcome John Doe!");
    });

    it("should handle numeric interpolation", () => {
      expect(t("tasks.count", { count: 5 })).toBe("You have 5 tasks");
      expect(t("tasks.count", { count: 0 })).toBe("You have 0 tasks");
    });

    it("should handle missing keys with key fallback", () => {
      // @ts-expect-error - testing runtime behavior with invalid key
      expect(t("missing.key")).toBe("missing.key");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Translation key "missing.key" not found, using key as value.'
      );
    });

    it("should handle missing keys with default value", () => {
      // @ts-expect-error - testing runtime behavior with invalid key
      expect(t("missing.key", { $defaultValue: "fallback" })).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Translation key "missing.key" not found, using default value.'
      );
    });

    it("should warn on missing interpolation parameters", () => {
      // @ts-expect-error - testing runtime behavior with wrong parameter
      expect(t("user.greeting", { wrongParam: "John" })).toBe("Hello {{name}}!");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Interpolation key "{{name}}" not found in options.'
      );
    });
  });

  describe("getFixedT", () => {
    it("should create scoped translator", () => {
      const tUser = getFixedT(translations, "user");
      
      expect(tUser("greeting", { name: "Bob" })).toBe("Hello Bob!");
      expect(tUser("welcome", { firstName: "Alice", lastName: "Smith" })).toBe("Welcome Alice Smith!");
    });

    it("should work with nested namespaces", () => {
      const tFormValidation = getFixedT(translations, "form.validation");
      const tFormButtons = getFixedT(translations, "form.buttons");
      
      expect(tFormValidation("required", { field: "Password" })).toBe("Password is required");
      expect(tFormButtons("save")).toBe("Save");
    });

    it("should handle missing keys in namespace", () => {
      const tUser = getFixedT(translations, "user");
      
      // @ts-expect-error - testing runtime behavior with invalid key
      expect(tUser("invalid")).toBe("user.invalid");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Translation key "user.invalid" not found, using key as value.'
      );
    });
  });

  describe("silent option", () => {
    it("should log warnings by default", () => {
      const t = createTranslator(translations);
      
      // @ts-expect-error - testing runtime behavior with invalid key
      t("missing.key");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should not log warnings when silent is true", () => {
      const t = createTranslator(translations, { silent: true });
      
      // @ts-expect-error - testing runtime behavior with invalid key
      expect(t("missing.key")).toBe("missing.key");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should work with getFixedT silent option", () => {
      const tUser = getFixedT(translations, "user", { silent: true });
      
      // @ts-expect-error - testing runtime behavior with invalid key
      expect(tUser("invalid")).toBe("user.invalid");
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});