import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image as ImageIcon } from "lucide-react";
import { useUserDatabase } from "../../../contexts/UserDatabaseContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function CreateClubModal({ isOpen, onClose, t }) {
  const navigate = useNavigate();
  const { createClub } = useUserDatabase();
  const { currentUser } = useAuth();

  // Estados do Formulário
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");

  // Estado do Banner
  const [bannerFile, setBannerFile] = useState(null); // Armazena o arquivo
  const [bannerPreview, setBannerPreview] = useState(null); // Armazena a URL de preview

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      // Cria URL temporária para preview
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !handle.trim() || !description.trim()) {
      alert("Nome, Identificador e Descrição são obrigatórios.");
      return;
    }

    const newClubData = {
      name,
      id: handle.replace("@", ""),
      description,
      rules,
      tags: [], // Tags virão das mídias no futuro
      // Gradiente padrão se não houver imagem (ou como base)
      coverGradient: "from-gray-800 via-gray-900 to-black",
      // No mundo real, faríamos upload do bannerFile aqui.
      // Como é mock, salvamos o preview se existir.
      bannerUrl: bannerPreview,
      nextMeeting: "A definir",
    };

    const newClubId = createClub(currentUser?.handle || "anonimo", newClubData);

    // Limpeza
    setName("");
    setHandle("");
    setDescription("");
    setRules("");
    setBannerFile(null);
    setBannerPreview(null);

    onClose();
    navigate(`/club/${newClubId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {t("club.create.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo (Scrollável) */}
        <div className="p-6 overflow-y-auto">
          <form
            id="create-club-form"
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
                  placeholder={t("club.create.name_placeholder")}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t("club.create.handle_label")}
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder={t("club.create.handle_placeholder")}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("club.create.desc_label")}
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("club.create.desc_placeholder")}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
            </div>

            {/* Regras (Primeiro) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("club.create.rules_label")}
              </label>
              <textarea
                rows="4"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder={t("club.create.rules_placeholder")}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-amber-50/50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
            </div>

            {/* Upload de Banner (Depois) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("club.create.banner_label")}
              </label>

              <div className="w-full h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-500 transition-colors">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-neutral-500 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">
                      {t("club.create.banner_help")}
                    </span>
                  </div>
                )}

                {/* Input File: SEM VALUE controlado */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
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
            form="create-club-form"
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all transform active:scale-95"
          >
            {t("club.create.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
