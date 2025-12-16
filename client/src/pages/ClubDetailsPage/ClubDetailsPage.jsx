import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  BookOpen,
  Film,
  Gamepad2,
  Disc,
  Info,
  ChevronLeft,
  Clock,
  LogOut,
  MessageSquare,
  Pin,
  Lock,
  Search,
  Plus,
  ChevronRight,
  Settings,
  Trash2,
} from "lucide-react";
import { cx } from "../../utils/formatters";
import { useUserProfileData } from "../../hooks/useUserProfileData.js";
import { useUserDatabase } from "../../contexts/UserDatabaseContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import ManageClubModal from "../../components/club/ManageClubModal/ManageClubModal.jsx";

const TypeIcon = {
  livro: BookOpen,
  filme: Film,
  jogo: Gamepad2,
  album: Disc,
};

// ==========================
// COMPONENTE UNIFICADO DE CARD DE OBRA
// ==========================
const ClubWorkCard = ({ work, variant = "active", t }) => {
  if (!work) return null; // Proteção contra crash

  const WorkIcon = TypeIcon[work.type] || BookOpen;
  const author = work.author || "Artista Desconhecido";

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group cursor-pointer relative">
      <div className="w-20 h-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center shrink-0 text-neutral-400 shadow-sm group-hover:text-indigo-500 transition-colors">
        <WorkIcon size={32} />
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        {variant === "history" && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              {t ? t("club.card.cycle_prev") : "Ciclo Anterior"}
            </span>
            <span className="text-xs text-neutral-400">
              {t ? t("club.card.ended_at") : "Encerrado em"} 10 Out
            </span>
          </div>
        )}

        <h4 className="font-bold text-xl text-neutral-900 dark:text-neutral-100 leading-tight mb-0.5 truncate">
          {work.title}
        </h4>
        <p className="text-sm text-neutral-500 mb-2 truncate">{author}</p>

        <div className="mb-auto">
          <span className="text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded uppercase tracking-wide border border-neutral-200 dark:border-neutral-700">
            {t ? t(`badge.${work.type}`) : work.type}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4 text-xs">
          {variant === "overview" && (
            <Link
              to={`/media/${work.id}`}
              className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              {t ? t("club.card.view_details") : "Ver ficha técnica"}
            </Link>
          )}
          {variant === "discussions" && (
            <>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <MessageSquare size={14} />
                <span>
                  3 {t ? t("club.card.topics_open") : "tópicos abertos"}
                </span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Users size={14} />
                <span>
                  42 {t ? t("club.card.participating") : "participando"}
                </span>
              </div>
            </>
          )}
          {variant === "history" && (
            <>
              <button className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline">
                <MessageSquare size={14} />
                {t ? t("club.card.view_archived") : "Ver tópicos arquivados"}
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Users size={14} />
                <span>
                  85 {t ? t("club.card.participating") : "participaram"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="self-center hidden sm:block text-neutral-300 dark:text-neutral-700 group-hover:translate-x-1 transition-transform">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

// Componente Auxiliar: Linha de Tópico
const DiscussionRow = ({ topic, isExtra, t, clubId }) => (
  <Link
    to={topic.id ? `/club/${clubId}/topic/${topic.id}` : "#"}
    className="flex items-start gap-4 p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group last:border-0"
  >
    <div className="pt-1">
      {topic.isPinned ? (
        <Pin size={18} className="text-indigo-500 fill-current" />
      ) : topic.isLocked ? (
        <Lock size={18} className="text-neutral-400" />
      ) : (
        <MessageSquare
          size={18}
          className="text-neutral-400 group-hover:text-indigo-500 transition-colors"
        />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
        {topic.title}
      </h4>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>
          {t ? t("club.card.by") : "por"}{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            @{topic.author}
          </span>
        </span>
        <span>•</span>
        <span>
          {Array.isArray(topic.replies)
            ? topic.replies.length
            : topic.replies || 0}{" "}
          {t ? t("club.card.responses") : "respostas"}
        </span>
      </div>
    </div>
    <div className="text-xs text-neutral-400 whitespace-nowrap">
      {isExtra ? "há 5 min" : "há 2h"}
    </div>
  </Link>
);

// Componente Auxiliar: Card de Membro
const MemberCard = ({ name, handle, role, avatar, t }) => (
  <Link
    to={`/profile/${handle?.replace("@", "") || ""}`}
    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
  >
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-200">
      {avatar}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {name}
      </span>
      <span className="text-xs text-neutral-500">{handle}</span>
    </div>
    {role === "owner" && (
      <span className="ml-auto px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-full">
        {t ? t("club.role.owner") : "Fundador"}
      </span>
    )}
    {role === "mod" && (
      <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-full">
        {t ? t("club.role.mod") : "Mod"}
      </span>
    )}
  </Link>
);

export default function ClubDetailsPage({ theme, setTheme, lang, setLang, t }) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { clubs } = useUserProfileData();
  const { deleteClub } = useUserDatabase();
  const { currentUser } = useAuth();

  const club = clubs?.find((c) => c.id === clubId);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);
  const memberSearchInputRef = useRef(null);

  // --- PROTEÇÃO CONTRA CRASH ---
  const userMembership = useMemo(() => {
    if (!club || !currentUser || !club.members) return null; // Verifica club.members
    return club.members.find(
      (m) => m.handle.replace("@", "") === currentUser.handle,
    );
  }, [club, currentUser]);

  const isMember = !!userMembership;
  const isOwner = userMembership?.role === "owner";
  const isMod = userMembership?.role === "mod";
  const canManage = isOwner || isMod;

  useEffect(() => {
    if (isMemberSearchOpen && memberSearchInputRef.current) {
      memberSearchInputRef.current.focus();
    }
  }, [isMemberSearchOpen]);

  // --- PROTEÇÃO CONTRA CRASH ---
  const filteredMembers = useMemo(() => {
    if (!club?.members) return [];
    if (!memberSearch) return club.members;
    const q = memberSearch.toLowerCase();
    return club.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.handle.toLowerCase().includes(q),
    );
  }, [club, memberSearch]);

  if (!club) {
    return (
      <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-500">
          Clube não encontrado.
        </div>
      </div>
    );
  }

  const handleJoinLeave = () => {
    alert("Lógica de entrar/sair será implementada no backend.");
  };

  const handleDeleteClub = () => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este clube? Esta ação não pode ser desfeita.",
      )
    ) {
      deleteClub(club.id);
      navigate("/clubs");
    }
  };

  const renderActionButton = () => {
    if (isOwner) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={t("club.action.manage")}
          >
            <Settings size={18} strokeWidth={2} />
          </button>
          <button
            onClick={handleDeleteClub}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-red-200 dark:border-red-900/30 bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Deletar Clube"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      );
    }
    if (isMember) {
      return (
        <button
          onClick={handleJoinLeave}
          className="h-9 px-4 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <LogOut size={16} /> {t("club.action.leave")}
        </button>
      );
    }
    return (
      <button
        onClick={handleJoinLeave}
        className="h-9 px-6 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
      >
        {t("club.action.join")}
      </button>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: "overview", label: t("club.tab.overview") },
      { id: "discussions", label: t("club.tab.discussions") },
      { id: "members", label: t("club.tab.members") },
      { id: "history", label: t("club.tab.history") },
    ];
    return (
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cx(
              "pb-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300",
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const getTopicsByContext = (contextId) => {
    return club.topics?.filter((t) => t.context === contextId) || [];
  };

  const bannerStyle = club.bannerUrl
    ? {
        backgroundImage: `url(${club.bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};
  const bannerClass = club.bannerUrl
    ? "w-full pt-24 pb-8 relative overflow-hidden"
    : cx("w-full pt-24 pb-8 bg-gradient-to-b", club.coverGradient);

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

        <div className={bannerClass} style={bannerStyle}>
          {club.bannerUrl && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          )}
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <Link
              to="/clubs"
              className="text-white/80 hover:text-white mb-6 flex items-center gap-1 text-sm font-medium w-fit"
            >
              <ChevronLeft size={16} /> {t("clubs.title")}
            </Link>
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white shadow-sm tracking-tight">
                {club.name}
              </h1>
              <div className="flex items-center gap-4 text-white/90 font-medium">
                <span className="opacity-80 font-mono bg-white/10 px-2 py-0.5 rounded">
                  @{club.id}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span className="flex items-center gap-1.5">
                  <Users size={16} /> {club.membersCount}{" "}
                  {t("club.role.member")}s
                </span>
              </div>
              <p className="text-lg text-white/90 max-w-2xl leading-relaxed">
                {club.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {club.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white text-xs font-medium"
                  >
                    {t ? t(tag) : tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4">
          <div className="sticky top-16 z-20 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 pt-4 mb-8 flex items-center justify-between">
            {renderTabs()}
            <div className="pb-2">{renderActionButton()}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
            <div className="lg:col-span-8 flex flex-col gap-8 min-h-0">
              {activeTab === "overview" && (
                <>
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        {t("club.section.active_works")}
                      </h3>
                      {canManage && (
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Adicionar nova obra"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    {/* PROTEÇÃO CONTRA FALTA DE DADOS */}
                    {club.activeWorks && club.activeWorks.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {club.activeWorks.map((work, idx) => (
                          <ClubWorkCard
                            key={idx}
                            work={work}
                            variant="overview"
                            t={t}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed text-center text-neutral-500">
                        {t("club.placeholder.no_activity")}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === "discussions" && (
                <div className="flex flex-col gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {t("club.section.general_topics")}
                      </h3>
                      <button className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                      {getTopicsByContext("general").map((topic) => (
                        <DiscussionRow
                          key={topic.id}
                          topic={topic}
                          t={t}
                          clubId={club.id}
                        />
                      ))}
                      <DiscussionRow
                        topic={{
                          title: "Sugestões para o próximo ciclo",
                          author: "maris",
                          replies: 5,
                          isPinned: false,
                        }}
                        isExtra={true}
                        t={t}
                        clubId={club.id}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="grid grid-cols-1 gap-3">
                      {club.activeWorks?.map((work) => (
                        <ClubWorkCard
                          key={work.id}
                          work={work}
                          variant="discussions"
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-lg">
                      {t("club.tab.members")} ({club.membersCount})
                    </h3>
                    <div
                      className={cx(
                        "flex items-center border rounded-full transition-all duration-300 ease-in-out overflow-hidden bg-transparent",
                        isMemberSearchOpen
                          ? "w-64 pl-3 pr-4 border-neutral-300 dark:border-neutral-700"
                          : "w-9 border-transparent justify-end",
                      )}
                    >
                      <button
                        onClick={() => setIsMemberSearchOpen(true)}
                        className={cx(
                          "w-9 h-9 flex items-center justify-center shrink-0 transition-colors text-neutral-500 hover:text-indigo-500 dark:hover:text-indigo-400",
                          !isMemberSearchOpen &&
                            "rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        )}
                      >
                        <Search size={18} strokeWidth={2} />
                      </button>
                      <input
                        ref={memberSearchInputRef}
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        onBlur={() => setIsMemberSearchOpen(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsMemberSearchOpen(false);
                            setMemberSearch("");
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder={t("search.placeholder")}
                        className={cx(
                          "bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 h-9 transition-all duration-300",
                          isMemberSearchOpen
                            ? "w-full opacity-100 ml-2"
                            : "w-0 opacity-0 ml-0",
                        )}
                      />
                    </div>
                  </div>
                  {filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredMembers.map((member, idx) => (
                        <MemberCard
                          key={idx}
                          name={member.name}
                          handle={member.handle}
                          role={member.role}
                          avatar={member.avatar}
                          t={t}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-neutral-500 py-8 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-700">
                      {t("club.placeholder.no_member")}
                    </p>
                  )}
                </section>
              )}

              {activeTab === "history" && (
                <section className="flex flex-col gap-4">
                  <ClubWorkCard
                    work={{
                      title: "Neuromancer",
                      type: "livro",
                      id: "b_neuromancer_old",
                    }}
                    variant="history"
                    t={t}
                  />
                </section>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-36 h-fit">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
                  <Info size={18} />
                  {t("club.section.rules")}
                </h3>
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                  <div className="text-amber-900/80 dark:text-amber-100/70 text-sm leading-relaxed whitespace-pre-line">
                    {club.rules || "Nenhuma regra definida."}
                  </div>
                </div>
              </div>

              {/* CARD PRÓXIMO ENCONTRO - RECOLOCADO COMO PEDIDO */}
              <div
                className={cx(
                  "p-5 rounded-2xl shadow-lg text-white bg-gradient-to-br",
                  club.coverGradient,
                )}
              >
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
                  {t("club.next_meeting")}
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                    <Calendar size={20} />
                  </div>
                  <span className="text-lg font-bold text-white shadow-sm">
                    {club.nextMeeting}
                  </span>
                </div>
                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-colors backdrop-blur-sm">
                  {t("club.add_to_calendar")}
                </button>
              </div>
              {/* FIM CARD PRÓXIMO ENCONTRO */}
            </div>
          </div>
        </main>

        <ManageClubModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          clubData={club}
          t={t}
        />
      </div>
    </div>
  );
}
