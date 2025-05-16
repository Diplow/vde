import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.tsx"],
  safelist: [
    "fill-amber-50",
    "fill-amber-100",
    "fill-amber-200",
    "fill-amber-300",
    "fill-amber-400",
    "fill-amber-500",
    "fill-amber-600",
    "fill-amber-700",
    "fill-amber-800",
    "fill-amber-900",
    "fill-amber-950",
    "fill-zinc-50",
    "fill-zinc-100",
    "fill-zinc-200",
    "fill-zinc-300",
    "fill-zinc-400",
    "fill-zinc-500",
    "fill-zinc-600",
    "fill-zinc-700",
    "fill-zinc-800",
    "fill-zinc-900",
    "fill-zinc-950",
    "fill-emerald-50",
    "fill-emerald-100",
    "fill-emerald-200",
    "fill-emerald-300",
    "fill-emerald-400",
    "fill-emerald-500",
    "fill-emerald-600",
    "fill-emerald-700",
    "fill-emerald-800",
    "fill-emerald-900",
    "fill-emerald-950",
    "fill-cyan-50",
    "fill-cyan-100",
    "fill-cyan-200",
    "fill-cyan-300",
    "fill-cyan-400",
    "fill-cyan-500",
    "fill-cyan-600",
    "fill-cyan-700",
    "fill-cyan-800",
    "fill-cyan-900",
    "fill-cyan-950",
    "fill-indigo-50",
    "fill-indigo-100",
    "fill-indigo-200",
    "fill-indigo-300",
    "fill-indigo-400",
    "fill-indigo-500",
    "fill-indigo-600",
    "fill-indigo-700",
    "fill-indigo-800",
    "fill-indigo-900",
    "fill-indigo-950",
    "fill-fuchsia-50",
    "fill-fuchsia-100",
    "fill-fuchsia-200",
    "fill-fuchsia-300",
    "fill-fuchsia-400",
    "fill-fuchsia-500",
    "fill-fuchsia-600",
    "fill-fuchsia-700",
    "fill-fuchsia-800",
    "fill-fuchsia-900",
    "fill-fuchsia-950",
    "fill-rose-50",
    "fill-rose-100",
    "fill-rose-200",
    "fill-rose-300",
    "fill-rose-400",
    "fill-rose-500",
    "fill-rose-600",
    "fill-rose-700",
    "fill-rose-800",
    "fill-rose-900",
    "fill-rose-950",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        hex: {
          border: {
            DEFAULT: colors.slate[500],
            hover: colors.slate[800],
            selected: colors.slate[950],
          },
          fill: {
            DEFAULT: colors.slate[200],
            hover: `rgb(${colors.slate[300]} / 0.5)`,
            selected: `rgb(${colors.orange[400]} / 0.8)`,
          },
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      spacing: {
        hex: "64px",
        "hex-spacing": "48px",
      },
      borderRadius: {
        hex: "12px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-5px)",
          },
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
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
} satisfies Config;
