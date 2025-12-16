// Função para juntar nomes de classes de CSS de forma condicional.
// Ex: cx('classe1', false, 'classe2') retorna "classe1 classe2"
export const cx = (...classes) => classes.filter(Boolean).join(" ");

// Funções de ajuda para notas de 0 a 10
export const clamp10 = (n) => Math.min(10, Math.max(0, n));
export const roundToQuarter = (n) => Math.round(n * 4) / 4;

// Formata a nota para exibição, removendo casas decimais desnecessárias.
// Ex: 8.0 -> "8", 8.5 -> "8.5", 8.75 -> "8.75"
export const formatScore = (n) =>
  Number.isInteger(n)
    ? n.toFixed(0)
    : n % 1 === 0.5
      ? n.toFixed(1)
      : n.toFixed(2).replace(/0$/, "");

// Retorna o percentual de preenchimento (0 a 1) de uma estrela para uma dada nota.
// A nota é de 0-10, mas temos 5 estrelas, então uma nota 10 equivale a 5 estrelas.
export const starFillFor = (score, index) => {
  const s = roundToQuarter(clamp10(score));
  const starCount = s / 2; // Converte a nota 0-10 para uma contagem de estrelas 0-5
  return Math.max(0, Math.min(1, starCount - index));
};
