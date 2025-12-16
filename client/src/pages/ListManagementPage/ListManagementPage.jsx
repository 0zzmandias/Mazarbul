import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { List, Plus, Edit3, Trash2, Search, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserDatabase } from "../../contexts/UserDatabaseContext.jsx";
import { cx } from "../../utils/formatters";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import MediaCard from "../../components/ui/MediaCard/MediaCard.jsx";

const LOGGED_IN_USER_HANDLE = "alexl";

// --- Hook para "hidratar" os itens da lista ---
function useHydratedItems(collectionItems, allFavorites) {
  return useMemo(() => {
    if (!collectionItems || !allFavorites) return [];
    return collectionItems
      .map((item) => allFavorites.find((fav) => fav.id === item.id))
      .filter(Boolean);
  }, [collectionItems, allFavorites]);
}

// --- Hook para buscar mídias (simulado) ---
function useMediaSearch(query) {
  const { mediaDatabase } = useUserDatabase();
  return useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = query.toLowerCase();
    return Object.values(mediaDatabase)
      .filter((media) => {
        const titlePT = media.title.PT?.toLowerCase() || "";
        const titleEN = media.title.EN?.toLowerCase() || "";
        const titleES = media.title.ES?.toLowerCase() || "";
        return (
          titlePT.includes(normalizedQuery) ||
          titleEN.includes(normalizedQuery) ||
          titleES.includes(normalizedQuery)
        );
      })
      .slice(0, 10);
  }, [query, mediaDatabase]);
}

