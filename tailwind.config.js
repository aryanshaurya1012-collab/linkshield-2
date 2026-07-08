/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'rain': 'rain linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rain: {
          '0%': { transform: 'translateY(-100px)', opacity: '0' },
          '10%': { opacity: '0.4' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(600px)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
