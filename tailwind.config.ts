import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lab: {
          navy: "#06172f",
          blue: "#0b8cff",
          teal: "#02c995",
          mist: "#eef6ff",
          ink: "#07172f"
        }
      },
      boxShadow: {
        lab: "0 22px 65px rgba(5, 23, 53, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
