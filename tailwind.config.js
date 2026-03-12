/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alkansya: {
          bg: "#080e1a",
          card: "#0d1526",
          gold: "#ffc300",
          green: "#00d296",
          red: "#ff6b6b",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
