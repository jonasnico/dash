/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        base: ["var(--font-weight-base)"],
        heading: ["var(--font-weight-heading)"],
      },
      borderRadius: {
        base: "var(--radius-base)",
      },
      translate: {
        boxShadowX: "var(--spacing-boxShadowX)",
        boxShadowY: "var(--spacing-boxShadowY)",
        reverseBoxShadowX: "var(--spacing-reverseBoxShadowX)",
        reverseBoxShadowY: "var(--spacing-reverseBoxShadowY)",
      },
      boxShadow: {
        shadow: "var(--shadow-shadow)",
      },
      colors: {
        background: "var(--color-background)",
        "secondary-background": "var(--color-secondary-background)",
        foreground: "var(--color-foreground)",
        main: "var(--color-main)",
        "main-foreground": "var(--color-main-foreground)",
        border: "var(--color-border)",
        ring: "var(--color-ring)",
      },
    },
  },
  plugins: [],
};
