import React from "react";
import RatingStars from "../../ui/RatingStars/RatingStars.jsx";
import { formatScore } from "../../../utils/formatters";

// Função de arredondamento para o quarto de ponto mais próximo
const roundToQuarter = (n) => Math.round(n * 4) / 4;

export default function CommunityReviewsFeed({ reviews, t }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div>
        {/* Usando t() para o título */}
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
          {t("section.communityReviews")}
        </h2>
        <p className="text-sm text-neutral-500 mt-2">
          Ainda não há reviews da comunidade para este item.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* A CORREÇÃO ESTÁ AQUI: Usando t() para o título */}
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
        {t("section.communityReviews")}
      </h2>
      <div className="flex flex-col gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex items-start gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-sm font-semibold text-neutral-700 dark:text-neutral-100">
              {review.user.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {review.user.name}
                  </span>
                  <span className="text-sm text-neutral-500 ml-2">
                    {review.user.handle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars score={review.score} />
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    {formatScore(roundToQuarter(review.score))}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                {review.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
