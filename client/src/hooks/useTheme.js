import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Verifica se o código está rodando no navegador antes de acessar o window
    if (typeof window === "undefined") return "light";

    // 1. Tenta pegar o tema salvo no localStorage
    const saved = localStorage.getItem("theme_v1");
    if (saved === "dark" || saved === "light") return saved;

    // 2. Se não houver tema salvo, verifica a preferência do sistema operacional
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Este efeito roda toda vez que o estado 'theme' muda
  useEffect(() => {
    try {
      // Salva a preferência atual do usuário no localStorage
      localStorage.setItem("theme_v1", theme);
    } catch (e) {
      // Ignora erros caso o localStorage não esteja disponível
      console.error("Failed to save theme to localStorage", e);
    }
  }, [theme]);

  return { theme, setTheme };
}
