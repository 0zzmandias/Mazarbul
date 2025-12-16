/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Diz ao Tailwind para escanear todos os arquivos relevantes na pasta src
  ],
  darkMode: "class", // Habilita o modo escuro baseado em classe (ex: <div class="dark">)
  theme: {
    extend: {},
  },
  plugins: [],
};
