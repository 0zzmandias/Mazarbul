import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Send } from "lucide-react";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";
import { cx } from "../../utils/formatters";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";

export default function ClubTopicPage({ theme, setTheme, lang, setLang, t }) {
  const { clubId, topicId } = useParams();
  const { clubs } = useUserProfileData();

  const club = clubs?.find((c) => c.id === clubId);
  const topic = club?.topics?.find((t) => t.id === topicId);

  const [replyText, setReplyText] = useState("");

  if (!club || !topic) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-500">
          {t("topic.content_unavailable")}
        </div>
      </div>
    );
  }

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
            <ChevronLeft size={16} /> {t("topic.back_to")} {club.name}
          </Link>

          {/* POST PRINCIPAL */}
          <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              {topic.title}
            </h1>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                {topic.author[0].toUpperCase()}
              </div>
              <div>
                <Link
                  to={`/profile/${topic.author}`}
                  className="font-semibold text-sm hover:underline"
                >
                  @{topic.author}
                </Link>
                <p className="text-xs text-neutral-500">
                  {t("topic.started_on")} {topic.date || "20 Out 2025"}
                </p>
              </div>
              {topic.isPinned && (
                <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded">
                  {t("topic.pinned")}
                </span>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {topic.body || t("topic.content_unavailable")}
            </div>
          </article>

          {/* SEÇÃO DE RESPOSTAS */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              {topic.replies?.length || 0} {t("topic.replies_count")}
            </h3>

            {/* Lista de Respostas */}
            <div className="flex flex-col gap-4 mb-8">
              {topic.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className="flex gap-4 p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {reply.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-sm">
                        @{reply.author}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {reply.date}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {reply.text}
                    </p>
                  </div>
                </div>
              ))}

              {(!topic.replies || topic.replies.length === 0) && (
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
                placeholder={t("topic.reply_placeholder")}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-indigo-500 outline-none resize-none text-sm min-h-[80px]"
              />
              <div className="flex justify-end mt-3">
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                  onClick={() =>
                    alert("Funcionalidade de responder virá na próxima etapa!")
                  }
                >
                  <Send size={16} /> {t("topic.reply_button")}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
