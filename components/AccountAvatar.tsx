"use client";

import { useEffect, useState } from "react";
import type { AccountIdentity } from "@/lib/identity";

const sizeClasses = {
  sm: "h-7 w-7 text-[10px] rounded-full",
  md: "h-8 w-8 text-xs rounded-lg",
  lg: "h-24 w-24 text-3xl rounded-lg"
} as const;

export function AccountAvatar({ identity, size = "md", className = "", decorative = false }: { identity: AccountIdentity; size?: keyof typeof sizeClasses; className?: string; decorative?: boolean }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const currentUrl = identity.avatarUrls.find((url) => !failedUrls.includes(url)) ?? null;

  useEffect(() => setFailedUrls([]), [identity.avatarUrls]);

  if (currentUrl) {
    return (
      // Remote provider and profile URLs are validated before reaching this component.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentUrl}
        alt={decorative ? "" : `${identity.label}'s avatar`}
        className={`${sizeClasses[size]} shrink-0 object-cover ${className}`}
        onError={() => setFailedUrls((urls) => [...urls, currentUrl])}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${identity.label}'s initials`} className={`${sizeClasses[size]} grid shrink-0 place-items-center bg-surface-secondary font-black text-primary ${className}`}>{identity.initials}</span>;
}
