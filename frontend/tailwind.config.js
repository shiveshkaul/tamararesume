export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#1e5f74',
          darkTeal: '#1a5c6b',
          gold: '#c8892a',
          slate: '#2c2c2c',
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Nunito', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
