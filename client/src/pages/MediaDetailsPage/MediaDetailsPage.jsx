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

import { translateGenre, getBookGenresTop3 } from "../../constants/genres";

export default function MediaDetailsPage({ theme, setTheme, lang, setLang, t }) {
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
  };

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

  const safeLang = (lang || "PT").split("-")[0].toUpperCase();

  const getLocalizedList = (sourceObj) => {
    if (!sourceObj) return null;
    if (Array.isArray(sourceObj)) return sourceObj;
    return sourceObj[safeLang] || sourceObj["DEFAULT"] || sourceObj["EN"] || sourceObj["PT"] || null;
  };

  const notInformedFallback =
  safeLang === "EN" ? "Not informed" : safeLang === "ES" ? "No informado" : "Não informado";

  const tracklistTitleFallback =
  safeLang === "EN" ? "Tracks" : safeLang === "ES" ? "Pistas" : "Faixas";

  const tracklistNoFallback = "No.";

  const tracklistTitleColFallback =
  safeLang === "EN" ? "Title" : safeLang === "ES" ? "Título" : "Título";

  const tracklistLengthFallback =
  safeLang === "EN" ? "Length" : safeLang === "ES" ? "Duración" : "Duração";

  const tracklistBonusFallback =
  safeLang === "EN" ? "Bonus Tracks" : safeLang === "ES" ? "Pistas extra" : "Faixas bônus";

  const noTracklistFallback =
  safeLang === "EN"
  ? "Track listing unavailable."
  : safeLang === "ES"
  ? "Lista de pistas no disponible."
  : "Lista de faixas indisponível.";

  let titleText = "Título Indisponível";
  if (mediaData.titles) {
    titleText =
    mediaData.titles[safeLang] ||
    mediaData.titles["DEFAULT"] ||
    mediaData.titles["EN"] ||
    mediaData.titles["PT"] ||
    Object.values(mediaData.titles).find(Boolean) ||
    titleText;
  } else if (mediaData.title) {
    titleText = mediaData.title;
  }

  const rawYear =
  mediaData.releaseYear || mediaData.year || mediaData.release_date?.split("-")[0] || null;
  const displayYear = rawYear || "N/A";
  const headerYear =
  mediaData.type === "livro"
  ? rawYear || t("details.not_informed", notInformedFallback)
  : displayYear;

  let synopsisText = t("details.no_synopsis", "Sem sinopse.");
  let isSynopsisAvailableForSelectedLang = true;

  if (mediaData.type === "livro") {
    const candidate = mediaData.synopses ? mediaData.synopses[safeLang] : null;
    if (candidate && String(candidate).trim()) {
      synopsisText = String(candidate).trim();
      isSynopsisAvailableForSelectedLang = true;
    } else {
      synopsisText = null;
      isSynopsisAvailableForSelectedLang = false;
    }
  } else {
    if (mediaData.synopses) {
      synopsisText =
      mediaData.synopses[safeLang] ||
      mediaData.synopses["DEFAULT"] ||
      mediaData.synopses["EN"] ||
      mediaData.synopses["PT"] ||
      synopsisText;
    } else if (mediaData.overview) {
      synopsisText = mediaData.overview;
    }
  }

  const synopsisNotAvailableFallback =
  safeLang === "EN"
  ? "Synopsis not available in this language."
  : safeLang === "ES"
  ? "Sinopsis no disponible en este idioma."
  : "Sinopse não disponível neste idioma.";

  let genresList = [];

  let rawGenresList = getLocalizedList(mediaData.genres);
  if (!rawGenresList && Array.isArray(mediaData.genres)) {
    rawGenresList = mediaData.genres;
  }

  if (mediaData.type === "livro") {
    if (rawGenresList && Array.isArray(rawGenresList)) {
      genresList = getBookGenresTop3(rawGenresList, safeLang, 3);
    } else if (rawGenresList && typeof rawGenresList === "string") {
      genresList = getBookGenresTop3([rawGenresList], safeLang, 3);
    } else {
      genresList = [];
    }
  } else {
    if (rawGenresList && Array.isArray(rawGenresList)) {
      genresList = rawGenresList
      .map((g) => {
        const name = typeof g === "object" && g !== null && g.name ? g.name : g;
        if (mediaData.type === "album") return name;
        return translateGenre(name, safeLang);
      })
      .filter(Boolean);
    }

    if (genresList.length === 0 && mediaData.tags && Array.isArray(mediaData.tags)) {
      genresList = mediaData.tags.map((tag) => {
        const tagName = typeof tag === "object" && tag !== null && tag.name ? tag.name : tag;
        if (mediaData.type === "album") return tagName;
        return translateGenre(tagName, safeLang);
      });
    }
  }

  let countriesList = getLocalizedList(mediaData.countries);
  if (!countriesList && Array.isArray(mediaData.countries)) {
    countriesList = mediaData.countries;
  }

  let translatedCountries = null;
  if (countriesList && Array.isArray(countriesList)) {
    try {
      const regionNames = new Intl.DisplayNames([lang || "pt"], { type: "region" });
      translatedCountries = countriesList.map((code) => {
        try {
          return code.length === 2 ? regionNames.of(code) : code;
        } catch (e) {
          return code;
        }
      });
    } catch (e) {
      translatedCountries = countriesList;
    }
  }

  const genresDisplay = Array.isArray(genresList) ? genresList.join(", ") : genresList;
  const countriesDisplay = Array.isArray(translatedCountries)
  ? translatedCountries.join(", ")
  : translatedCountries;

  const principalCredit =
  mediaData.director ||
  mediaData.credits?.crew?.find((c) => c.job === "Director")?.name ||
  null;

  let directorLabel = "Direção";
  if (mediaData.type === "livro") directorLabel = "Autor";
  if (mediaData.type === "jogo") directorLabel = "Desenvolvedora";
  if (mediaData.type === "album") directorLabel = "Artista";

  let technicalDetails = {
    Ano: displayYear,
    Duração: mediaData.runtime ? `${mediaData.runtime} min` : null,
    Gêneros: genresDisplay,
    [directorLabel]:
    mediaData.director || mediaData.credits?.crew?.find((c) => c.job === "Director")?.name || null,
    País: countriesDisplay,
    ...(mediaData.details || {}),
  };

  if (mediaData.type === "album") {
    let trackCount = null;

    const fromDetails = mediaData.details ? mediaData.details.Faixas : null;
    if (typeof fromDetails === "number" && Number.isFinite(fromDetails)) {
      trackCount = fromDetails;
    } else if (typeof fromDetails === "string") {
      const m = fromDetails.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (Number.isFinite(n)) trackCount = n;
      }
    }

    const tl = mediaData.details ? mediaData.details.Tracklist : null;
    if ((trackCount == null || trackCount === 0) && Array.isArray(tl)) {
      trackCount = tl.length;
    }

    if (trackCount != null) {
      technicalDetails = {
        ...technicalDetails,
        Faixas: trackCount,
      };
    }
  }

  const albumTracksRaw =
  mediaData.type === "album" ? (mediaData.details ? mediaData.details.Tracklist : null) : null;
  const albumBonusRaw =
  mediaData.type === "album" ? (mediaData.details ? mediaData.details.BonusSections : null) : null;

  const normalizeTrackRows = (tracks) => {
    const list = Array.isArray(tracks) ? tracks : [];
    return list
    .map((t, idx) => {
      const no = typeof t?.no === "number" && Number.isFinite(t.no) ? t.no : idx + 1;
      const title = String(t?.title || "").trim();
      const length = String(t?.length || "").trim();
      return { no, title, length };
    })
    .filter((t) => t.title);
  };

  const albumTracks = normalizeTrackRows(albumTracksRaw);
  const albumBonusSections = Array.isArray(albumBonusRaw) ? albumBonusRaw : [];

  const TrackListAligned = ({ rows }) => {
    if (!rows || rows.length === 0) return null;

    return (
      <div className="w-full">
      <div className="grid grid-cols-[3.5rem,1fr,5rem] gap-3 px-2 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-900/40 rounded-md">
      <div className="text-left">{t("tracklist.no", tracklistNoFallback)}</div>
      <div className="text-left">{t("tracklist.title", tracklistTitleColFallback)}</div>
      <div className="text-right">{t("tracklist.length", tracklistLengthFallback)}</div>
      </div>

      <div className="mt-1">
      {rows.map((tr) => (
        <div
        key={`${tr.no}-${tr.title}`}
        className="grid grid-cols-[3.5rem,1fr,5rem] gap-3 px-2 py-2 text-sm border-b border-neutral-200 dark:border-neutral-800"
        >
        <div className="text-neutral-500 dark:text-neutral-400 tabular-nums">{tr.no}.</div>
        <div className="text-neutral-800 dark:text-neutral-200">{tr.title}</div>
        <div className="text-right text-neutral-600 dark:text-neutral-300 tabular-nums">
        {tr.length || ""}
        </div>
        </div>
      ))}
      </div>
      </div>
    );
  };

  if (mediaData.type === "livro") {
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
    <div className="w-40 md:w-1/4 flex-shrink-0 mx-auto md:mx-0 shadow-2xl">
    <img
    src={mediaData.posterUrl || "https://via.placeholder.com/300x450"}
    alt={`Pôster de ${titleText}`}
    className="w-full h-auto rounded-lg border-2 border-white/10 bg-neutral-800"
    />
    </div>

    <div className="flex-1 text-white pt-0 md:pt-4 text-center md:text-left z-10">
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md mb-2">
    {titleText}
    </h1>

    <div className="flex flex-col gap-1 items-center md:items-start text-neutral-300">
    {principalCredit && (
      <div className="text-lg">
      {principalCredit}
      </div>
    )}

    {headerYear && (
      <div className="text-lg">
      {headerYear}
      </div>
    )}

    <div className="mt-1">
    <span className="bg-white/10 px-2 py-0.5 rounded text-sm font-medium backdrop-blur-md uppercase">
    {t(`badge.${mediaData.type}`) || mediaData.type}
    </span>
    </div>
    </div>

    <motion.button
    whileTap={{ scale: 1.2 }}
    onClick={handleFavoriteClick}
    className="mt-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm inline-flex transition-colors border border-white/10"
    aria-label={t(isFavorited ? "a11y.remove_favorite" : "a11y.add_favorite")}
    >
    <Heart
    className={cx(
      "w-6 h-6 transition-colors",
      isFavorited ? "text-red-500 fill-current" : "text-white"
    )}
    />
    </motion.button>
    </div>
    </div>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-7 flex flex-col gap-8">
    <div>
    {mediaData.type === "album" ? (
      <>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
      {t("section.tracklist", tracklistTitleFallback)}
      </h2>

      {albumTracks.length > 0 ? (
        <TrackListAligned rows={albumTracks} />
      ) : (
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {t("details.no_tracklist", noTracklistFallback)}
        </p>
      )}

      {albumBonusSections.length > 0 && (
        <div className="mt-6 flex flex-col gap-6">
        {albumBonusSections.map((section, idx) => {
          const title =
          String(section?.title || "").trim() ||
          t("tracklist.bonus", tracklistBonusFallback);

          const rows = normalizeTrackRows(section?.tracks);
          if (!rows.length) return null;

          return (
            <div key={`${title}-${idx}`}>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
            {title}
            </h3>
            <TrackListAligned rows={rows} />
            </div>
          );
        })}
        </div>
      )}
      </>
    ) : (
      <>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
      {t("section.synopsis")}
      </h2>

      {mediaData.type === "livro" ? (
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
      </>
    )}
    </div>

    <TechnicalDetails details={technicalDetails} type={mediaData.type} t={t} lang={lang} />
    </div>

    <div className="lg:col-span-5">
    <UserReviewEditor communityAverage={mediaData.voteAverage || mediaData.score || 0} t={t} />
    </div>
    </section>

    <CommunityReviewsFeed reviews={mediaData.communityReviews || mediaData.reviews || []} t={t} />
    </main>
    </div>
    </div>
  );
}
