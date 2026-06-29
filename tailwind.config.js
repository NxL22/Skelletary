/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#07101f",
        ink: "#0f1b31",
        panel: "#15243f",
        cyan: "#7bdff6",
        lavender: "#b8b5ff",
        rose: "#f6abc8",
        line: "#243454",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        comic: ["var(--font-comic)"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 18px 45px rgba(7, 16, 31, 0.45)",
        card: "0 18px 35px rgba(2, 8, 23, 0.28)",
      },
      backgroundImage: {
        grid:
          "linear-gradient(rgba(123, 223, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(184, 181, 255, 0.08) 1px, transparent 1px)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 280ms ease-out",
      },
    },
  },
  plugins: [],
};
