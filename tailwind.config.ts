import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
        // Forest green: headings, links, active states, dark panels.
        brand: {
          50: "#EEF4EF",
          100: "#DCE8DF",
          200: "#B8D1BF",
          300: "#8DB39A",
          400: "#5E8F70",
          500: "#2F6B4A",
          600: "#22583B",
          700: "#17442E",
          800: "#123726",
          900: "#0D2A1D",
        },
        // Orange: the main call to action on each page.
        flame: {
          50: "#FDF1E8",
          100: "#FBE1CC",
          400: "#EF8A45",
          500: "#E26A1C",
          600: "#C95A12",
          700: "#A4480E",
        },
        // Light paper tones (formerly the "industrial" panels).
        industrial: {
          950: "#F3EFE6",
          900: "#EEE9DD",
          850: "#E8E2D4",
          800: "#DED7C7",
          700: "#CFC6B2",
          600: "#8C8676",
          400: "#6B6556",
          300: "#514C40",
          200: "#2F2C25",
          100: "#FAF8F2",
          50: "#FDFCF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        elevation: "0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
        glow: "0 10px 24px -10px rgba(23, 68, 46, 0.55)",
        glass: "0 1px 2px rgba(35, 32, 20, 0.05), 0 10px 28px -14px rgba(23, 68, 46, 0.22)",
        "glass-hover": "0 2px 4px rgba(35, 32, 20, 0.06), 0 18px 36px -14px rgba(23, 68, 46, 0.32)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
