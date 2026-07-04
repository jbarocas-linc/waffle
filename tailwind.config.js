/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F1EA", // warm off-white, from the logo ground
        ink: "#2B211A", // dark roast — body text
        accent: "#EE9E31", // golden amber, from the wordmark (pair with ink text)
        "accent-deep": "#A9690F", // toasted amber — links, icons, hovers on light bg
        crust: "#D98F58", // waffle body
        cream: "#EFD9B4", // waffle lattice
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Karla", "system-ui", "sans-serif"],
        logo: ["Quicksand", "Karla", "sans-serif"],
      },
    },
  },
  plugins: [],
};
