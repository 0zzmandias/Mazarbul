import React from "react";

// Componente para exibir uma pilha de avatares com as iniciais dos nomes.
function AvatarStack({ names }) {
  // Se 'names' não for um array, não renderiza nada para evitar erros.
  if (!Array.isArray(names)) {
    return null;
  }

  return (
    <div className="flex -space-x-2">
      {/* Mostra os primeiros 5 avatares */}
      {names.slice(0, 5).map((name, i) => (
        <div
          key={i}
          title={name} // O nome completo aparece ao passar o mouse
          className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-[10px] font-semibold text-neutral-700 dark:text-neutral-200"
        >
          {name.substring(0, 1).toUpperCase()}
        </div>
      ))}

      {/* Se houver mais de 5 nomes, mostra um contador */}
      {names.length > 5 && (
        <div className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-600 dark:text-neutral-200">
          +{names.length - 5}
        </div>
      )}
    </div>
  );
}

export default AvatarStack;
