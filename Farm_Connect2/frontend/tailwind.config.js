/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nature: {
          green: "#064e3b", // Deep Emerald
          lightGreen: "#10b981", // Vibrant Green
          accent: "#34d399", // Soft Accent
          leaf: "#ecfdf5", // Lightest Green background
          dark: "#022c22", // Almost black green
          cream: "#fbfbfa", // Warm white
          surface: "#ffffff",
          border: "#e5e7eb",
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
