import React, { useMemo, useState, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star as StarIcon, Clock, MessageSquare, Users } from "lucide-react";

import { cx } from "../../utils/formatters";

import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import SectionHeader from "../../components/layout/SectionHeader/SectionHeader.jsx";
import MediaCard from "../../components/ui/MediaCard/MediaCard.jsx";
import ReviewCard from "../../components/user/ReviewCard/ReviewCard.jsx";
import MediaBadge from "../../components/ui/MediaBadge/MediaBadge.jsx";
import AvatarStack from "../../components/ui/AvatarStack/AvatarStack.jsx";

// ==========================
// DADOS SIMULADOS (MOCK DATA)
// ==========================

const highlightsMock = [
  {
    id: "m1",
    type: "filme",
    title: "Duna: Parte Dois",
    year: 2024,
    score: 9.2,
  },
  { id: "g1", type: "jogo", title: "Baldur's Gate 3", year: 2023, score: 9.7 },
  { id: "b1", type: "livro", title: "O Nome do Vento", year: 2007, score: 9.3 },
  {
    id: "a1",
    type: "album",
    title: "To Pimp a Butterfly",
    year: 2015,
    score: 9.6,
  },
  { id: "m5", type: "filme", title: "Oppenheimer", year: 2023, score: 9.0 },
  { id: "g2", type: "jogo", title: "Elden Ring", year: 2022, score: 9.5 },
  { id: "b3", type: "livro", title: "1984", year: 1949, score: 9.2 },
  { id: "a3", type: "album", title: "Abbey Road", year: 1969, score: 9.4 },
];

const communityReviewsMock = [
  {
    id: "cr1",
    type: "filme",
    date: "2 min atrás",
    score: 9.5,
    title: "Oppenheimer",
    tags: ["tag.biografia", "tag.drama"],
    text: "A tensão construída apenas com diálogos é algo que só Nolan consegue fazer. Cillian Murphy entrega a atuação da vida.",
    user: { name: "Marina", handle: "@maris", avatar: "M" },
  },
  {
    id: "cr2",
    type: "livro",
    date: "15 min atrás",
    score: 8.0,
    title: "Torto Arado",
    tags: ["tag.drama", "tag.historia"],
    text: "Uma narrativa potente sobre ancestralidade e terra. O realismo mágico é sutil, mas golpeia com força.",
    user: { name: "Lucas", handle: "@lucas_l", avatar: "L" },
  },
  {
    id: "cr3",
    type: "jogo",
    date: "1 hora atrás",
    score: 10,
    title: "Elden Ring",
    tags: ["tag.rpg", "tag.fantasia"],
    text: "O mundo aberto definitivo. A sensação de descoberta é genuína, sem marcadores segurando sua mão a cada passo.",
    user: { name: "Dante", handle: "@dante_g", avatar: "D" },
  },
  {
    id: "cr4",
    type: "album",
    date: "3 horas atrás",
    score: 9.0,
    title: "Renaissance",
    tags: ["tag.pop", "tag.dance"],
    text: "Beyoncé celebra a cultura ballroom com uma produção impecável. As transições entre as faixas são arte pura.",
    user: { name: "Gui", handle: "@gui_music", avatar: "G" },
  },
];

