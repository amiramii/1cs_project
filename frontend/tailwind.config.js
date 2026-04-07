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
        "blue-primary": "#51689a",
        "blue-secondary": "#74A7BD",
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