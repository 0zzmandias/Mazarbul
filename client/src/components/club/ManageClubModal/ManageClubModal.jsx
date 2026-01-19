import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import clubService from "../../../services/club.service.js"; // Import real para uso futuro

export default function ManageClubModal({ isOpen, onClose, clubData, t }) {
  // Estados do Formulário
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Banner
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Carrega os dados quando o modal abre
  useEffect(() => {
    if (clubData && isOpen) {
      setName(clubData.name || "");
      // CORREÇÃO: Mostra o handle correto (@slug)
      setHandle(clubData.slug ? `@${clubData.slug}` : "");

      // Define o preview inicial com a imagem que já existe no banco
      setBannerPreview(clubData.coverUrl || null);

      // CORREÇÃO: Lógica para separar Descrição das Regras
      const fullDesc = clubData.description || "";
      const rulesMarker = "\n\nRegras:\n";

      if (fullDesc.includes(rulesMarker)) {
        const parts = fullDesc.split(rulesMarker);
        setDescription(parts[0]);
        setRules(parts[1]);
      } else {
        setDescription(fullDesc);
        setRules("");
      }
    }
  }, [clubData, isOpen]);

  if (!isOpen) return null;

  // Lógica de Imagem (Restaurada)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepara a nova imagem se houver troca
      let coverUrl = clubData.coverUrl; // Mantém a antiga por padrão
      if (bannerFile) {
        coverUrl = await convertToBase64(bannerFile);
      }

      // Reconstrói a string única de descrição + regras
      const finalDescription = description + (rules ? `\n\nRegras:\n${rules}` : "");

      const updatedData = {
        name,
        description: finalDescription,
        coverUrl
        // Nota: O handle (slug) geralmente não é editável após a criação para não quebrar links
      };

      console.log("Dados para envio (Simulação):", updatedData);

      // TODO: Aqui virá a chamada real: await clubService.updateClub(clubData.id, updatedData);

      // Simulação de delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert("As alterações foram salvas localmente (Simulação). A integração com o update no banco virá na Sprint C1.");
      onClose();

    } catch (error) {
      console.error("Erro ao atualizar clube:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
    {t ? t("club.manage.title") : "Gerir Clube"}
    </h2>
    <button
    onClick={onClose}
    disabled={isSubmitting}
    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50"
    >
    <X size={20} />
    </button>
    </div>

    {/* Body */}
    <div className="p-6 overflow-y-auto">
    <form id="manage-club-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
    {t ? t("club.create.name_label") : "Nome do Clube"}
    </label>
    <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    disabled={isSubmitting}
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 outline-none text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
    />
    </div>
    <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
    {t ? t("club.create.handle_label") : "Identificador (@)"} <span className="text-xs text-neutral-400 font-normal">(Não editável)</span>
    </label>
    <input
    type="text"
    value={handle}
    disabled
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
    />
    </div>
    </div>

    <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
    {t ? t("club.create.desc_label") : "Descrição Curta"}
    </label>
    <textarea
    rows="3"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    disabled={isSubmitting}
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 outline-none resize-none text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
    />
    </div>

    <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
    {t ? t("club.create.rules_label") : "Regras do Clube"}
    </label>
    <textarea
    rows="4"
    value={rules}
    onChange={(e) => setRules(e.target.value)}
    disabled={isSubmitting}
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-amber-50/50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-1 outline-none resize-none text-sm text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
    />
    </div>

    {/* Banner Preview & Upload (Lógica Restaurada) */}
    <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
    {t ? t("club.create.banner_label") : "Banner do Clube"}
    </label>
    <div className={`w-full h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-500 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
    {bannerPreview ? (
      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
    ) : (
      <div className="text-neutral-500 flex flex-col items-center">
      <ImageIcon size={24} className="mb-2 opacity-50"/>
      <span className="text-xs">Clique para alterar a imagem</span>
      </div>
    )}

    {/* Input File Invisível */}
    <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    disabled={isSubmitting}
    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
    />
    </div>
    </div>

    </form>
    </div>

    {/* Footer */}
    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
    <button
    onClick={onClose}
    disabled={isSubmitting}
    className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
    >
    Cancelar
    </button>
    <button
    type="submit"
    form="manage-club-form"
      disabled={isSubmitting}
      className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
      >
      {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Salvar Alterações"}
      </button>
      </div>
      </div>
      </div>
  );
}
