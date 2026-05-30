/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "blue-primary": "#51689A",
        "blue-secondary": "#74A7BD",
        /** Chekin brand — aligns with globals.css */
        "chekin-navy": "#1B2065",
        "chekin-bg": "#F6F7FE",
        "chekin-card": "#FEF9F9",
        "chekin-warning": "#E7CE51",
        "chekin-danger": "#C71122",
        "white-primary": "#EEF4F7",
	      background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "card-foreground": "hsl(var(--card-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",   // <-- THIS is the missing piece
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        status: {
          info: {
            bg: "hsl(var(--status-info-bg))",
            fg: "hsl(var(--status-info-fg))",
            border: "hsl(var(--status-info-border))",
          },
          warning: {
            bg: "hsl(var(--status-warning-bg))",
            fg: "hsl(var(--status-warning-fg))",
            border: "hsl(var(--status-warning-border))",
          },
          danger: {
            bg: "hsl(var(--status-danger-bg))",
            fg: "hsl(var(--status-danger-fg))",
            border: "hsl(var(--status-danger-border))",
          },
          success: {
            bg: "hsl(var(--status-success-bg))",
            fg: "hsl(var(--status-success-fg))",
            border: "hsl(var(--status-success-border))",
          },
        },
      },
      fontFamily: {
        inter: ["var(--font-inter)"],
        montserrat: ["var(--font-montserrat)"],
        arabic: ["var(--font-arabic)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        loginDark: "0px 0px 35px rgb(238 244 247)",
        loginLight: "0 0px 35px rgb(238 244 247)",
        /** Filled auth buttons: glow matches blue base (light theme). */
        "btn-fill-light-rest": "0 0 32px rgba(81, 104, 154, 0.4)",
        /** Filled auth buttons: glow matches white hover fill (light theme). */
        "btn-fill-light-hover": "0 0 32px rgba(238, 244, 247, 0.95)",
        /** Filled auth buttons: glow matches blue-secondary base (dark theme). */
        "btn-fill-dark-rest": "0 0 32px rgba(116, 167, 189, 0.45)",
        /** Filled auth buttons: glow matches white-primary hover (dark theme). */
        "btn-fill-dark-hover": "0 0 36px rgba(238, 244, 247, 0.55)",
      },
    },
  },
  plugins: [
	 require("@tailwindcss/forms"),
     require("tailwindcss-animate"),
  ],
};