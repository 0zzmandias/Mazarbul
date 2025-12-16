import React from "react";
import ExpandButton from "../../ui/ExpandButton/ExpandButton.jsx"; // Importando o novo botão padronizado

// Componente para o cabeçalho de uma seção, com título, ícone e filtros.
function SectionHeader({ title, href, icon, filters, t }) {
  return (
    <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
      {/* Lado esquerdo: Ícone e Título */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        {icon}
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </h3>
      </div>

      {/* Centro: Filtros (opcional) */}
      <div className="justify-self-center overflow-x-auto no-scrollbar w-full lg:w-auto px-2 lg:px-0">
        <div className="flex items-center gap-2 text-xs flex-wrap justify-center whitespace-nowrap">
          {filters}
        </div>
      </div>

      {/* Lado direito: Botão Expandir (+) padronizado */}
      <div className="justify-self-end">
        {href ? (
          <ExpandButton to={href} ariaLabel={t("action.explore")} />
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

export default SectionHeader;
