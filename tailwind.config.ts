import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stoned Goose hazard yellow stays the hero accent, reserved for the
        // active path, selection, and confirmed jokes. The neutral ramp runs
        // slightly cool so the warm hazard pops against it.
        hazard: "#F2EA00",
        ink: {
          DEFAULT: "#0a0b0e",
          900: "#0a0b0e", // page
          800: "#14151a", // panels and bubbles
          700: "#1c1d24", // hubs and cards
          600: "#2a2c35", // borders
          500: "#3b3d49", // muted borders
          400: "#5a5d6c", // muted text and handles
        },
        bone: {
          DEFAULT: "#ece9e0",
          muted: "#a7a59c",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        hazard: "0 0 0 2px #F2EA00, 0 0 28px rgba(242,234,0,0.22)",
        bubble: "0 6px 22px rgba(0,0,0,0.45)",
        panel: "-12px 0 40px rgba(0,0,0,0.5)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
