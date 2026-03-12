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
          bg: "#f6f4f0",
          card: "#ffffff",
          gold: "#c8940a",
          green: "#0a8f65",
          red: "#d94444",
          text: "#1a1a1a",
          muted: "#6b6560",
          border: "#e5e0d8",
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