// 3. Atividade dos Amigos (LISTA EXPANDIDA PARA TESTE DE SCROLL)
const friendsFeed = [
  {
    id: "f1",
    who: "Marina",
    handle: "@maris",
    type: "filme",
    item: "Oppenheimer",
    score: 9.0,
    when: "há 2 h",
    note: "Roteiro e montagem impecáveis. O som cria uma tensão contínua.",
  },
  {
    id: "f2",
    who: "Diego",
    handle: "@dgs",
    type: "album",
    item: "Random Access Memories",
    score: 9.0,
    when: "ontem",
    note: "Produção cristalina com arranjos que respiram.",
  },
  {
    id: "f3",
    who: "Lívia",
    handle: "@livz",
    type: "jogo",
    item: "Hades",
    score: 9.2,
    when: "há 3 dias",
    note: "Loop perfeito: a narrativa cresce a cada run sem cansar.",
  },
  {
    id: "f4",
    who: "Caio",
    handle: "@caiod",
    type: "livro",
    item: "Ensaio Sobre a Cegueira",
    score: 9.4,
    when: "há 1 semana",
    note: "Assustador de tão atual.",
  },
  {
    id: "f5",
    who: "Júlia",
    handle: "@ju",
    type: "filme",
    item: "Duna: Parte Dois",
    score: 9.1,
    when: "há 1 h",
    note: "Visual imersivo e trilha absurda.",
  },
  {
    id: "f6",
    who: "Rafa",
    handle: "@raf",
    type: "jogo",
    item: "Elden Ring",
    score: 9.7,
    when: "há 4 h",
    note: "Mundo vivo e desafiador.",
  },
  {
    id: "f7",
    who: "Nina",
    handle: "@nina",
    type: "album",
    item: "Anima",
    score: 8.6,
    when: "hoje",
    note: "Climas eletrônicos hipnóticos.",
  },
  {
    id: "f8",
    who: "Tom",
    handle: "@tom",
    type: "filme",
    item: "La La Land",
    score: 8.2,
    when: "há 9 h",
    note: "Encantador e melancólico.",
  },
  {
    id: "f9",
    who: "Bia",
    handle: "@bia",
    type: "livro",
    item: "1984",
    score: 9.5,
    when: "há 2 dias",
    note: "Releitura necessária. Cada vez mais atual.",
  },
  {
    id: "f10",
    who: "Pedro",
    handle: "@pedro",
    type: "jogo",
    item: "God of War",
    score: 9.8,
    when: "há 5 h",
    note: "Narrativa paternal incrível e combate visceral.",
  },
  {
    id: "f11",
    who: "Sofia",
    handle: "@sof",
    type: "filme",
    item: "Interestelar",
    score: 10,
    when: "ontem",
    note: "Chorei tudo de novo. A trilha do Hans Zimmer é outro nível.",
  },
  {
    id: "f12",
    who: "Iuri",
    handle: "@iuri",
    type: "album",
    item: "Dark Side of the Moon",
    score: 9.9,
    when: "há 3 dias",
    note: "O álbum perfeito para ouvir no escuro.",
  },
  {
    id: "f13",
    who: "Ana",
    handle: "@ana",
    type: "livro",
    item: "Dom Casmurro",
    score: 9.0,
    when: "há 1 semana",
    note: "Machado é gênio. A dúvida permanece.",
  },
  {
    id: "f14",
    who: "Leo",
    handle: "@leo",
    type: "jogo",
    item: "Cyberpunk 2077",
    score: 8.5,
    when: "hoje",
    note: "Night City é linda, mas ainda tem seus bugs.",
  },
  {
    id: "f15",
    who: "Carla",
    handle: "@carla",
    type: "filme",
    item: "Barbie",
    score: 8.0,
    when: "há 6 h",
    note: "Divertido e com uma crítica social bem colocada.",
  },
  {
    id: "f16",
    who: "Bruno",
    handle: "@bruno",
    type: "album",
    item: "Folklore",
    score: 9.2,
    when: "ontem",
    note: "Taylor Swift contando histórias como ninguém.",
  },
  {
    id: "f17",
    who: "Gabi",
    handle: "@gabi",
    type: "livro",
    item: "Harry Potter 1",
    score: 8.5,
    when: "há 2 dias",
    note: "Nostalgia pura relendo isso.",
  },
  {
    id: "f18",
    who: "Vitor",
    handle: "@vitor",
    type: "jogo",
    item: "Hollow Knight",
    score: 9.6,
    when: "há 4 dias",
    note: "Atmosfera e design de som impecáveis.",
  },
];

const clubs = [
  {
    id: "c1",
    name: "Clube Sci‑Fi",
    about: "Clássicos da ficção.",
    members: ["Ana", "Leo"],
    next: "27/10",
  },
  {
    id: "c2",
    name: "Latino‑América",
    about: "Romances do continente.",
    members: ["Helena", "Gus"],
    next: "02/11",
  },
  {
    id: "c3",
    name: "Indie Games",
    about: "Jogos independentes.",
    members: ["Nico", "Tom"],
    next: "10/11",
  },
];

