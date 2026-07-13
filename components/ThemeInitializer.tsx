"use client";

import { useEffect } from "react";

export type ThemePreference = "system" | "light" | "dark";

export function applyDisplayPreferences(theme: ThemePreference, reducedMotion: boolean) {
  const resolvedTheme = theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : theme === "system" ? "light" : theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.reducedMotion = String(reducedMotion);
}

export function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = (localStorage.getItem("ltcl:theme") as ThemePreference | null) ?? "system";
    const reducedMotion = localStorage.getItem("ltcl:reduced-motion") === "true";
    applyDisplayPreferences(savedTheme, reducedMotion);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if ((localStorage.getItem("ltcl:theme") ?? "system") === "system") {
        applyDisplayPreferences("system", reducedMotion);
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return null;
}
