/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#dbe6ff",
          200: "#b3c9ff",
          300: "#85a7ff",
          400: "#5c82ff",
          500: "#3d5cf5",
          600: "#2c40d8",
          700: "#2331ab",
          800: "#1f2a86",
          900: "#1b2568",
        },
      },
    },
  },
  plugins: [],
};
