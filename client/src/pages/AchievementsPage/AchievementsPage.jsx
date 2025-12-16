import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { cx } from "../../utils/formatters";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  useUserProfileData,
  MASTER_ACHIEVEMENTS_LIST,
} from "../../hooks/useUserProfileData.js"; // Importando dados reais

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import BadgeCard from "../../components/user/BadgeCard/BadgeCard.jsx";

const COLORS = { bronze: "#cd7f32", silver: "#9ca3af", gold: "#eab308" };

const AchievementsPage = ({ theme, setTheme, lang, setLang, t }) => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Busca os dados do usuário dono do perfil
  const { badges } = useUserProfileData(handle);

  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // Lógica de Proteção
  const isOwner =
    currentUser &&
    handle &&
    currentUser.handle.toLowerCase() === handle.toLowerCase();

  useEffect(() => {
    if (!isOwner) {
      navigate(`/profile/${handle}`);
    }
  }, [handle, isOwner, navigate]);

  if (!isOwner) return null;

  // Transforma o array de badges do usuário em um objeto chave-valor para acesso rápido
  // Ex: { 'the-one': 14, 'narya': 55 }
  const userProgressMap = (badges || []).reduce((acc, badge) => {
    acc[badge.id] = badge.progress;
    return acc;
  }, {});

  const calculateProgress = (current, tiers) => {
    const [bronze, silver, gold] = tiers;
    let target = bronze;
    let percentage = 0;
    let barColor = COLORS.bronze;

    if (current < bronze) {
      target = bronze;
      percentage = (current / bronze) * 100;
      barColor = COLORS.bronze;
    } else if (current < silver) {
      target = silver;
      percentage = ((current - bronze) / (silver - bronze)) * 100;
      barColor = COLORS.silver;
    } else if (current < gold) {
      target = gold;
      percentage = ((current - silver) / (gold - silver)) * 100;
      barColor = COLORS.gold;
    } else {
      target = gold;
      percentage = 100;
      barColor = COLORS.gold;
    }
    return { percentage, target, barColor };
  };

  return (
    <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
        <HeaderBar
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          t={t}
        />

        <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
              {t("achievements.title")}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              {t("achievements.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Mapeamos a lista MESTRA para exibir todos os slots possíveis */}
            {MASTER_ACHIEVEMENTS_LIST.map((achievement) => {
              const displayTitle = achievement.id
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              const enrichedAchievement = {
                ...achievement,
                title: displayTitle,
              };

              // Pegamos o progresso real do mapa
              const progress = userProgressMap[achievement.id] || 0;

              return (
                <BadgeCard
                  key={achievement.id}
                  achievement={enrichedAchievement}
                  currentProgress={progress}
                  onClick={() =>
                    setSelectedAchievement({ ...enrichedAchievement, progress })
                  }
                />
              );
            })}
          </div>

          {selectedAchievement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 transform scale-125 pointer-events-none">
                    <BadgeCard
                      achievement={selectedAchievement}
                      currentProgress={selectedAchievement.progress}
                      onClick={() => {}}
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
                    {selectedAchievement.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 px-4">
                    {t(`achievement.desc.${selectedAchievement.id}`)}
                  </p>
                  {(() => {
                    const { percentage, target, barColor } = calculateProgress(
                      selectedAchievement.progress,
                      selectedAchievement.tiers,
                    );
                    return (
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                            {t("achievements.progress")}
                          </span>
                          <span
                            className="text-xl font-mono font-bold"
                            style={{ color: barColor }}
                          >
                            {selectedAchievement.progress}{" "}
                            <span className="text-neutral-400 text-sm">
                              / {target}
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <div className="mt-1 text-right">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AchievementsPage;
