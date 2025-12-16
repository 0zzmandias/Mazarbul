import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// Importando componentes, hooks e utilitários
import { cx } from "../../utils/formatters";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ReviewCard from "../../components/user/ReviewCard/ReviewCard.jsx";

// ==========================
// MOCK DE AUTENTICAÇÃO
const LOGGED_IN_USER_HANDLE = "alexl";
// ==========================

// ==========================
// Componente da Página de Reviews
// ==========================
export default function ReviewsPage({ theme, setTheme, lang, setLang, t }) {
  const { handle } = useParams();
  const navigate = useNavigate();

  // Busca os dados do perfil específico usando o handle da URL
  const { profile, reviews } = useUserProfileData(handle);

  // Determina se o utilizador logado é o dono do perfil
  const isOwner = profile?.handle === `@${LOGGED_IN_USER_HANDLE}`;

  if (!profile || !reviews) {
    return (
      <div className="text-center py-20">
        Utilizador não encontrado ou sem reviews.
      </div>
    );
  }

  // Lógica de Título Dinâmico
  const pageTitle = isOwner ? (
    t("reviews.my_title") // "Minhas resenhas"
  ) : (
    <>
      {t("reviews.title_prefix")} {/* "Resenhas de" */}
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
          {/* Título com a fonte corrigida e lógica condicional */}
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
            {pageTitle}
          </h1>

          {/* Lista de Reviews */}
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                >
                  <ReviewCard review={review} t={t} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <p className="text-neutral-500 dark:text-neutral-400">
                Este utilizador ainda não escreveu reviews.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
