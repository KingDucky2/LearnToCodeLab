import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "LearnToCode Lab",
  description: "A complete adaptive coding school where lessons, practice, feedback, review, and projects respond to the learner.",
  metadataBase: new URL("https://learntocodelab.com")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
