import React from "react";
import { MessageSquare } from "lucide-react";

import ReviewCard from "../ReviewCard/ReviewCard.jsx";
import ExpandButton from "../../ui/ExpandButton/ExpandButton.jsx"; // Importando o novo botão

// Componente para exibir o painel de reviews de um usuário.
function ReviewsPanel({ reviews, t, containerHeight, handle }) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col min-h-0"
      style={{ height: containerHeight || undefined }}
    >
      {/* Cabeçalho da Seção */}
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <MessageSquare className="w-4 h-4" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
            {t("section.reviews")}
          </h3>
        </div>

        {/* Div espaçador (caso necessário para o grid layout se manter consistente) */}
        <div></div>

        {/* Botão Expandir (+) */}
        {handle && (
          <div className="justify-self-end">
            <ExpandButton
              to={`/profile/${handle}/reviews`}
              ariaLabel={t("action.see_more")}
            />
          </div>
        )}
      </div>

      {/* Contêiner Rôlavel */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex-1 min-h-0">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 h-full overflow-y-auto">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ReviewsPanel;
