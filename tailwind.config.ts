import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        primary: colors.violet,
        secondary: colors.orange,
        // Semantic colors for hex tiles
        hex: {
          border: {
            DEFAULT: colors.slate[300],
            hover: colors.slate[800],
            selected: colors.slate[950],
          },
          fill: {
            DEFAULT: "transparent",
            hover: `rgb(${colors.slate[300]} / 0.1)`,
            selected: `rgb(${colors.orange[400]} / 0.8)`,
          },
        },
      },
      spacing: {
        hex: "64px", // Base hex size
        "hex-spacing": "48px", // Horizontal spacing between hexes
      },
      borderRadius: {
        hex: "12px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      screens: {
        xs: "475px",
        ...fontFamily.sans,
      },
      boxShadow: {
        hex: "0 0 15px -3px rgba(var(--color-primary-500), 0.3)",
        "hex-hover": "0 0 20px -2px rgba(var(--color-primary-500), 0.4)",
      },
      transitionTimingFunction: {
        hex: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "65ch",
            color: "var(--color-primary-950)",
            h1: {
              color: "var(--color-primary-900)",
            },
            h2: {
              color: "var(--color-primary-800)",
            },
            h3: {
              color: "var(--color-primary-700)",
            },
            strong: {
              color: "var(--color-primary-900)",
            },
            a: {
              color: "var(--color-secondary-600)",
              "&:hover": {
                color: "var(--color-secondary-700)",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
