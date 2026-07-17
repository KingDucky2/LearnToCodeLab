export type IdentityMetadata = Record<string, unknown>;

export type AuthIdentityInput = {
  provider?: string | null;
  identity_data?: IdentityMetadata | null;
};

export type AuthUserIdentityInput = {
  email?: string | null;
  user_metadata?: IdentityMetadata | null;
  identities?: AuthIdentityInput[] | null;
};

export type ProfileIdentityInput = {
  display_name?: string | null;
  avatar_url?: string | null;
  avatar_source?: "provider" | "custom" | string | null;
};

export type AccountIdentity = {
  label: string;
  email: string;
  avatarUrl: string | null;
  avatarUrls: string[];
  initials: string;
  googleConnected: boolean;
  providers: string[];
};

function metadataString(metadata: IdentityMetadata | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function normalizeAvatarUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && !(url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1"))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isLegacyProviderAvatar(value: string | null) {
  if (!value) return false;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "lh3.googleusercontent.com" || hostname.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

export function getInitials(label: string) {
  const normalized = label.trim().replace(/@.*$/, "");
  const parts = normalized.split(/[\s._-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.slice(0, 2);
  return (initials || "L").toUpperCase();
}

export function resolveAccountIdentity(user: AuthUserIdentityInput, profile?: ProfileIdentityInput | null): AccountIdentity {
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const providers = [...new Set(identities.map((identity) => identity.provider?.trim().toLowerCase()).filter((provider): provider is string => Boolean(provider)))];
  const googleIdentity = identities.find((identity) => identity.provider?.toLowerCase() === "google");
  const providerMetadata = googleIdentity?.identity_data ?? identities.find((identity) => identity.identity_data)?.identity_data;
  const email = user.email?.trim() || "";
  const label = profile?.display_name?.trim()
    || metadataString(user.user_metadata, ["full_name", "name", "display_name"])
    || metadataString(providerMetadata, ["full_name", "name", "display_name"])
    || email.split("@")[0]
    || "Learner";
  const storedAvatar = normalizeAvatarUrl(profile?.avatar_url);
  const providerAvatar = normalizeAvatarUrl(metadataString(providerMetadata, ["avatar_url", "picture"]));
  const userAvatar = normalizeAvatarUrl(metadataString(user.user_metadata, ["avatar_url", "picture"]));
  // `profiles.avatar_url` historically held both custom uploads and a snapshot
  // of provider metadata. Only an explicitly custom avatar should outrank the
  // current Supabase identity; provider snapshots remain a final fallback for
  // older accounts whose identity metadata is temporarily unavailable.
  const providerStoredAvatar = profile?.avatar_source === "provider"
    || (!profile?.avatar_source && isLegacyProviderAvatar(storedAvatar));
  const customAvatar = providerStoredAvatar ? null : storedAvatar;
  const providerSnapshot = providerStoredAvatar ? storedAvatar : null;
  const avatarUrls = [...new Set([customAvatar, providerAvatar, userAvatar, providerSnapshot].filter((url): url is string => Boolean(url)))];

  return {
    label,
    email,
    avatarUrl: avatarUrls[0] ?? null,
    avatarUrls,
    initials: getInitials(label),
    googleConnected: providers.includes("google"),
    providers
  };
}
