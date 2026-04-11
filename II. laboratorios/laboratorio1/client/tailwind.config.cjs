/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      opacity: {
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        15: "0.15",
        20: "0.2",
        30: "0.3",
        40: "0.4",
        60: "0.6",
        70: "0.7",
        75: "0.75",
        80: "0.8",
        85: "0.85",
      },
      colors: {
        border: "hsl(0 0% 100% / 0.12)",
        input: "hsl(0 0% 100% / 0.12)",
        ring: "hsl(191 95% 42%)",
        background: "hsl(224 47% 8%)",
        foreground: "hsl(210 40% 98%)",
        primary: {
          DEFAULT: "hsl(191 95% 42%)",
          foreground: "hsl(222 47% 11%)",
        },
        secondary: {
          DEFAULT: "hsl(158 64% 45%)",
          foreground: "hsl(222 47% 11%)",
        },
        muted: {
          DEFAULT: "hsl(223 35% 18%)",
          foreground: "hsl(215 20% 75%)",
        },
        accent: {
          DEFAULT: "hsl(173 84% 39%)",
          foreground: "hsl(222 47% 11%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(210 40% 98%)",
        },
        card: {
          DEFAULT: "hsl(223 47% 12%)",
          foreground: "hsl(210 40% 98%)",
        },
      },
      boxShadow: {
        soft: "0 18px 45px -24px rgba(15, 23, 42, 0.65)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