// ==========================
// COMPONENTE PRINCIPAL
// ==========================
export default function ListManagementPage(props) {
  const { t } = props;
  const { db } = useUserDatabase();
  const { collections, favorites } = db[LOGGED_IN_USER_HANDLE] || {};

  // Leitura da URL para pegar o ID
  const [searchParams] = useSearchParams();
  const initialListId = searchParams.get("id");

  const [mode, setMode] = useState("viewing"); // 'viewing', 'creating', 'editing', 'deleting'
  const [selectedListId, setSelectedListId] = useState(null);

  // Efeito para selecionar a lista quando a página carrega
  useEffect(() => {
    if (initialListId) {
      setSelectedListId(initialListId);
    }
  }, [initialListId]);

  const selectedCollection = useMemo(
    () => collections?.find((c) => c.id === selectedListId),
    [collections, selectedListId],
  );

  const handleSetMode = (newMode) => {
    if (mode === newMode) {
      setMode("viewing");
    } else {
      setMode(newMode);
    }
    if (newMode === "creating") {
      setSelectedListId(null);
    }
  };

  const handleSelectList = (id) => {
    if (mode === "deleting") return;
    if (mode === "creating") {
      setMode("viewing");
    }
    setSelectedListId(id);
  };

  const onListDeleted = () => {
    setSelectedListId(null);
    setMode("viewing");
  };

  const renderMiddleColumn = () => {
    if (mode === "creating") {
      return (
        <ListForm
          t={t}
          isCreating={true}
          onListCreated={(newId) => {
            setMode("viewing");
            setSelectedListId(newId);
          }}
        />
      );
    }

    if (mode === "editing" && selectedCollection) {
      return <ListForm t={t} isCreating={false} list={selectedCollection} />;
    }

    if (selectedCollection) {
      return (
        <ListContentViewer
          key={selectedCollection.id}
          list={selectedCollection}
          allFavorites={favorites}
          t={t}
        />
      );
    }

    let promptKey = "list.select_prompt";
    if (mode === "editing") promptKey = "list.select_to_edit_prompt";
    if (mode === "deleting") promptKey = "list.select_to_delete_prompt";

    return (
      <div className="h-96 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 text-neutral-500 text-center px-4">
        <List className="w-10 h-10" />
        <p className="mt-2 text-lg font-medium">
          {t(promptKey, "Selecione uma lista")}
        </p>
        {mode === "viewing" && (
          <p>{t("list.or_create_prompt", "ou crie uma nova.")}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <HeaderBar {...props} />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Coluna Esquerda (Ações) */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t("list.actions_title", "Ações")}
            </h2>
            <nav className="flex flex-col gap-2">
              <ActionButton
                icon={<Plus />}
                label={t("list.create_new", "Criar Nova Lista")}
                isActive={mode === "creating"}
                onClick={() => handleSetMode("creating")}
              />
              <ActionButton
                icon={<Edit3 />}
                label={t("list.edit_mode", "Editar Listas")}
                isActive={mode === "editing"}
                onClick={() => handleSetMode("editing")}
              />
              <ActionButton
                icon={<Trash2 />}
                label={t("list.delete_mode", "Apagar Listas")}
                isActive={mode === "deleting"}
                isDestructive={true}
                onClick={() => handleSetMode("deleting")}
              />
            </nav>
          </div>

          {/* Coluna do Meio */}
          <div className="lg:col-span-4">{renderMiddleColumn()}</div>

          {/* Coluna da Direita */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t("section.collections", "Minhas Listas")}
            </h2>
            <div className="flex flex-col gap-2">
              {(collections || []).map((col) => (
                <HotlistButton
                  key={col.id}
                  list={col}
                  isSelected={selectedListId === col.id}
                  mode={mode}
                  onClick={() => handleSelectList(col.id)}
                  onListDeleted={onListDeleted}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Componentes Internos ---

function ActionButton({
  icon,
  label,
  isActive,
  onClick,
  isDestructive = false,
}) {
  const activeClasses = isDestructive
    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100";

  const inactiveClasses = isDestructive
    ? "text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50";

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm font-medium",
        isActive ? activeClasses : inactiveClasses,
      )}
    >
      {React.cloneElement(icon, { className: "w-5 h-5" })}
      <span>{label}</span>
    </button>
  );
}

function HotlistButton({ list, isSelected, mode, onClick, onListDeleted, t }) {
  const { deleteCollection } = useUserDatabase();

  const handleClick = () => {
    if (mode === "deleting") {
      if (
        window.confirm(
          t("list.delete_confirm", "Tem certeza que quer apagar esta lista?"),
        )
      ) {
        deleteCollection("@" + LOGGED_IN_USER_HANDLE, list.id);
        onListDeleted();
      }
    } else {
      onClick();
    }
  };

  const modeClasses =
    mode === "editing"
      ? "ring-2 ring-blue-500/80 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-950"
      : mode === "deleting"
        ? "ring-2 ring-red-500/80 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-950"
        : "";

  return (
    <button
      onClick={handleClick}
      className={cx(
        "w-full text-left p-3 rounded-xl border transition-all",
        "bg-neutral-50/50 dark:bg-neutral-900/50",
        isSelected
          ? "border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-900"
          : "border-neutral-200/80 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700",
        modeClasses,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 line-clamp-1">
          {list.title}
        </span>
        <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
          {list.items.length}{" "}
          {list.items.length === 1
            ? t("list.item_singular", "item")
            : t("list.item_plural", "itens")}
        </span>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
        {list.description}
      </p>
    </button>
  );
}

// Conteúdo da Coluna do Meio (Modo "Viewing")
function ListContentViewer({ list, allFavorites, t }) {
  const navigate = useNavigate();
  const { addMediaToCollection, removeMediaFromCollection } = useUserDatabase();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hydratedItems = useHydratedItems(list.items, allFavorites);
  const searchResults = useMediaSearch(searchQuery);

  const handleAddItem = (mediaId) => {
    addMediaToCollection("@" + LOGGED_IN_USER_HANDLE, list.id, mediaId);
  };

  const handleRemoveItem = (mediaId) => {
    removeMediaFromCollection("@" + LOGGED_IN_USER_HANDLE, list.id, mediaId);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {t("list.current_items_title", "Itens na Lista")}
        </h2>

        {/* Botão + / Barra de Busca */}
        <div className="relative flex-1 flex justify-end">
          <AnimatePresence>
            {isSearchOpen ? (
              <motion.div
                key="search-bar"
                className="relative w-full"
                initial={{ maxWidth: "0px", opacity: 0 }}
                animate={{ maxWidth: "500px", opacity: 1 }}
                exit={{ maxWidth: "0px", opacity: 0 }}
                transition={{ type: "tween", duration: 0.3 }}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    "list.search_placeholder",
                    "Procurar mídias para adicionar...",
                  )}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add-button"
                onClick={() => setIsSearchOpen(true)}
                // CORREÇÃO: Classes padronizadas para o estilo Outline (igual ClubsDiscovery)
                className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title={t("list.add_media", "Adicionar Mídias")}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Área de Resultados da Busca */}
      <AnimatePresence>
        {isSearchOpen && searchQuery.length > 1 && (
          <motion.div
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 overflow-hidden"
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: "300px", opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="overflow-y-auto max-h-[280px] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                  >
                    <img
                      src={item.posterUrl}
                      alt=""
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold line-clamp-1">
                        {item.title.PT || item.title.EN}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.details?.Ano}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-neutral-500 text-center col-span-2 py-4">
                  {t("list.no_results", "Nenhum resultado encontrado.")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grelha de Itens Atuais */}
      {hydratedItems.length > 0 ? (
        <div className="flex flex-wrap gap-6">
          {hydratedItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/media/${item.id}`)}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
          <p className="text-neutral-500 dark:text-neutral-400">
            {t(
              "list.empty_state_editor",
              "Adicione mídias usando a busca acima.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function ListForm({ list, isCreating, onListCreated, t }) {
  const { createCollection, updateCollectionDetails } = useUserDatabase();
  const [title, setTitle] = useState(list?.title || "");
  const [description, setDescription] = useState(list?.description || "");

  useEffect(() => {
    setTitle(list?.title || "");
    setDescription(list?.description || "");
  }, [list]);

  const handleSaveDetails = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("O nome da lista não pode ficar em branco.");
      return;
    }

    if (isCreating) {
      const newId = createCollection(
        "@" + LOGGED_IN_USER_HANDLE,
        title,
        description,
      );
      onListCreated(newId);
    } else {
      updateCollectionDetails(
        "@" + LOGGED_IN_USER_HANDLE,
        list.id,
        title,
        description,
      );
      alert("Alterações salvas!");
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <form onSubmit={handleSaveDetails}>
        <div className="p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-semibold">
            {isCreating
              ? t("list.create_new", "Criar Nova Lista")
              : t("list.edit_title", "Editar Lista")}
          </h2>
          <div>
            <label
              htmlFor="listTitle"
              className="block text-sm font-medium mb-1.5"
            >
              {t("list.form_name", "Nome")}
            </label>
            <input
              type="text"
              id="listTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(
                "list.form_name_placeholder",
                "Ex: Clássicos da Fantasia",
              )}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="listDesc"
              className="block text-sm font-medium mb-1.5"
            >
              {t("list.form_desc", "Descrição")}
            </label>
            <textarea
              id="listDesc"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(
                "list.form_desc_placeholder",
                "Uma breve descrição da sua lista...",
              )}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            ></textarea>
          </div>
        </div>
        <div className="px-6 py-4 sm:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
          >
            <Save className="w-4 h-4" />
            {isCreating
              ? t("list.form_create_button", "Criar Lista")
              : t("list.form_save_button", "Salvar Alterações")}
          </button>
        </div>
      </form>
    </div>
  );
}
