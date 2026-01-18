import React, { useState, useEffect } from "react";
import { cx, formatScore } from "../../../utils/formatters";
import RatingStars from "../../ui/RatingStars/RatingStars.jsx";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

const roundToQuarter = (n) => Math.round(n * 4) / 4;

const StarIcon = (props) => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" {...props}>
  <path d="M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.77 6.19 20.37l1.11-6.47-4.7-4.58 6.5-.94L12 2.5z" />
  </svg>
);

export default function UserReviewEditor({ mediaId, initialReview, communityAverage, t }) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza dados iniciais se o usuário já tiver uma review
  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating || 0);
      setReviewText(initialReview.content || "");
    }
  }, [initialReview]);

  const MAX_LENGTH = 500;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = rect.width;
    const rawRating = Math.max(0, (x / totalWidth) * 10);
    setHoverRating(roundToQuarter(rawRating));
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleClick = () => {
    setRating(hoverRating);
  };

  const handleSaveReview = async () => {
    if (!currentUser) {
      alert("Você precisa estar logado para avaliar.");
      return;
    }
    if (rating === 0) {
      alert("Por favor, selecione uma nota antes de salvar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/reviews", {
        mediaId,
        rating,
        content: reviewText
      });

      // Se houver conquistas novas, poderíamos mostrar aqui
      if (response.data.achievements?.length > 0) {
        console.log("Novas conquistas!", response.data.achievements);
      }

      alert("Avaliação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar review:", error);
      alert("Erro ao salvar sua avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating > 0 ? hoverRating : rating;
  const roundedCommunityAverage = roundToQuarter(communityAverage || 0);

  return (
    <div className="flex flex-col gap-8">
    {/* --- Seção "Sua Review" --- */}
    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
    {t("section.yourReview")}
    </h2>

    <div className="text-center mb-4">
    <div
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    onClick={handleClick}
    className="relative inline-flex cursor-pointer"
    aria-label={`Avaliar de 0 a 10. Nota atual: ${displayRating}`}
    >
    <div className="flex text-neutral-300 dark:text-neutral-700">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} />
    ))}
    </div>
    <div
    className="absolute top-0 left-0 h-full overflow-hidden flex"
    style={{ width: `${displayRating * 10}%` }}
    >
    {[...Array(5)].map((_, i) => (
      <StarIcon
      key={i}
      className="text-amber-500 fill-current shrink-0"
      />
    ))}
    </div>
    </div>
    <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mt-2 h-7">
    {displayRating > 0 ? formatScore(displayRating) : ""}
    </p>
    </div>

    <div className="relative">
    <textarea
    value={reviewText}
    onChange={(e) => setReviewText(e.target.value)}
    placeholder={t("form.placeholder.review")}
    maxLength={MAX_LENGTH}
    disabled={isSubmitting}
    className="w-full h-32 p-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none disabled:opacity-50"
    />
    <div className="absolute bottom-2 right-3 text-xs text-neutral-400">
    {reviewText.length}/{MAX_LENGTH}
    </div>
    </div>

    <button
    onClick={handleSaveReview}
    disabled={isSubmitting || rating === 0}
    className={cx(
      "w-full mt-4 h-10 rounded-lg text-white font-semibold text-sm transition-all flex items-center justify-center gap-2",
      (isSubmitting || rating === 0)
      ? "bg-neutral-400 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
    )}
    >
    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
    {isSubmitting ? "Salvando..." : t("action.saveReview")}
    </button>
    </div>

    {/* --- Seção "Média da Comunidade" --- */}
    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
    <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
    {t("section.communityAverage")}
    </h3>
    <div className="flex items-center gap-2">
    <RatingStars score={roundedCommunityAverage} />
    <span className="font-bold text-neutral-800 dark:text-neutral-200">
    {formatScore(roundedCommunityAverage)}
    </span>
    <span className="text-xs text-neutral-500">
    ({(communityAverage || 0).toFixed(2)})
    </span>
    </div>
    </div>
    </div>
  );
}