export default function HomePage({ theme, setTheme, lang, setLang, t }) {
  const [filterHigh, setFilterHigh] = useState("todos");
  const [filterRecent, setFilterRecent] = useState("todos");

  const startRef = useRef(null);
  const endRef = useRef(null);
  const [spanHeight, setSpanHeight] = useState(null);

  const highlights = useMemo(() => {
    return highlightsMock
      .filter((i) => (filterHigh === "todos" ? true : i.type === filterHigh))
      .slice(0, 8);
  }, [filterHigh]);

  const communityReviews = useMemo(() => {
    return communityReviewsMock.filter((i) =>
      filterRecent === "todos" ? true : i.type === filterRecent,
    );
  }, [filterRecent]);

  // Recalcular altura da coluna esquerda
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const s = startRef.current?.getBoundingClientRect();
      const e = endRef.current?.getBoundingClientRect();
      if (!s || !e) return;
      setSpanHeight(e.bottom - s.top);
    };
    const timer = setTimeout(update, 50);
    window.addEventListener("resize", update);
    return () => clearTimeout(timer);
  }, [highlights, communityReviews]);

  const renderCategoryChips = (current, setter) => {
    const chips = [
      { k: "todos", label: t("filter.all") },
      { k: "filme", label: t("filter.movies") },
      { k: "livro", label: t("filter.books") },
      { k: "jogo", label: t("filter.games") },
      { k: "album", label: t("filter.albums") },
    ];
    return (
      <>
        {chips.map((f) => (
          <button
            key={f.k}
            onClick={() => setter(f.k)}
            className={cx(
              "px-3 py-1.5 rounded-full border",
              current === f.k
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </>
    );
  };

  return (
    <div className={cx(theme === "dark" ? "dark" : "", "font-sans")}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <HeaderBar
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          t={t}
        />

        <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* COLUNA ESQUERDA */}
            <div className="xl:col-span-8 flex flex-col gap-10 min-h-0">
              {/* DESTAQUES */}
              <div ref={startRef}>
                <SectionHeader
                  title={t("section.highlights")}
                  icon={<StarIcon className="w-4 h-4" />}
                  href="#"
                  filters={renderCategoryChips(filterHigh, setFilterHigh)}
                  t={t}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {highlights.map((m) => (
                    <Link to={`/media/${m.id}`} key={m.id}>
                      <MediaCard
                        item={m}
                        wide
                        badgeLabel={t(`badge.${m.type}`)}
                      />
                    </Link>
                  ))}
                </div>
              </div>

              {/* VOZES DA COMUNIDADE */}
              <div>
                <SectionHeader
                  title={t("section.communityReviews") || "Vozes da Comunidade"}
                  icon={<Clock className="w-4 h-4" />}
                  href="#"
                  filters={renderCategoryChips(filterRecent, setFilterRecent)}
                  t={t}
                />
                <div className="grid grid-cols-1 gap-4">
                  {communityReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} t={t} />
                  ))}
                </div>
              </div>

              {/* CLUBES */}
              <div ref={endRef}>
                <SectionHeader
                  title={t("section.clubs")}
                  icon={<Users className="w-4 h-4" />}
                  href="/clubs"
                  t={t}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubs.map((c) => (
                    <motion.div
                      key={c.id}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-3"
                    >
                      <div className="h-24 rounded-xl bg-gradient-to-br from-sky-500/20 via-purple-500/10 to-emerald-500/10" />
                      <div>
                        <h4 className="font-semibold leading-tight">
                          {c.name}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {c.about}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <AvatarStack names={c.members} />
                        <span className="text-xs text-neutral-500">
                          {t("label.next")}: {c.next}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA (Atividade) */}
            <aside
              style={{ maxHeight: spanHeight ?? "100vh" }}
              className="xl:col-span-4 flex flex-col sticky top-24 min-h-0"
            >
              <SectionHeader
                title={t("section.friends")}
                icon={<MessageSquare className="w-4 h-4" />}
                t={t}
              />
              {/* mt-2 para alinhamento fino */}
              <div className="mt-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800 flex-1 min-h-0 overflow-y-auto">
                {friendsFeed.map((f) => (
                  <div key={f.id} className="p-4 flex items-start gap-3">
                    <Link
                      to={`/profile/${f.handle.replace("@", "")}`}
                      className="shrink-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-[11px] font-semibold text-neutral-700 dark:text-neutral-100">
                        {f.who.substring(0, 1)}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Link
                          to={`/profile/${f.handle.replace("@", "")}`}
                          className="font-medium truncate hover:underline"
                        >
                          {f.who}
                        </Link>
                        <span className="text-neutral-500 truncate">
                          {f.handle}
                        </span>
                        <MediaBadge
                          type={f.type}
                          compact
                          label={t(`badge.${f.type}`)}
                        />
                        <span className="ml-auto text-xs text-neutral-500 whitespace-nowrap">
                          {f.when}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {f.item}
                        </span>
                        <span className="text-xs text-neutral-500">
                          ★ {f.score}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-200 line-clamp-3">
                        {f.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
