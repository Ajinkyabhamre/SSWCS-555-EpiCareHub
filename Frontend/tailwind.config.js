/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        eh: {
          1: "#30302F", // gray
          2: "#EBDFC7", // cream
          3: "#E49B42", // gold
          4: "#65A19F", // blue
          5: "#483029", // brown
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
