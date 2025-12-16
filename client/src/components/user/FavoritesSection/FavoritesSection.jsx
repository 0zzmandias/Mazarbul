import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star as StarIcon } from "lucide-react";

import { cx } from "../../../utils/formatters";
import MediaCard from "../../ui/MediaCard/MediaCard.jsx";
import ExpandButton from "../../ui/ExpandButton/ExpandButton.jsx"; // Importando o novo botão

function FavoritesSection({ items, t, handle }) {
  const [filter, setFilter] = useState("todos");

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => (filter === "todos" ? true : i.type === filter))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [filter, items]);

  const renderFilterChips = () => {
    const chips = [
      { k: "todos", label: t("filter.all") },
      { k: "filme", label: t("filter.movies") },
      { k: "livro", label: t("filter.books") },
      { k: "jogo", label: t("filter.games") },
      { k: "album", label: t("filter.albums") },
    ];
    return (
      <>
        {chips.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={cx(
              "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
              filter === f.k
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
            )}
          >
            {f.label}
          </button>
        ))}
      </>
    );
  };

  return (
    <section>
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        {/* Título e Ícone */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <StarIcon className="w-4 h-4" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
            {t("section.favorites")}
          </h3>
        </div>

        {/* Filtros (Chips) */}
        <div className="justify-self-start lg:justify-self-center overflow-x-auto no-scrollbar w-full lg:w-auto px-2 lg:px-0">
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            {renderFilterChips()}
          </div>
        </div>

        {/* Botão Expandir (+) */}
        <div className="justify-self-end">
          <ExpandButton
            to={`/profile/${handle}/favorites`}
            ariaLabel={t("action.explore")}
          />
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 min-h-[32.75rem]">
        {filteredItems.map((item) => (
          <Link to={`/media/${item.id}`} key={item.id}>
            <MediaCard item={item} wide badgeLabel={t(`badge.${item.type}`)} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default FavoritesSection;
