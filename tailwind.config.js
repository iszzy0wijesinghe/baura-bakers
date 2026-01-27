/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#f9f4e0",
          ink: "#372619",
        },
      },
    },
  },
  plugins: [],
};

