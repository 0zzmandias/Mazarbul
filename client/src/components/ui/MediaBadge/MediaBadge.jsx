import React from "react";
import { Film, BookOpen, Gamepad2, Disc } from "lucide-react";
import { cx } from "../../../utils/formatters";

// Mapa de ícones para cada tipo de mídia
const iconMap = {
  filme: Film,
  livro: BookOpen,
  jogo: Gamepad2,
  album: Disc,
};

// Este componente exibe um selo com ícone e texto para um tipo de mídia.
function MediaBadge({ type, label, compact = false }) {
  // Define o tamanho do ícone e o padding com base na prop 'compact'
  const size = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const padding = compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs";

  const Icon = iconMap[type] || Film; // Usa o ícone de Filme como padrão

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-300 bg-white/70 dark:bg-neutral-900/60 backdrop-blur",
        padding,
      )}
    >
      <Icon className={size} />
      {label}
    </span>
  );
}

export default MediaBadge;
