import React from "react";
import { Users, Calendar, BookOpen, Film, Gamepad2, Disc } from "lucide-react";
import { Link } from "react-router-dom";
import { cx } from "../../../utils/formatters";

const TypeIcon = {
  livro: BookOpen,
  filme: Film,
  jogo: Gamepad2,
  album: Disc,
};

const ActivityLabelKey = {
  livro: "club.activity.livro",
  filme: "club.activity.filme",
  jogo: "club.activity.jogo",
  album: "club.activity.album",
};

export default function ClubCard({ club, t }) {
  // LÓGICA DE ADAPTAÇÃO:
  // Verifica se existe a lista nova 'activeWorks'. Se sim, pega o primeiro item.
  // Se não, tenta pegar o antigo 'currentWork' (caso algum dado antigo tenha sobrado).
  const primaryWork =
    club.activeWorks && club.activeWorks.length > 0
      ? club.activeWorks[0]
      : club.currentWork;

  // Define o ícone com base no tipo do trabalho principal
  const WorkIcon = primaryWork
    ? TypeIcon[primaryWork.type] || BookOpen
    : BookOpen;

  // Define o texto (Lendo/Jogando) com base no tipo
  const activityKey = primaryWork
    ? ActivityLabelKey[primaryWork.type] || "club.reading_now"
    : "club.reading_now";
  const activityText = t ? t(activityKey) : "Atividade";

  // Conta quantos extras existem além do principal
  const extraWorksCount = club.activeWorks
    ? Math.max(0, club.activeWorks.length - 1)
    : 0;

  return (
    <div className="group flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 hover:shadow-lg dark:hover:shadow-neutral-900/50">
      {/* Capa */}
      <div
        className={cx(
          "h-32 w-full bg-gradient-to-br p-4 flex flex-col justify-between",
          club.coverGradient,
        )}
      >
        <div className="flex justify-between items-start">
          <span className="px-2 py-1 rounded-md bg-black/20 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            {club.tags[0]?.replace("tag.", "")}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {club.name}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
            {club.description}
          </p>
        </div>

        {/* Card de Atividade Principal */}
        {primaryWork && (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center text-indigo-500 shadow-sm">
              <WorkIcon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">
                {activityText}
              </span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 line-clamp-1">
                {primaryWork.title}
              </span>
            </div>

            {/* Badge indicando "+2" se houver mais atividades */}
            {extraWorksCount > 0 && (
              <div
                className="absolute top-2 right-2 text-[10px] font-bold text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full"
                title={`+${extraWorksCount} outras atividades`}
              >
                +{extraWorksCount}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto">
          {club.tags.slice(1).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              #{t ? t(tag) : tag.replace("tag.", "")}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Users size={14} />
            <span>{club.membersCount}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <Calendar size={14} />
            <span>{club.nextMeeting}</span>
          </div>
        </div>

        <Link
          to={`/club/${club.id}`}
          className="mt-2 w-full h-10 flex items-center justify-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t ? t("action.visit_club") : "Visitar Clube"}
        </Link>
      </div>
    </div>
  );
}
