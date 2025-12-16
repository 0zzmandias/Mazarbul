import React, { useId } from "react";
import {
  roundToQuarter,
  clamp10,
  starFillFor,
} from "../../../utils/formatters";

// Este componente recebe uma nota 'score' e a renderiza como 5 estrelas.
function RatingStars({ score }) {
  const id = useId();
  const s = roundToQuarter(clamp10(score));

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`Nota ${s} de 10`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = starFillFor(s, i); // Calcula o preenchimento (0 a 1)
        const clipId = `${id}-clip-${i}`;

        return (
          <svg key={i} viewBox="0 0 24 24" className="w-4 h-4">
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            {/* Estrela base (vazia) */}
            <path
              d="M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.77 6.19 20.37l1.11-6.47-4.7-4.58 6.5-.94L12 2.5z"
              className="text-neutral-300 dark:text-neutral-700"
              fill="currentColor"
            />
            {/* Estrela de preenchimento (parcial ou total), "cortada" pelo clipPath */}
            <g clipPath={`url(#${clipId})`}>
              <path
                d="M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.77 6.19 20.37l1.11-6.47-4.7-4.58 6.5-.94L12 2.5z"
                className="text-amber-500"
                fill="currentColor"
              />
            </g>
          </svg>
        );
      })}
    </div>
  );
}

export default RatingStars;
