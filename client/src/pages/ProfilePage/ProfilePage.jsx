import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react"; // Importações para estados de carregamento

import { cx } from "../../utils/formatters";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ProfileHeader from "../../components/user/ProfileHeader/ProfileHeader.jsx";
import BadgesRibbon from "../../components/user/BadgesRibbon/BadgesRibbon.jsx";
import FavoritesSection from "../../components/user/FavoritesSection/FavoritesSection.jsx";
import ReviewsPanel from "../../components/user/ReviewsPanel/ReviewsPanel.jsx";

export default function ProfilePage({ theme, setTheme, lang, setLang, t }) {
  const { handle } = useParams();
  const { currentUser } = useAuth();

  // --- LÓGICA CORRIGIDA (CASE INSENSITIVE) ---
  const isOwner =
  currentUser &&
  handle &&
  currentUser.handle.toLowerCase() === handle.toLowerCase();

  // Define qual perfil carregar. Removi o fallback fixo para "maris"
  // para seguir sua regra de não usar dados mocados se o backend existe.
  const dataHandle = handle || currentUser?.handle;

  // Destruturando loading e error do hook atualizado
  const { userData, loading, error, dynamicTags, clubs } =
  useUserProfileData(dataHandle);

  const leftRef = useRef(null);
  const [containerH, setContainerH] = useState(0);

  useEffect(() => {
    const measure = () => {
      const rect = leftRef.current?.getBoundingClientRect();
      if (rect) setContainerH(rect.height);
    };
      measure();
      const ro = new ResizeObserver(measure);
      if (leftRef.current) ro.observe(leftRef.current);
      window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [loading]); // Re-mede quando os dados terminam de carregar

  // --- ESTADO DE CARREGAMENTO ---
  if (loading) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <HeaderBar theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />
      <main className="max-w-7xl mx-auto px-4 pt-40 pb-16 flex justify-center items-center">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </main>
      </div>
      </div>
    );
  }

  // --- ESTADO DE ERRO ---
  if (error || !userData) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <HeaderBar theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />
      <main className="max-w-7xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-neutral-400" />
      <h2 className="text-xl font-bold">{error || t("error.user_not_found", "Usuário não encontrado")}</h2>
      </main>
      </div>
      </div>
    );
  }

  const { profile, badges, favorites, reviews } = userData;

  return (
    <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
    <HeaderBar
    theme={theme}
    setTheme={setTheme}
    lang={lang}
    setLang={setLang}
    t={t}
    />

    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
    <ProfileHeader profile={profile} tags={dynamicTags} t={t} />
    <div className="h-8" />

    <BadgesRibbon
    badges={badges}
    t={t}
    handle={dataHandle}
    isOwner={isOwner}
    />

    <div className="h-8" />

    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-0">
    <div ref={leftRef} className="lg:col-span-7 min-h-0">
    <FavoritesSection items={favorites} t={t} handle={dataHandle} />
    </div>
    <div className="lg:col-span-5 min-h-0">
    <ReviewsPanel
    reviews={reviews}
    t={t}
    containerHeight={containerH}
    handle={dataHandle}
    />
    </div>
    </section>
    </main>
    </div>
    </div>
  );
}
