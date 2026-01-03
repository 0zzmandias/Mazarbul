import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, AlertCircle } from "lucide-react";

import { cx } from "../../utils/formatters";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import TechnicalDetails from "../../components/media/TechnicalDetails/TechnicalDetails.jsx";
import UserReviewEditor from "../../components/media/UserReviewEditor/UserReviewEditor.jsx";
import CommunityReviewsFeed from "../../components/media/CommunityReviewsFeed/CommunityReviewsFeed.jsx";

import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// IMPORTAÇÃO CORRETA DO MÓDULO DE TRADUÇÃO
import { translateGenre, getBookGenresTop3 } from "../../constants/genres";

export default function MediaDetailsPage({
  theme,
  setTheme,
  lang,
  setLang,
  t,
}) {
  const { mediaId } = useParams();
  const [mediaData, setMediaData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    async function fetchMedia() {
      if (!mediaId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/media/${mediaId}`);
        setMediaData(response.data);
      } catch (err) {
        console.error("Erro ao carregar mídia:", err);
        setError("Não foi possível carregar os detalhes desta mídia.");
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [mediaId]);

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
    // TODO: Conectar rota de favoritos
  };

  // --- Loading State ---
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

  // --- Error State ---
  if (error || !mediaData) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <HeaderBar theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />
      <main className="max-w-7xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-neutral-400" />
      <h2 className="text-xl font-bold">{error || "Mídia não encontrada"}</h2>
      </main>
      </div>
      </div>
    );
  }

  // === NORMALIZAÇÃO DE DADOS ===

  const safeLang = (lang || 'PT').split('-')[0].toUpperCase();

  const getLocalizedList = (sourceObj) => {
    if (!sourceObj) return null;

    // Para livros (e possivelmente outros tipos), o backend pode enviar array direto
    if (Array.isArray(sourceObj)) return sourceObj;

    // Para tipos que enviam objeto localizado { PT: [...], EN: [...] }
    // Ajuste: inclui DEFAULT como fallback
    return sourceObj[safeLang] || sourceObj['DEFAULT'] || sourceObj['EN'] || sourceObj['PT'] || null;
  };

  const notInformedFallback =
  safeLang === 'EN'
  ? 'Not informed'
  : safeLang === 'ES'
  ? 'No informado'
  : 'Não informado';

  // Título
  let titleText = "Título Indisponível";
  if (mediaData.titles) {
    // Ajuste: respeita DEFAULT e evita pegar null do Object.values()[0]
    titleText =
    mediaData.titles[safeLang] ||
    mediaData.titles['DEFAULT'] ||
    mediaData.titles['EN'] ||
    mediaData.titles['PT'] ||
    Object.values(mediaData.titles).find(Boolean) ||
    titleText;
  } else if (mediaData.title) {
    titleText = mediaData.title;
  }

  // Ano
  const rawYear = mediaData.releaseYear || mediaData.year || mediaData.release_date?.split('-')[0] || null;
  const displayYear = rawYear || "N/A";
  const headerYear = mediaData.type === 'livro' ? (rawYear || t("details.not_informed", notInformedFallback)) : displayYear;

  // Sinopse
  let synopsisText = t("details.no_synopsis", "Sem sinopse.");
  let isSynopsisAvailableForSelectedLang = true;

  if (mediaData.type === 'livro') {
    const candidate = mediaData.synopses ? mediaData.synopses[safeLang] : null;
    if (candidate && String(candidate).trim()) {
      synopsisText = String(candidate).trim();
      isSynopsisAvailableForSelectedLang = true;
    } else {
      synopsisText = null;
      isSynopsisAvailableForSelectedLang = false;
    }
  } else {
    // Mantém o comportamento atual para filmes, jogos e álbuns (não mexer neles)
    if (mediaData.synopses) {
      synopsisText = mediaData.synopses[safeLang] || mediaData.synopses['EN'] || mediaData.synopses['PT'] || synopsisText;
    } else if (mediaData.overview) {
      synopsisText = mediaData.overview;
    }
  }

  const synopsisNotAvailableFallback =
  safeLang === 'EN'
  ? 'Synopsis not available in this language.'
  : safeLang === 'ES'
  ? 'Sinopsis no disponible en este idioma.'
  : 'Sinopse não disponível neste idioma.';

  // === TRADUÇÃO / CLASSIFICAÇÃO DE GÊNEROS ===
  let genresList = [];

  // 1. Tenta pegar a lista localizada (ou array direto)
  let rawGenresList = getLocalizedList(mediaData.genres);

  // Se não veio localizada (objeto) e a propriedade já for um array, pega o array bruto
  if (!rawGenresList && Array.isArray(mediaData.genres)) {
    rawGenresList = mediaData.genres;
  }

  // 2. Processa por tipo
  if (mediaData.type === 'livro') {
    // Para livros, mediaData.genres são categories cruas do Google Books (strings ruidosas).
    // Aplicamos o filtro/classificador e já retornamos no idioma selecionado.
    if (rawGenresList && Array.isArray(rawGenresList)) {
      genresList = getBookGenresTop3(rawGenresList, safeLang, 3);
    } else if (rawGenresList && typeof rawGenresList === 'string') {
      genresList = getBookGenresTop3([rawGenresList], safeLang, 3);
    } else {
      genresList = [];
    }
  } else {
    // Para filmes/jogos/álbuns, mantém o comportamento atual
    if (rawGenresList && Array.isArray(rawGenresList)) {
      genresList = rawGenresList
      .map(g => {
        // Normaliza: g pode ser string ("Action") ou objeto ({name: "Action"})
        const name = (typeof g === 'object' && g !== null && g.name) ? g.name : g;
        // Usa a função importada de constants
        return translateGenre(name, safeLang);
      })
      .filter(Boolean); // Remove itens vazios
    }

    // 3. Fallback para Tags (se Gêneros resultou vazio)
    if (genresList.length === 0 && mediaData.tags && Array.isArray(mediaData.tags)) {
      genresList = mediaData.tags.map(tag => {
        const tagName = (typeof tag === 'object' && tag !== null && tag.name) ? tag.name : tag;
        return translateGenre(tagName, safeLang);
      });
    }
  }

  // Países
  let countriesList = getLocalizedList(mediaData.countries);
  if (!countriesList && Array.isArray(mediaData.countries)) {
    countriesList = mediaData.countries;
  }

  let translatedCountries = null;
  if (countriesList && Array.isArray(countriesList)) {
    try {
      const regionNames = new Intl.DisplayNames([lang || 'pt'], { type: 'region' });
      translatedCountries = countriesList.map(code => {
        try { return code.length === 2 ? regionNames.of(code) : code; } catch (e) { return code; }
      });
    } catch (e) {
      translatedCountries = countriesList;
    }
  }

  const genresDisplay = Array.isArray(genresList) ? genresList.join(', ') : genresList;
  const countriesDisplay = Array.isArray(translatedCountries) ? translatedCountries.join(', ') : translatedCountries;

  // Labels Dinâmicos
  let directorLabel = "Direção";
  if (mediaData.type === 'livro') directorLabel = "Autor";
  if (mediaData.type === 'jogo') directorLabel = "Desenvolvedora";
  if (mediaData.type === 'album') directorLabel = "Artista";

  let technicalDetails = {
    "Ano": displayYear,
    "Duração": mediaData.runtime ? `${mediaData.runtime} min` : null,
    "Gêneros": genresDisplay,
    [directorLabel]: mediaData.director || mediaData.credits?.crew?.find(c => c.job === 'Director')?.name || null,
    "País": countriesDisplay,
    ...(mediaData.details || {})
  };

  // Para livros, seguimos o contrato canônico e as categorias que você definiu:
  // Autor, Gênero, Ano (obra), País (best effort). Sem duration/páginas/editora.
  if (mediaData.type === 'livro') {
    technicalDetails = {
      ...(mediaData.details || {}),
      author: (mediaData.director || null) || t("details.not_informed", notInformedFallback),
      genres: (genresDisplay || null) || t("details.not_informed", notInformedFallback),
      year: (rawYear || null) || t("details.not_informed", notInformedFallback),
      country: (countriesDisplay || null) || t("details.not_informed", notInformedFallback),
    };
  }

  return (
    <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
    <HeaderBar theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />

    <main className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex flex-col gap-8">
    <section className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
    {/* Backdrop */}
    <div className="absolute inset-0">
    {mediaData.backdropUrl ? (
      <img
      src={mediaData.backdropUrl}
      alt=""
      className="w-full h-full object-cover object-center filter blur-lg scale-110 opacity-60"
      />
    ) : (
      <div className="w-full h-full bg-neutral-800" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
    </div>

    <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-end md:items-start">
    {/* Poster */}
    <div className="w-40 md:w-1/4 flex-shrink-0 mx-auto md:mx-0 shadow-2xl">
    <img
    src={mediaData.posterUrl || "https://via.placeholder.com/300x450"}
    alt={`Pôster de ${titleText}`}
    className="w-full h-auto rounded-lg border-2 border-white/10 bg-neutral-800"
    />
    </div>

    {/* Título e Ações */}
    <div className="flex-1 text-white pt-0 md:pt-4 text-center md:text-left z-10">
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md mb-2">
    {titleText}
    </h1>

    <div className="text-lg text-neutral-300 flex flex-wrap justify-center md:justify-start gap-3 items-center">
    <span className="bg-white/10 px-2 py-0.5 rounded text-sm font-medium backdrop-blur-md uppercase">
    {t(`badge.${mediaData.type}`) || mediaData.type}
    </span>
    {headerYear && (<span>{headerYear}</span>)}
    </div>

    <motion.button
    whileTap={{ scale: 1.2 }}
    onClick={handleFavoriteClick}
    className="mt-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm inline-flex transition-colors border border-white/10"
    aria-label={t(isFavorited ? "a11y.remove_favorite" : "a11y.add_favorite")}
    >
    <Heart className={cx("w-6 h-6 transition-colors", isFavorited ? "text-red-500 fill-current" : "text-white")} />
    </motion.button>
    </div>
    </div>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-7 flex flex-col gap-8">
    <div>
    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
    {t("section.synopsis")}
    </h2>

    {mediaData.type === 'livro' ? (
      <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
      {isSynopsisAvailableForSelectedLang
        ? synopsisText
        : t("details.synopsis_not_available", synopsisNotAvailableFallback)}
        </p>
    ) : (
      <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
      {synopsisText}
      </p>
    )}
    </div>

    <TechnicalDetails
    details={technicalDetails}
    type={mediaData.type}
    t={t}
    lang={lang}
    />
    </div>

    <div className="lg:col-span-5">
    <UserReviewEditor
    communityAverage={mediaData.voteAverage || mediaData.score || 0}
    t={t}
    />
    </div>
    </section>

    <CommunityReviewsFeed
    reviews={mediaData.communityReviews || mediaData.reviews || []}
    t={t}
    />
    </main>
    </div>
    </div>
  );
}
