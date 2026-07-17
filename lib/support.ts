import { sanitizeReturnPath } from "./auth-utils.ts";

export const supportCategories = ["login_account", "password_reset", "bug", "lesson_practice", "feature_request", "other"] as const;
export const supportStatuses = ["open", "in_progress", "waiting_on_user", "resolved", "closed"] as const;
export type SupportCategory = (typeof supportCategories)[number];
export type SupportStatus = (typeof supportStatuses)[number];

export function validateSupportTicket(input: { subject?: unknown; category?: unknown; message?: unknown; pageUrl?: unknown; diagnosticsConsent?: unknown }) {
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const category = typeof input.category === "string" && supportCategories.includes(input.category as SupportCategory) ? input.category as SupportCategory : null;
  const consent = input.diagnosticsConsent === true;
  const rawPage = typeof input.pageUrl === "string" ? input.pageUrl.trim() : "";
  const pageUrl = rawPage ? sanitizeReturnPath(rawPage, "") : null;
  if (subject.length < 5 || subject.length > 140) return { ok: false as const, message: "Use a subject between 5 and 140 characters." };
  if (!category) return { ok: false as const, message: "Choose a support category." };
  if (message.length < 10 || message.length > 5000) return { ok: false as const, message: "Describe the issue in 10 to 5,000 characters." };
  if (rawPage && !pageUrl) return { ok: false as const, message: "Page location must be an internal LearnToCodeLab path." };
  return { ok: true as const, value: { subject, category, message, pageUrl, diagnosticsConsent: consent } };
}

export function validateSupportMessage(value: unknown) {
  const body = typeof value === "string" ? value.trim() : "";
  return body.length >= 2 && body.length <= 5000 ? { ok: true as const, body } : { ok: false as const, message: "Use 2 to 5,000 characters." };
}

export function isSupportStatus(value: unknown): value is SupportStatus {
  return typeof value === "string" && supportStatuses.includes(value as SupportStatus);
}

export function formatSupportStatus(value: string) {
  if (value === "waiting_on_user") return "Waiting on learner";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSupportCategory(value: string) {
  const labels: Record<string, string> = { login_account: "Login or account", password_reset: "Password reset", bug: "Bug report", lesson_practice: "Lesson or practice", feature_request: "Feature request", other: "Other" };
  return labels[value] ?? formatSupportStatus(value);
}
