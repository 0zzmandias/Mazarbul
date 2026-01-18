// Função para juntar nomes de classes de CSS de forma condicional.
// Ex: cx('classe1', false, 'classe2') retorna "classe1 classe2"
export const cx = (...classes) => classes.filter(Boolean).join(" ");

// Funções de ajuda para notas de 0 a 10
export const clamp10 = (n) => Math.min(10, Math.max(0, n));
export const roundToQuarter = (n) => Math.round(n * 4) / 4;

// Formata a nota para exibição, removendo casas decimais desnecessárias.
// Ex: 8.0 -> "8", 8.5 -> "8.5", 8.75 -> "8.75"
export const formatScore = (n) => {
  if (n === undefined || n === null || isNaN(n)) {
    return "0.0";
  }
  return Number.isInteger(n)
  ? n.toFixed(0)
  : n % 1 === 0.5
  ? n.toFixed(1)
  : n.toFixed(2).replace(/0$/, "");
};

// Formata a data para exibição (Aceita ISO do banco ou string do mock)
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  // Se a data for inválida, retorna a string original (caso do mock "18 Out 2025")
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

// Retorna o percentual de preenchimento (0 a 1) de uma estrela para uma dada nota.
export const starFillFor = (score, index) => {
  const s = roundToQuarter(clamp10(score));
  const starCount = s / 2; // Converte a nota 0-10 para uma contagem de estrelas 0-5
  return Math.max(0, Math.min(1, starCount - index));
};
