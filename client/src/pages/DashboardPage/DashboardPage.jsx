import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";

import { cx } from "../../utils/formatters";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ProfileHeader from "../../components/user/ProfileHeader/ProfileHeader.jsx";
import FavoritesSection from "../../components/user/FavoritesSection/FavoritesSection.jsx";
import BadgesRibbon from "../../components/user/BadgesRibbon/BadgesRibbon.jsx";
import ReviewsPanel from "../../components/user/ReviewsPanel/ReviewsPanel.jsx";
import ActivityCalendar from "../../components/dashboard/ActivityCalendar/ActivityCalendar.jsx";
import CollectionList from "../../components/dashboard/CollectionList/CollectionList.jsx";

export default function DashboardPage({ theme, setTheme, lang, setLang, t }) {
  // 1. Estados de Autenticação
  const { currentUser, loading: authLoading } = useAuth();

  // 2. Busca de dados reais do Perfil
  // Só dispara a busca se o authLoading terminou e temos um usuário
  const { userData, dynamicTags, loading: dataLoading, error } =
  useUserProfileData(currentUser?.handle);

  const rightColumnRef = useRef(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState(0);

  // Observer para layout
  useEffect(() => {
    const measure = () => {
      if (rightColumnRef.current) {
        setLeftColumnHeight(rightColumnRef.current.offsetHeight);
      }
    };
    const timer = setTimeout(measure, 100);
    const ro = new ResizeObserver(measure);
    if (rightColumnRef.current) ro.observe(rightColumnRef.current);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      if (rightColumnRef.current) ro.unobserve(rightColumnRef.current);
    };
  }, [dataLoading]); // Remedição após carregar os dados

  // 3. PROTEÇÃO CONTRA FLICKER: Enquanto carrega (Auth ou Dados), mostra tela de loading
  if (authLoading || dataLoading) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
      </div>
    );
  }

  // 4. ESTADO DE ERRO
  if (error || !userData) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <HeaderBar theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />
      <main className="max-w-7xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-neutral-400" />
      <h2 className="text-xl font-bold">{error || "Não foi possível carregar o Dashboard"}</h2>
      </main>
      </div>
      </div>
    );
  }

  // Destruição dos dados reais
  const { profile, badges, favorites, reviews, collections } = userData;

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

    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16 flex flex-col gap-8">
    {/* Header com dados reais do banco */}
    <ProfileHeader profile={profile} tags={dynamicTags} t={t} />

    {/* Seção de Troféus Real */}
    <div className="relative">
    <BadgesRibbon
    badges={badges}
    t={t}
    handle={currentUser?.handle}
    isOwner={true}
    />
    {badges.length === 0 && (
      <p className="text-center text-sm text-neutral-500 italic mt-2">
      Sua jornada começou agora. Faça reviews para ganhar emblemas.
      </p>
    )}
    </div>

    {/* Favoritos Real */}
    <FavoritesSection items={favorites} t={t} handle={currentUser?.handle} />

    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <div className="lg:col-span-7">
    {/* Reviews Real */}
    <ReviewsPanel
    reviews={reviews}
    t={t}
    containerHeight={leftColumnHeight}
    handle={currentUser?.handle}
    />
    {reviews.length === 0 && (
      <div className="p-8 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-center text-neutral-500 mt-4">
      <p>Você ainda não publicou nenhuma review.</p>
      <Link to="/" className="text-amber-500 hover:underline mt-2 inline-block">
      Explore mídias para avaliar
      </Link>
      </div>
    )}
    </div>

    <div
    ref={rightColumnRef}
    className="lg:col-span-5 flex flex-col gap-8"
    >
    <div className="mt-11">
    <ActivityCalendar reviews={reviews} t={t} />
    </div>

    {/* Coleções Reais do Banco */}
    <CollectionList collections={collections || []} t={t} />
    </div>
    </section>
    </main>
    </div>
    </div>
  );
}
