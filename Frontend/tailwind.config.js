/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        eh: {
          1: "#FFFFFF", // White
          2: "#EDE7F6", // Lavender
          3: "#D1C4E9", // Light Purple
          4: "#B39DDB", // Purple
          5: "#7E57C2", // Deep Purple
          6: "#2196F3", // Blue
          7: "#03A9F4", // Light Blue
          8: "#80DEEA", // Cyan
          9: "#4DB6AC", // Teal
          10: "#388E3C", // Green
          11: "#CDDC39", // Lime
          12: "#FFEB3B", // Yellow
          13: "#FFC107", // Amber
          14: "#FF5722", // Deep Orange
          15: "#F44336", // Red
        },
      },
      fontFamily: {
        crete: "var(--font-crete-round) !important",
        lora: "var(--font-lora) !important",
      },
    },
  },
  plugins: [],
};
