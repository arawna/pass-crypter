import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f8ff",
          100: "#dbe5ff",
          200: "#b8caff",
          300: "#8eaaff",
          400: "#6a8bff",
          500: "#456cff",
          600: "#3354db",
          700: "#263fb0",
          800: "#1b2d85",
          900: "#111d59"
        }
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(17, 24, 39, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
