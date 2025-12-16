import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { useUserDatabase } from "../../../contexts/UserDatabaseContext.jsx";
import { cx } from "../../../utils/formatters.js";

export default function ManageClubModal({ isOpen, onClose, clubData, t }) {
  const { updateClub } = useUserDatabase();

  // Estados do Formulário
  const [name, setName] = useState(clubData?.name || "");
  const [description, setDescription] = useState(clubData?.description || "");
  const [rules, setRules] = useState(clubData?.rules || "");
  // REMOVIDO: Estado nextMeeting

  // Estado do Banner
  const [bannerPreview, setBannerPreview] = useState(
    clubData?.bannerUrl || null,
  );

  useEffect(() => {
    if (clubData) {
      setName(clubData.name || "");
      setDescription(clubData.description || "");
      setRules(clubData.rules || "");
      // REMOVIDO: setNextMeeting
      setBannerPreview(clubData.bannerUrl || null);
    }
  }, [clubData]);

  if (!isOpen || !clubData) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      alert("Nome e Descrição são obrigatórios.");
      return;
    }

    const updatedData = {
      name,
      description,
      rules,
      // REMOVIDO: nextMeeting do objeto de update
      bannerUrl: bannerPreview,
      coverGradient: bannerPreview
        ? null
        : clubData.coverGradient || "from-gray-800 via-gray-900 to-black",
    };

    updateClub(clubData.id, updatedData);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {t("club.manage.title") || "Gerir Clube"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto">
          <form
            id="manage-club-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* Nome e Handle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t("club.create.name_label")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 dark:text-neutral-500 mb-1.5">
                  {t("club.create.handle_label")} (Não editável)
                </label>
                <input
                  type="text"
                  value={`@${clubData.id}`}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* REMOVIDO: Campo de Próximo Encontro */}

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("club.create.desc_label")}
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Regras */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("club.create.rules_label")}
              </label>
              <textarea
                rows="5"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-amber-50/50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none text-sm text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Banner */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("club.create.banner_label")}
                </label>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => setBannerPreview(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover imagem
                  </button>
                )}
              </div>

              <div
                className={cx(
                  "w-full h-40 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-500 transition-colors",
                  bannerPreview ? "border-solid" : "",
                )}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={cx(
                      "absolute inset-0 bg-gradient-to-br opacity-50",
                      clubData.coverGradient,
                    )}
                  ></div>
                )}
                {!bannerPreview && (
                  <div className="text-center text-neutral-500 p-4 relative z-10">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">
                      {t("club.create.banner_help")}
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {t("club.create.cancel")}
          </button>
          <button
            type="submit"
            form="manage-club-form"
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all transform active:scale-95"
          >
            {t("club.manage.save") || "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
