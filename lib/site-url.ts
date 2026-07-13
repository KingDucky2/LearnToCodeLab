export function getSiteOrigin(requestUrl?: string) {
  if (requestUrl) return new URL(requestUrl).origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}
