import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../../utils/formatters";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_MAP = {
  Jan: 0,
  Fev: 1,
  Mar: 2,
  Abr: 3,
  Mai: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Set: 8,
  Out: 9,
  Nov: 10,
  Dez: 11,
};

export default function ActivityCalendar({ reviews, t }) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [filter, setFilter] = useState("todos"); // 1. Novo estado para o filtro

  const activeDays = useMemo(() => {
    const activity = new Set();
    if (!reviews) return activity;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    reviews.forEach((review) => {
      // 3. A lógica agora verifica o filtro antes de adicionar o dia
      if (filter !== "todos" && review.type !== filter) {
        return; // Pula esta review se não corresponder ao filtro
      }

      const parts = review.date.split(" ");
      if (parts.length < 3) return;

      const day = parseInt(parts[0], 10);
      const month = MONTH_MAP[parts[1]];
      const year = parseInt(parts[2], 10);

      if (year === currentYear && month === currentMonth) {
        activity.add(day);
      }
    });

    return activity;
  }, [reviews, currentDate, filter]); // Adicionamos 'filter' às dependências

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const paddingDays = Array(firstDayOfMonth).fill(null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...paddingDays, ...monthDays];
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const filterChips = [
    { k: "todos", label: t("filter.all") },
    { k: "filme", label: t("filter.movies") }, // CORREÇÃO DO ERRO DE DIGITAÇÃO AQUI
    { k: "livro", label: t("filter.books") },
    { k: "jogo", label: t("filter.games") },
    { k: "album", label: t("filter.albums") },
  ];

  // CORREÇÃO: Função para formatar o mês corretamente
  const formatMonthTitle = (date) => {
    const formatted = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    // Garante que o "de" seja minúsculo e a primeira letra do mês seja maiúscula
    return formatted
      .replace(" de ", " de ")
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  };

  return (
    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 min-h-[320px]">
      <div className="flex items-center justify-between">
        {/* CORREÇÃO: Removido 'capitalize' e usada a nova função de formatação */}
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
          {formatMonthTitle(currentDate)}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Botões de filtro adicionados */}
      <div className="flex items-center gap-2 text-xs flex-wrap my-4">
        {filterChips.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={cx(
              "px-3 py-1.5 rounded-full border",
              filter === f.k
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-sm">
        {calendarDays.map((day, index) => {
          const hasActivity = day && activeDays.has(day);
          return (
            <div key={index} className="flex justify-center items-center h-8">
              {day && (
                <span
                  className={cx(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    hasActivity &&
                      "bg-emerald-200/50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-semibold",
                  )}
                >
                  {day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
