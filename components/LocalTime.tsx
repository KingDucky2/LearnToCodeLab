"use client";

import { useEffect, useState } from "react";
import { formatLocalDateTime, formatLocalDateTimeFull } from "@/lib/local-time";

export function LocalTime({ value, className }: { value: string; className?: string }) {
  const [rendered, setRendered] = useState<string | null>(null);
  const [title, setTitle] = useState<string | undefined>();

  useEffect(() => {
    const update = () => {
      setRendered(formatLocalDateTime(value, { locale: navigator.language }));
      setTitle(formatLocalDateTimeFull(value, navigator.language));
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [value]);

  return <time dateTime={value} title={title} className={className} suppressHydrationWarning>{rendered ?? "Local time"}</time>;
}
