import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const ExpandButton = ({ to, onClick, ariaLabel = "Expandir" }) => {
  const baseClasses =
    "w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 group";

  // Se tiver a prop 'to', renderiza como Link (navegação)
  if (to) {
    return (
      <Link to={to} className={baseClasses} aria-label={ariaLabel}>
        <Plus
          size={18}
          strokeWidth={2.5}
          className="group-hover:scale-110 transition-transform"
        />
      </Link>
    );
  }

  // Se não, renderiza como botão normal (ação/modal)
  return (
    <button onClick={onClick} className={baseClasses} aria-label={ariaLabel}>
      <Plus
        size={18}
        strokeWidth={2.5}
        className="group-hover:scale-110 transition-transform"
      />
    </button>
  );
};

export default ExpandButton;
