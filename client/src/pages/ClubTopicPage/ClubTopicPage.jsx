import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Send, Loader2, Lock } from "lucide-react"; // Adicionei Lock
import { cx } from "../../utils/formatters";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import topicService from "../../services/topic.service.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ClubTopicPage({ theme, setTheme, lang, setLang, t }) {
  const { clubId, topicId } = useParams();
  const { currentUser } = useAuth();

  // Estados reais da API
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Carregar dados ao montar
  useEffect(() => {
    fetchTopicData();
  }, [topicId]);

  const fetchTopicData = async () => {
    setIsLoading(true);
    try {
      const data = await topicService.getTopicDetails(topicId);
      setTopic(data);
      setReplies(data.replies || []);
    } catch (error) {
      console.error("Erro ao carregar tópico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    if (!currentUser) {
      alert("Você precisa estar logado para responder.");
      return;
    }

    setIsSending(true);
    try {
      const newReply = await topicService.replyToTopic(topicId, replyText);
      // Adiciona a resposta na lista localmente para feedback instantâneo
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
    } catch (error) {
      console.error("Erro ao responder:", error);
      // CORREÇÃO: Mostra a mensagem exata do backend (ex: "Tópico trancado" ou "Não é membro")
      alert("Não foi possível enviar a resposta: " + (error.response?.data?.error || "Erro desconhecido."));
    } finally {
      setIsSending(false);
    }
  };

  // Renderização de Carregamento
  if (isLoading) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
      </div>
    );
  }

  // Renderização de Erro / Não Encontrado
  if (!topic) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-500">
      {t("topic.content_unavailable")}
      </div>
      </div>
    );
  }

  // Verificação de Bloqueio
  const isLocked = topic.isLocked;

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

    <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
    {/* Breadcrumb */}
    <Link
    to={`/club/${clubId}`}
    className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
    >
    <ChevronLeft size={16} /> {t("topic.back_to")} {topic.club?.name || "Clube"}
    </Link>

    {/* POST PRINCIPAL */}
    <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 shadow-sm">
    <h1 className="text-2xl md:text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
    {topic.title}
    {/* Ícone de Cadeado no Título se trancado */}
    {isLocked && <Lock size={24} className="text-neutral-400" title="Tópico Trancado" />}
    </h1>

    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
    {topic.author?.avatarUrl ? (
      <img src={topic.author.avatarUrl} alt={topic.author.name} className="w-full h-full object-cover" />
    ) : (
      topic.author?.name?.charAt(0).toUpperCase() || "?"
    )}
    </div>
    <div>
    <Link
    to={`/profile/${topic.author?.handle?.replace("@", "")}`}
    className="font-semibold text-sm hover:underline"
    >
    {topic.author?.name || "Usuário"} <span className="text-neutral-500 font-normal">@{topic.author?.handle}</span>
    </Link>
    <p className="text-xs text-neutral-500">
    {t("topic.started_on")} {new Date(topic.createdAt).toLocaleDateString()}
    </p>
    </div>
    {topic.isPinned && (
      <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded">
      {t("topic.pinned")}
      </span>
    )}
    </div>

    <div className="prose dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
    {topic.content || t("topic.content_unavailable")}
    </div>
    </article>

    {/* SEÇÃO DE RESPOSTAS */}
    <section>
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
    <MessageSquare size={20} />
    {replies.length} {t("topic.replies_count")}
    </h3>

    {/* Lista de Respostas */}
    <div className="flex flex-col gap-4 mb-8">
    {replies.map((reply) => (
      <div
      key={reply.id}
      className="flex gap-4 p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-colors"
      >
      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
      {reply.author?.avatarUrl ? (
        <img src={reply.author.avatarUrl} alt={reply.author.name} className="w-full h-full object-cover" />
      ) : (
        reply.author?.name?.charAt(0).toUpperCase() || "?"
      )}
      </div>
      <div className="flex-1">
      <div className="flex items-baseline justify-between mb-1">
      <span className="font-semibold text-sm">
      @{reply.author?.handle || "anônimo"}
      </span>
      <span className="text-xs text-neutral-400">
      {new Date(reply.createdAt).toLocaleString()}
      </span>
      </div>
      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
      {reply.content}
      </p>
      </div>
      </div>
    ))}

    {replies.length === 0 && (
      <p className="text-neutral-500 text-center py-8 italic">
      {t("topic.no_replies")}
      </p>
    )}
    </div>

    {/* Editor de Resposta */}
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sticky bottom-4 shadow-lg">
    <textarea
    value={replyText}
    onChange={(e) => setReplyText(e.target.value)}
    // Placeholder condicional
    placeholder={
      isLocked
      ? "Este tópico está trancado e não aceita novas respostas."
      : (!currentUser ? "Faça login para responder..." : t("topic.reply_placeholder"))
    }
    // Desabilitado se não logado, enviando ou trancado
    disabled={!currentUser || isSending || isLocked}
    className={cx(
      "w-full p-3 rounded-xl border outline-none resize-none text-sm min-h-[80px] transition-colors",
      isLocked
      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
      : "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus:border-indigo-500"
    )}
    />
    <div className="flex justify-end mt-3">
    <button
    className={cx(
      "px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors",
      isLocked
      ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed" // Estilo botão trancado
      : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" // Estilo normal
    )}
    onClick={handleReply}
    disabled={!replyText.trim() || !currentUser || isSending || isLocked}
    title={isLocked ? "Tópico Trancado" : ""}
    >
    {isSending ? <Loader2 className="animate-spin" size={16} /> : (isLocked ? <Lock size={16}/> : <Send size={16} />)}
    {t("topic.reply_button")}
    </button>
    </div>
    </div>
    </section>
    </main>
    </div>
    </div>
  );
}
