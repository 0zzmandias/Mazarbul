import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import MediaBadge from "../MediaBadge/MediaBadge";
import RatingStars from "../RatingStars/RatingStars";
import {
  cx,
  clamp10,
  roundToQuarter,
  formatScore,
} from "../../../utils/formatters";

const palette = {
  filme: "from-indigo-500/25 via-indigo-500/10 to-transparent",
  livro: "from-emerald-500/25 via-emerald-500/10 to-transparent",
  jogo: "from-fuchsia-500/25 via-fuchsia-500/10 to-transparent",
  album: "from-amber-500/25 via-amber-500/10 to-transparent",
};

function MediaCard({ item, onClick, onRemove, wide = false, badgeLabel }) {
  const grad = palette[item.type] || palette.filme;

  const displayTitle =
    typeof item.title === "object" && item.title !== null
      ? item.title.PT
      : item.title;

  return (
    <motion.button
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cx(
        "group snap-start relative overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 text-left transition-transform duration-200 hover:z-10",
        wide ? "w-full" : "w-56 shrink-0",
        "h-64 flex flex-col",
      )}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-black/40 text-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hover:text-white"
          aria-label="Remover dos favoritos"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className={cx("h-32 w-full bg-gradient-to-br", grad)} />

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <MediaBadge type={item.type} label={badgeLabel} />
          <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
            {item.year}
          </span>
        </div>
        <div className="font-medium leading-snug text-neutral-800 dark:text-neutral-100 line-clamp-2 min-h-[2.6em]">
          {displayTitle}
        </div>
        <div className="mt-auto flex items-center gap-2 text-sm">
          <RatingStars score={item.score} />
          <span className="text-xs text-neutral-500">
            {formatScore(roundToQuarter(clamp10(item.score)))}
          </span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/5 to-transparent dark:from-white/5" />
    </motion.button>
  );
}

export default MediaCard;
