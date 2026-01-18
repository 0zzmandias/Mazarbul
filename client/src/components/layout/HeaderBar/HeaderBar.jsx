import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, User, Settings, Search as SearchIcon, Loader2 } from "lucide-react";

import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

function HeaderBar({ theme, setTheme, lang, setLang, t }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { currentUser } = useAuth();

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);

      try {
        const promises = [
          api.get("/media/search", { params: { q: query, type: "filme" } }),
                                       api.get("/media/search", { params: { q: query, type: "jogo" } }),
                                       api.get("/media/search", { params: { q: query, type: "livro" } }),
                                       api.get("/media/search", { params: { q: query, type: "album" } }),
        ];

        const results = await Promise.allSettled(promises);

        let combinedResults = [];

        results.forEach((res) => {
          if (res.status === "fulfilled" && Array.isArray(res.value.data)) {
            combinedResults.push(...res.value.data);
          }
        });

        const normalizedQuery = query.toLowerCase().trim();

        const scoredResults = combinedResults.map((item) => {
          const title = (item.title || "").toLowerCase();
          let score = 0;

          if (title === normalizedQuery) score = 100;
          else if (title.startsWith(normalizedQuery)) score = 50;
          else if (title.includes(normalizedQuery)) score = 10;
          else score = 0;

          return { ...item, score };
        });

        const filteredResults = scoredResults.filter((item) => item.score > 0);

        filteredResults.sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;

          const typePriority = { livro: 3, filme: 2, jogo: 1, album: 1 };
          const pA = typePriority[a.type] || 0;
          const pB = typePriority[b.type] || 0;
          if (pA !== pB) return pB - pA;

          return (a.title || "").localeCompare(b.title || "");
        });

        setSearchResults(filteredResults.slice(0, 20));
      } catch (error) {
        console.error("Erro na busca global:", error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
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
  }

  const safeT = (key, fallback) => {
    if (typeof t === "function") {
      const translated = t(key);
      return translated === key && fallback ? fallback : translated;
    }
    return fallback || key;
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-20 bg-transparent pointer-events-none">
    <div className="max-w-5xl mx-auto h-full px-4 flex items-center pointer-events-auto">
    <div ref={searchContainerRef} className="w-full relative">
    <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur shadow-sm transition-all duration-200">
    {!searchOpen ? (
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2">
      <button
      aria-label={safeT("a11y.open_search", "Abrir busca")}
      onClick={() => setSearchOpen(true)}
      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
      <SearchIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      <div className="flex items-center justify-center">
      <Link
      to="/"
      className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white"
      >
      Mazarbul
      </Link>
      </div>

      <div className="flex items-center justify-end gap-2">
      <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
      {theme === "dark" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
      </button>

      <div className="relative">
      <button
      onClick={() => setLangOpen((v) => !v)}
      className="h-9 px-3 inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
      {lang}
      </button>
      {langOpen && (
        <div className="absolute right-0 mt-2 w-20 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden py-1">
        {["PT", "EN", "ES"]
          .filter((c) => c !== lang)
          .map((c) => (
            <button
            key={c}
            onClick={() => {
              setLang(c);
              setLangOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
            {c}
            </button>
          ))}
          </div>
      )}
      </div>

      <Link
      to="/settings"
      className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
      <Settings className="w-5 h-5" />
      </Link>

      <Link
      to="/dashboard"
      className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 overflow-hidden border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
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
      className="flex items-center gap-3 px-4 py-2"
      >
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
      ) : (
        <SearchIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      )}

      <input
      ref={searchInputRef}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setSearchOpen(false);
      }}
      className="flex-1 bg-transparent outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
      placeholder={safeT(
        "search.placeholder",
        "Busque filmes, jogos, livros..."
      )}
      />
      </form>
    )}
    </div>

    {searchOpen && searchResults.length > 0 && (
      <div className="absolute top-full mt-2 w-full max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl z-50 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
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
        className="flex items-center gap-4 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors group"
        >
        <div className="w-10 h-14 bg-neutral-200 dark:bg-neutral-800 rounded overflow-hidden flex-shrink-0 shadow-sm">
        {media.poster || media.posterUrl ? (
          <img
          src={media.poster || media.posterUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
          ?
          </div>
        )}
        </div>

        <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
        {media.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
        <span className="uppercase tracking-wider font-bold text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
        {safeT(`badge.${media.type}`, media.type)}
        </span>
        {media.year && <span>{media.year}</span>}
        {media.author && (
          <span className="truncate max-w-[150px] opacity-70">
          • {media.author}
          </span>
        )}
        </div>
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
