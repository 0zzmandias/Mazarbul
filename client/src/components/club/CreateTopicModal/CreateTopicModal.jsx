import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import topicService from "../../../services/topic.service.js";

export default function CreateTopicModal({ isOpen, onClose, onSuccess, clubId, t }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert("Título e conteúdo são obrigatórios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await topicService.createTopic({
                title,
                content,
                clubId
            });

            // Limpa o form
            setTitle("");
            setContent("");

            // Notifica o componente pai para recarregar a lista
            if (onSuccess) onSuccess();

            onClose();
        } catch (error) {
            console.error("Erro ao criar tópico:", error);
            alert("Erro ao criar tópico. Verifique se você é membro do clube.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        {t("topic.create_new") || "Criar Novo Tópico"}
        </h2>
        <button
        onClick={onClose}
        disabled={isSubmitting}
        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50"
        >
        <X size={20} />
        </button>
        </div>

        {/* Form */}
        <form id="create-topic-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {t("topic.title_label") || "Título do Tópico"}
        </label>
        <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex: O que acharam do final?"
        disabled={isSubmitting}
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 disabled:opacity-50"
        autoFocus
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {t("topic.content_label") || "Conteúdo"}
        </label>
        <textarea
        rows="6"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Digite aqui sua opinião, teoria ou dúvida..."
        disabled={isSubmitting}
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 disabled:opacity-50"
        />
        </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
        <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
        Cancelar
        </button>
        <button
        type="submit"
        form="create-topic-form"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
            >
            {isSubmitting ? (
                <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
                </>
            ) : (
                "Publicar Tópico"
            )}
            </button>
            </div>
            </div>
            </div>
    );
}
