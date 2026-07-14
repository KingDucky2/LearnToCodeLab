import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-interactive": "var(--surface-interactive)",
        foreground: "var(--foreground)",
        secondary: "var(--foreground-secondary)",
        muted: "var(--foreground-muted)",
        subtle: "var(--foreground-subtle)",
        disabled: "var(--foreground-disabled)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-foreground": "var(--primary-foreground)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        lab: {
          navy: "#06172f",
          blue: "#0b8cff",
          teal: "#02c995",
          mist: "#eef6ff",
          ink: "#07172f"
        }
      },
      boxShadow: {
        lab: "var(--shadow-elevated)",
        surface: "var(--shadow-surface)"
      }
    }
  },
  plugins: []
};

export default config;
