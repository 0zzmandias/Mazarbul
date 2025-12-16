import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, User, Settings, Search as SearchIcon } from "lucide-react";

// MODIFICAÇÃO: Corrigido o nome da importação
import { staticMediaDatabase as mediaDatabase } from "../../../hooks/useUserProfileData";

function HeaderBar({ theme, setTheme, lang, setLang, t }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Lógica da busca instantânea ATUALIZADA
  useEffect(() => {
    if (query.length > 1) {
      const allMedia = Object.values(mediaDatabase);
      const normalizedQuery = query.toLowerCase();

      const results = allMedia.filter((media) => {
        // 1. Verifica os Títulos Principais (PT, EN, ES)
        let titleMatch = false;
        if (media.title && typeof media.title === "object") {
          const titlePT = media.title.PT?.toLowerCase() || "";
          const titleEN = media.title.EN?.toLowerCase() || "";
          const titleES = media.title.ES?.toLowerCase() || "";
          titleMatch =
            titlePT.includes(normalizedQuery) ||
            titleEN.includes(normalizedQuery) ||
            titleES.includes(normalizedQuery);
        } else if (typeof media.title === "string") {
          titleMatch = media.title.toLowerCase().includes(normalizedQuery);
        }

        // 2. Verifica os Títulos Alternativos (aliases)
        let aliasMatch = false;
        if (Array.isArray(media.aliases)) {
          aliasMatch = media.aliases.some((alias) =>
            alias.toLowerCase().includes(normalizedQuery),
          );
        }

        // Retorna true se encontrou em qualquer um dos campos
        return titleMatch || aliasMatch;
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  function handleSearchSubmit(q) {
    if (!q) return;
    setSearchOpen(false);
    setSearchResults([]);
    setQuery("");
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const safeT = (key, fallback) => {
    if (typeof t === "function") {
      const translated = t(key);
      return translated === key && fallback ? fallback : translated;
    }
    return fallback || key;
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-20 bg-transparent">
      <div className="max-w-5xl mx-auto h-full px-4 flex items-center">
        <div ref={searchContainerRef} className="w-full relative">
          <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur shadow-sm">
            {!searchOpen ? (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2">
                <button
                  aria-label={safeT("a11y.open_search", "Abrir busca")}
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center">
                  <Link to="/" className="font-semibold">
                    Mazarbul
                  </Link>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    aria-label={safeT("a11y.toggle_theme", "Alternar tema")}
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                  </button>
                  <div className="relative">
                    <button
                      aria-label={safeT("a11y.toggle_language", "Mudar idioma")}
                      onClick={() => setLangOpen((v) => !v)}
                      className="h-9 px-3 inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm leading-none font-medium"
                    >
                      <span className="leading-none">{lang}</span>
                    </button>
                    {langOpen && (
                      <div className="absolute right-0 mt-1 w-16 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-md overflow-hidden">
                        {["PT", "EN", "ES"]
                          .filter((c) => c !== lang)
                          .map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                setLang(c);
                                setLangOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                            >
                              {c}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/settings"
                    aria-label={safeT("a11y.settings_page", "Configurações")}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/dashboard"
                    aria-label={safeT("a11y.user_profile", "Meu perfil")}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit(query);
                }}
                className="flex items-center gap-2 px-3 py-2"
              >
                <SearchIcon className="w-5 h-5 text-neutral-500" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  className="flex-1 bg-transparent outline-none placeholder:text-neutral-400 text-sm py-2"
                  placeholder={safeT("search.placeholder", "Busca rápida...")}
                />
              </form>
            )}
          </div>

          {/* PAINEL DE RESULTADOS DA BUSCA */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {searchResults.map((media) => (
                  <li key={media.id}>
                    <Link
                      to={`/media/${media.id}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchResults([]);
                        setQuery("");
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                    >
                      <img
                        src={media.posterUrl}
                        alt=""
                        className="w-10 h-14 object-cover rounded-md flex-shrink-0 bg-neutral-200 dark:bg-neutral-700"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate text-neutral-800 dark:text-neutral-100">
                          {media.title[lang.toUpperCase()] || media.title.PT}
                        </p>
                        <p className="text-xs capitalize text-neutral-500 dark:text-neutral-400">
                          {t(`badge.${media.type}`)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default HeaderBar;
