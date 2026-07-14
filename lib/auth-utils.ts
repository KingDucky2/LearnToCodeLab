export const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/sign-in", "/auth/create-account"] as const;

export const protectedRoutes = ["/dashboard", "/profile", "/settings", "/onboarding", "/admin", "/my-learning", "/projects"] as const;

const fallbackPath = "/dashboard";

export function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAuthPath(pathname: string) {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function sanitizeReturnPath(value: string | null | undefined, fallback = fallbackPath) {
  if (!value) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("\n") || decoded.includes("\r")) {
      return fallback;
    }

    const parsed = new URL(decoded, "https://learntocodelab.com");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function sanitizeAdminReturnPath(value: string | null | undefined, fallback = "/admin/maintenance") {
  const safePath = sanitizeReturnPath(value, fallback);
  return safePath === "/admin" || safePath.startsWith("/admin/") ? safePath : fallback;
}

export function getAuthErrorMessage(message: string | null | undefined) {
  const lower = (message ?? "").toLowerCase();

  if (!message) return "Something went wrong. Please try again.";
  if (lower.includes("invalid login credentials")) return "Invalid email or password.";
  if (lower.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (lower.includes("already registered") || lower.includes("already exists")) return "An account with this email already exists.";
  if (lower.includes("otp") || lower.includes("expired") || lower.includes("invalid token")) return "This link has expired or is invalid. Please request a new one.";
  if (lower.includes("oauth") || lower.includes("cancel")) return "Google sign-in was cancelled or could not be completed.";
  if (lower.includes("password")) return message;

  return "We could not complete that request. Please try again.";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordGuidance(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password)
  };
}

export function isStrongEnoughPassword(password: string) {
  const guidance = passwordGuidance(password);
  return guidance.length && guidance.letter && guidance.number;
}

const reservedUsernames = new Set(["admin", "api", "auth", "billing", "dashboard", "help", "login", "logout", "privacy", "settings", "signup", "support", "terms"]);

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) return { valid: true, normalized };
  if (normalized.length < 3 || normalized.length > 24) return { valid: false, normalized, message: "Username must be 3 to 24 characters." };
  if (!/^[a-z0-9_]+$/.test(normalized)) return { valid: false, normalized, message: "Use lowercase letters, numbers, and underscores only." };
  if (reservedUsernames.has(normalized)) return { valid: false, normalized, message: "That username is reserved." };
  return { valid: true, normalized };
}
