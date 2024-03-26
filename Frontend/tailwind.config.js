/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        eh: {
          1: "#FFFFFF", // White
          2: "#EAEAEA", // Light gray
          3: "#D4D4D4", // Medium gray
          4: "#333333", // Dark gray
          5: "#000000", // Black
          6: "#FFA07A", // Light salmon
          7: "#FF7F50", // Coral
          8: "#FF6347", // Tomato
          9: "#FFD700", // Gold
          10: "#FFDAB9", // Peach puff
          11: "#FFA500", // Orange
          12: "#FF8C00", // Dark orange
          13: "#FF4500", // Orange red
          14: "#ADD8E6", // Light blue
          15: "#90EE90", // Light green
          16: "#E6E6FA", // Lavender
          17: "#708090", // Slate gray
          18: "#2F4F4F", // Dark slate gray
          19: "#00BFFF", // Deep sky blue
          20: "#00CED1", // Dark turquoise
          21: "#EEE8AA", // Pale goldenrod
          22: "#B0C4DE", // Light steel blue
          23: "#BC8F8F", // Rosy brown
        },
      },
    },
  },
  plugins: [],
};
