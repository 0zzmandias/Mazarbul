import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// Importando componentes, hooks e utilitários
import { cx } from "../../utils/formatters";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";
import { useUserDatabase } from "../../contexts/UserDatabaseContext.jsx"; // 1. Importar o Contexto
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import MediaCard from "../../components/ui/MediaCard/MediaCard.jsx";

// ==========================
// MOCK DE AUTENTICAÇÃO
const LOGGED_IN_USER_HANDLE = "alexl";
// ==========================

// ==========================
// Componente da Página de Favoritos
// ==========================
export default function FavoritesPage({ theme, setTheme, lang, setLang, t }) {
  const { handle } = useParams();
  const navigate = useNavigate();

  // 2. Usar o Contexto para ler a "memória" e pegar as funções
  const { toggleFavorite } = useUserDatabase();
  // O 'useUserProfileData' agora lê do Contexto, então 'profile' e 'favorites'
  // estarão sempre atualizados com a "memória" da sessão.
  const { profile, favorites } = useUserProfileData(handle);

  const isOwner = profile?.handle === `@${LOGGED_IN_USER_HANDLE}`;

  const handleRemoveFavorite = (mediaIdToRemove) => {
    // 3. Ação de remover agora chama a função do Contexto
    // Precisamos do 'mediaData' completo para a função 'toggleFavorite'
    // Como esta página só lista favoritos, o item já está nos dados
    const itemToRemove = favorites.find((fav) => fav.id === mediaIdToRemove);
    if (itemToRemove) {
      // Passamos o item completo, pois 'toggleFavorite' precisa dele
      toggleFavorite(profile.handle, itemToRemove);
    }
  };

  if (!profile) {
    return <div className="text-center py-20">Utilizador não encontrado.</div>;
  }

  // Lógica de Título Dinâmico
  const pageTitle = isOwner ? (
    t("favorites.my_title") // "Meus favoritos"
  ) : (
    <>
      {t("favorites.title_prefix")} {/* "Favoritos de" */}
      <span>{profile.name}</span> {/* "Marina Silva" */}
    </>
  );

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
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
            {pageTitle}
          </h1>

          {/* 4. A grelha agora lê 'favorites' direto do hook, que vem do Contexto */}
          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {favorites.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/media/${item.id}`)}
                  onRemove={isOwner ? handleRemoveFavorite : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <p className="text-neutral-500 dark:text-neutral-400">
                Este utilizador ainda não adicionou favoritos.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
