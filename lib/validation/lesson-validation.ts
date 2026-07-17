import type { LessonValidationRule } from "@/lib/learning/types";

export type ValidationCheck = { passed: boolean; message: string };
export type ValidationResult = { passed: boolean; checks: ValidationCheck[] };

type ConsoleEntry = { level: string; text: string };

export function validateLessonFiles(files: Record<string, string>, rules: LessonValidationRule[], consoleEntries: ConsoleEntry[] = []): ValidationResult {
  const html = files["index.html"] ?? "";
  const css = files["styles.css"] ?? "";
  const parser = typeof DOMParser === "undefined" ? null : new DOMParser();
  const document = parser?.parseFromString(html, "text/html") ?? null;

  const checks = rules.map((rule): ValidationCheck => {
    if (rule.type === "html_element") {
      const count = document ? document.querySelectorAll(rule.tag).length : countHtmlElements(html, rule.tag);
      return { passed: count >= (rule.minimum ?? 1), message: rule.message };
    }
    if (rule.type === "html_attribute") {
      const elements = document ? Array.from(document.querySelectorAll(rule.tag)) : [];
      const passed = elements.some((element) => {
        const value = element.getAttribute(rule.attribute);
        return value !== null && (rule.value === undefined || value.toLowerCase() === rule.value.toLowerCase());
      });
      return { passed: passed || fallbackHasAttribute(html, rule), message: rule.message };
    }
    if (rule.type === "required_text") {
      const source = rule.file ? files[rule.file] ?? "" : Object.values(files).join("\n");
      return { passed: normalize(source).includes(normalize(rule.text)), message: rule.message };
    }
    if (rule.type === "css_declaration") {
      const declarations = parseCssDeclarations(css);
      const values = declarations.get(rule.property.toLowerCase()) ?? [];
      return { passed: values.some((value) => rule.value === undefined || normalize(value) === normalize(rule.value)), message: rule.message };
    }
    const output = consoleEntries.map((entry) => entry.text).join("\n");
    return { passed: normalize(output).includes(normalize(rule.text)), message: rule.message };
  });

  return { passed: checks.every((check) => check.passed), checks };
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function countHtmlElements(html: string, tag: string) {
  const safeTag = tag.replace(/[^a-z0-9-]/gi, "");
  return html.match(new RegExp(`<${safeTag}(?:\\s|>)`, "gi"))?.length ?? 0;
}

function fallbackHasAttribute(html: string, rule: Extract<LessonValidationRule, { type: "html_attribute" }>) {
  const safeTag = rule.tag.replace(/[^a-z0-9-]/gi, "");
  const safeAttribute = rule.attribute.replace(/[^a-z0-9:-]/gi, "");
  const expression = rule.value === undefined
    ? new RegExp(`<${safeTag}[^>]*\\s${safeAttribute}(?:\\s*=|\\s|>)`, "i")
    : new RegExp(`<${safeTag}[^>]*\\s${safeAttribute}\\s*=\\s*["']${escapeRegExp(rule.value)}["']`, "i");
  return expression.test(html);
}

function parseCssDeclarations(css: string) {
  const declarations = new Map<string, string[]>();
  for (const block of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\{([^}]*)\}/g)) {
    for (const declaration of block[1].split(";")) {
      const separator = declaration.indexOf(":");
      if (separator < 1) continue;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (!property || !value) continue;
      declarations.set(property, [...(declarations.get(property) ?? []), value]);
    }
  }
  return declarations;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
