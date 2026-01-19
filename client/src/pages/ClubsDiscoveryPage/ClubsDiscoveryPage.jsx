import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { cx } from "../../utils/formatters";
// useUserProfileData removido da importação de clubes, pois agora vem da API
// Mas mantemos se você usar para pegar dados do usuário logado em outros lugares
import { useUserProfileData } from "../../hooks/useUserProfileData.js";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ClubCard from "../../components/club/ClubCard/ClubCard.jsx";
import CreateClubModal from "../../components/club/CreateClubModal/CreateClubModal.jsx";
import clubService from "../../services/club.service.js"; // <--- NOVO IMPORT

export default function ClubsDiscoveryPage({
  theme,
  setTheme,
  lang,
  setLang,
  t,
}) {
  // Estado local para armazenar os clubes vindos da API
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  // ESTADO PARA O MODAL
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // BUSCAR CLUBES DO BACKEND AO CARREGAR
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const data = await clubService.getAllClubs();
      // Garantimos que tags exista para não quebrar o filtro (banco ainda não tem tags)
      const adaptedData = data.map(c => ({
        ...c,
        tags: c.tags || []
      }));
      setClubs(adaptedData);
    } catch (error) {
      console.error("Erro ao buscar clubes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];

    return clubs.filter((club) => {
      const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      // Nota: Como o backend ainda não tem campo "category" ou "tags" na tabela Club,
      // os filtros específicos não retornarão nada por enquanto se a array tags estiver vazia.
      if (activeFilter === "reading")
        matchesCategory = club.tags && club.tags.includes("tag.literatura");
      else if (activeFilter === "cinema")
        matchesCategory = club.tags && club.tags.includes("tag.cinema");
      else if (activeFilter === "gaming")
        matchesCategory = club.tags && club.tags.includes("tag.jogos");
      else if (activeFilter === "music")
        matchesCategory = club.tags && club.tags.includes("tag.musica");

      return matchesSearch && matchesCategory;
    });
  }, [clubs, searchQuery, activeFilter]);

  const renderFilters = () => {
    const filters = [
      { id: "all", label: t("clubs.filter_all") },
      { id: "reading", label: t("clubs.filter_reading") },
      { id: "cinema", label: t("clubs.filter_cinema") },
      { id: "gaming", label: t("clubs.filter_gaming") },
      { id: "music", label: t("clubs.filter_music") },
    ];

    return (
      <div className="flex flex-wrap gap-2 items-center">
      {filters.map((f) => (
        <button
        key={f.id}
        onClick={() => setActiveFilter(f.id)}
        className={cx(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap",
          activeFilter === f.id
          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
          : "bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700",
        )}
        >
        {f.label}
        </button>
      ))}
      </div>
    );
  };

  const iconButtonClass =
  "w-10 h-10 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors";

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
            <div className="mb-8 flex flex-col gap-6">
            <div>
            <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            {t("clubs.title")}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl">
            {t("clubs.subtitle")}
            </p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
            <div className="flex items-center gap-2">
            {/* Botão Criar Clube (+) - Agora abre o Modal */}
            <button
            className={iconButtonClass}
            title="Criar novo clube"
            onClick={() => setIsCreateModalOpen(true)}
            >
            <Plus size={20} strokeWidth={2} />
            </button>

            {/* Busca Expansível */}
            <div
            className={cx(
              "flex items-center border rounded-full transition-all duration-300 ease-in-out overflow-hidden bg-transparent",
              isSearchOpen
              ? "w-64 pl-3 pr-4 border-neutral-300 dark:border-neutral-700"
              : "w-10 border-transparent",
            )}
            >
            <button
            onClick={() => setIsSearchOpen(true)}
            className={cx(
              iconButtonClass,
              isSearchOpen
              ? "border-0 w-auto h-auto p-0 hover:bg-transparent cursor-default"
              : "",
            )}
            >
            <Search size={20} strokeWidth={2} />
            </button>

            <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => setIsSearchOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsSearchOpen(false);
                setSearchQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Buscar..."
            className={cx(
              "bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 h-10 transition-all duration-300",
              isSearchOpen
              ? "w-full opacity-100 ml-2"
              : "w-0 opacity-0 ml-0",
            )}
            />
            </div>
            </div>

            <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
            {renderFilters()}
            </div>
            </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} t={t} />
              ))}
              </div>
            )}

            {!isLoading && filteredClubs.length === 0 && (
              <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t("list.no_results")}
              </h3>
              <p className="text-neutral-500 mt-2">
              {clubs.length === 0
                ? "Ainda não existem clubes criados."
                : "Tente buscar por outro termo ou mude o filtro."}
                </p>
                </div>
            )}

            {/* MODAL DE CRIAÇÃO */}
            {/* Adicionamos onSuccess para recarregar a lista após criar */}
            <CreateClubModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              fetchClubs();
              setIsCreateModalOpen(false);
            }}
            t={t}
            />
            </main>
            </div>
            </div>
          );
}
