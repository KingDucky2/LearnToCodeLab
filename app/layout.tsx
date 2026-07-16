import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitializer } from "@/components/ThemeInitializer";

const initializeTheme = `
  (() => {
    try {
      const preference = localStorage.getItem("ltcl:theme") || "system";
      const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.dataset.reducedMotion = String(localStorage.getItem("ltcl:reduced-motion") === "true");
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: "LearnToCode Lab",
  description: "A complete adaptive coding school where lessons, practice, feedback, review, and projects respond to the learner.",
  metadataBase: new URL("https://learntocodelab.com")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initializeTheme }} /></head>
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
