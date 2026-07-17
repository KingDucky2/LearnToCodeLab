export const reservedUsernames = ["admin", "owner", "staff", "support", "moderator", "learntocodelab", "system", "null", "undefined"] as const;
const reservedSet = new Set<string>(reservedUsernames);
const staffImpersonation = /(owner|administrator|admin|staff|moderator|learntocodelabstaff|officialsupport)/;

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(value: string) {
  const normalized = normalizeDisplayName(value);
  if (normalized.length < 2 || normalized.length > 40) return { valid: false as const, normalized, message: "Display name must be 2 to 40 characters." };
  if (/(https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+)/i.test(normalized)) return { valid: false as const, normalized, message: "Display names cannot contain URLs or email addresses." };
  if (!/^[\p{L}][\p{L}\p{M}\s'’.,-]*[\p{L}.]$/u.test(normalized) || /['’.,-]{3,}/.test(normalized)) return { valid: false as const, normalized, message: "Use letters, spaces, and ordinary name punctuation only." };
  const comparable = normalized.toLowerCase().replace(/[^a-z]/g, "");
  if (staffImpersonation.test(comparable)) return { valid: false as const, normalized, message: "Display names cannot contain staff or official role titles." };
  return { valid: true as const, normalized };
}

export function usernameComparisonKey(value: string) {
  return value.trim().toLowerCase();
}

export function validateProfileUsername(value: string, optional = false) {
  const display = value.trim();
  const comparison = usernameComparisonKey(display);
  if (!display && optional) return { valid: true as const, display: "", comparison };
  if (display.length < 3 || display.length > 20) return { valid: false as const, display, comparison, message: "Use 3 to 20 characters." };
  if (!/^[A-Za-z0-9_]+$/.test(display)) return { valid: false as const, display, comparison, message: "Use letters, numbers, and underscores only." };
  if (display.startsWith("_") || display.endsWith("_")) return { valid: false as const, display, comparison, message: "Do not begin or end with an underscore." };
  if (display.includes("__")) return { valid: false as const, display, comparison, message: "Do not use consecutive underscores." };
  if (reservedSet.has(comparison)) return { valid: false as const, display, comparison, message: "That username is reserved." };
  return { valid: true as const, display, comparison };
}

export const onboardingExperienceLevels = ["Completely new", "I've tried a little", "Beginner", "Intermediate", "Advanced"] as const;
export const onboardingGoals = ["Build websites", "Learn programming basics", "Make games", "Build mobile apps", "Learn Python", "Learn JavaScript", "Prepare for school", "Coding careers", "Something else"] as const;
export const onboardingLanguages = ["html", "css", "javascript", "python", "cpp", "swift", "lua", "help_me_choose"] as const;
export const learningFormats = ["guided_lessons", "projects", "quizzes", "mixed"] as const;
export const dailyMinuteOptions = [10, 20, 30, 45, 60] as const;
