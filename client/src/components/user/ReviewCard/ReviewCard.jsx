import React from "react";
import { Link } from "react-router-dom";
import { cx, formatScore } from "../../../utils/formatters";
import RatingStars from "../../ui/RatingStars/RatingStars.jsx";
import MediaBadge from "../../ui/MediaBadge/MediaBadge.jsx";

// Paleta de cores para o placeholder da capa (caso não tenha imagem)
const typeColors = {
  filme: "from-indigo-500 to-purple-600",
  livro: "from-emerald-500 to-teal-600",
  jogo: "from-rose-500 to-orange-600",
  album: "from-amber-500 to-yellow-600",
};

export default function ReviewCard({ review, t }) {
  // Se a review tiver dados de usuário, mostramos o cabeçalho de autor
  const showAuthor = !!review.user;

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
      {/* CABEÇALHO DO AUTOR (Novo: Para a Home) */}
      {showAuthor && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Link
            to={`/profile/${review.user.handle.replace("@", "")}`}
            className="shrink-0"
          >
            {review.user.avatarUrl ? (
              <img
                src={review.user.avatarUrl}
                alt={review.user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {review.user.avatar || review.user.name[0]}
              </div>
            )}
          </Link>
          <div className="flex flex-col leading-tight">
            <Link
              to={`/profile/${review.user.handle.replace("@", "")}`}
              className="font-semibold text-sm hover:underline text-neutral-900 dark:text-neutral-100"
            >
              {review.user.name}
            </Link>
            <span className="text-xs text-neutral-500">
              {review.user.handle}
            </span>
          </div>
          <span className="ml-auto text-xs text-neutral-400">
            {review.date}
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Poster / Capa (Miniatura) */}
        <Link
          to={`/media/${review.type}/${review.mediaId || "m1"}`}
          className="shrink-0"
        >
          <div
            className={cx(
              "w-16 h-24 rounded-lg bg-gradient-to-br shadow-sm",
              typeColors[review.type] || "from-gray-500 to-gray-600",
            )}
          />
        </Link>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MediaBadge
                  type={review.type}
                  compact
                  label={t ? t(`badge.${review.type}`) : review.type}
                />
                {!showAuthor && (
                  <span className="text-xs text-neutral-500">
                    {review.date}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                {review.title}
              </h4>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400 leading-none">
                {formatScore(review.score)}
              </span>
              <div className="scale-75 origin-right">
                <RatingStars score={review.score} />
              </div>
            </div>
          </div>

          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
            "{review.text}"
          </p>

          {/* Tags (Opcional) */}
          {review.tags && (
            <div className="mt-auto pt-2 flex gap-1 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
              {review.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
                >
                  {t ? t(tag) : tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
