import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react"; // Importando Loader e Plus

import { cx } from "../../utils/formatters";
import { useAuth } from "../../contexts/AuthContext.jsx";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ProfileHeader from "../../components/user/ProfileHeader/ProfileHeader.jsx";
import FavoritesSection from "../../components/user/FavoritesSection/FavoritesSection.jsx";
import BadgesRibbon from "../../components/user/BadgesRibbon/BadgesRibbon.jsx";
import ReviewsPanel from "../../components/user/ReviewsPanel/ReviewsPanel.jsx";
import ActivityCalendar from "../../components/dashboard/ActivityCalendar/ActivityCalendar.jsx";
import CollectionList from "../../components/dashboard/CollectionList/CollectionList.jsx";

export default function DashboardPage({ theme, setTheme, lang, setLang, t }) {
  // 1. Pegamos o loading para evitar o "piscar" do Alex
  const { currentUser, loading } = useAuth();

  const rightColumnRef = useRef(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState(0);

  // Observer para layout (mantido igual)
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
  }, []);

  // 2. PROTEÇÃO CONTRA FLICKER: Enquanto carrega, mostra tela de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // 3. CONSTRUÇÃO DO PERFIL REAL (Sem dados do Alex)
  // Se o usuário não tiver dados no banco, usamos defaults "Vazios"
  const realProfile = {
    name: currentUser?.name || "Usuário",
    handle: currentUser?.handle ? `@${currentUser.handle}` : "@usuario",
    avatar: currentUser?.avatarUrl || null, // Se for null, o componente usa placeholder
    // Bio padrão para usuário novo
    bio: currentUser?.bio || "Olá! Eu sou novo no Mazarbul. Ainda estou configurando meu perfil e explorando novos mundos.",
    location: "Terra Média",
    website: ""
  };

  // 4. DADOS VAZIOS (Por enquanto, pois a conta é nova)
  // Isso garante que você não veja os favoritos/reviews do Alex
  const emptyBadges = [];
  const emptyFavorites = [];
  const emptyReviews = [];
  const emptyCollections = [];

  // Tags padrão apenas para não ficar feio visualmente, ou array vazio se preferir
  const defaultTags = ["Novato", "Explorador"];

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
    {/* Header com seus dados reais */}
    <ProfileHeader profile={realProfile} tags={defaultTags} t={t} />

    {/* Seção de Troféus (Vazia por enquanto) */}
    <div className="relative">
    <BadgesRibbon
    badges={emptyBadges}
    t={t}
    handle={currentUser?.handle}
    isOwner={true}
    />
    {/* Mensagem amigável de estado vazio */}
    {emptyBadges.length === 0 && (
      <p className="text-center text-sm text-neutral-500 italic mt-2">
      Sua jornada começou agora. Faça reviews para ganhar emblemas.
      </p>
    )}
    </div>

    {/* Favoritos (Vazio) */}
    <FavoritesSection items={emptyFavorites} t={t} handle={realProfile.handle} />

    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <div className="lg:col-span-7">
    {/* Reviews (Vazio) */}
    <ReviewsPanel
    reviews={emptyReviews}
    t={t}
    containerHeight={leftColumnHeight}
    handle={realProfile.handle}
    />
    {emptyReviews.length === 0 && (
      <div className="p-8 border border-dashed border-neutral-800 rounded-xl text-center text-neutral-500">
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
    <ActivityCalendar reviews={emptyReviews} t={t} />
    </div>

    <CollectionList collections={emptyCollections} t={t} />
    </div>
    </section>
    </main>
    </div>
    </div>
  );
}
