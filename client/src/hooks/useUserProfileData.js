import { useState, useEffect, useMemo } from "react";
// 1. Importar o hook para usar o Contexto
import { useUserDatabase } from "../contexts/UserDatabaseContext.jsx";

// URL Base do Backend
const API_BASE_URL = "http://localhost:3000/api";

// ==========================
// LISTA MESTRA DE CONQUISTAS
// ==========================
export const MASTER_ACHIEVEMENTS_LIST = [
  { id: "the-one", tiers: [12, 25, 52], iconName: "book-open" },
{ id: "narya", tiers: [12, 25, 52], iconName: "music" },
{ id: "vilya", tiers: [12, 25, 52], iconName: "film" },
{ id: "nenya", tiers: [12, 25, 52], iconName: "gamepad" },
{ id: "life-universe-everything", tiers: [1, 6, 12], iconName: "rocket" },
{ id: "horror-business", tiers: [1, 6, 12], iconName: "skull" },
{ id: "wood-between-worlds", tiers: [1, 6, 12], iconName: "sword" },
{ id: "once-upon-time-west", tiers: [1, 6, 12], iconName: "sun" },
{ id: "kagemusha", tiers: [1, 6, 12], iconName: "sword-crossed" },
{ id: "help-me-eros", tiers: [1, 6, 12], iconName: "heart" },
{ id: "guernica", tiers: [1, 6, 12], iconName: "shield" },
{ id: "nighthawks", tiers: [1, 6, 12], iconName: "search" },
{ id: "perche-leggere-classici", tiers: [1, 6, 12], iconName: "hourglass" },
{ id: "zeitgeist", tiers: [6, 12, 25], iconName: "zap" },
{ id: "moritarnon", tiers: [1, 3, 6], iconName: "eye-off" },
{ id: "arda", tiers: [1, 3, 6], iconName: "globe" },
{ id: "rhun", tiers: [1, 3, 6], iconName: "compass" },
{ id: "khazad-dum", tiers: [1, 6, 12], iconName: "pickaxe" },
{ id: "manwe", tiers: [1, 6, 12], iconName: "thumbs-up" },
{ id: "melkor", tiers: [1, 6, 12], iconName: "thumbs-down" },
{ id: "trivium", tiers: [1, 3, 6], iconName: "layers" },
{ id: "quadrivium", tiers: [1, 3, 6], iconName: "box" },
{ id: "dagor-dagorath", tiers: [1, 3, 6], iconName: "infinity" },
];

// ==========================
// BANCO DE DADOS DA HOME (ESTÁTICO - A SER SUBSTITUÍDO NA PRÓXIMA SPRINT)
// ==========================
export const staticHomeDatabase = {
  highlights: [
    {
      id: "m1",
      type: "filme",
      title: "Duna: Parte Dois",
      year: 2024,
      score: 9.2,
    },
    {
      id: "g1",
      type: "jogo",
      title: "Baldur's Gate 3",
      year: 2023,
      score: 9.7,
    },
    {
      id: "b1",
      type: "livro",
      title: "O Nome do Vento",
      year: 2007,
      score: 9.3,
    },
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
  ],
  communityReviews: [
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
  ],
  friendsActivity: [
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
  ],
};

// ==========================
// BANCO DE DADOS DE CLUBES
// ==========================
export const staticClubsDatabase = [
  {
    id: "c1",
    name: "Clube Sci-Fi",
    description: "Explorando o desconhecido, de Asimov a Cyberpunk.",
    ownerHandle: "alexl",
    membersCount: 142,
    nextMeeting: "27/10 • 20:00",
    tags: ["tag.scifi", "tag.futurismo", "tag.tecnologia"],
    coverGradient: "from-indigo-500 via-purple-500 to-pink-500",
    rules:
    "1. Respeito acima de tudo.\n2. Spoilers apenas com aviso ou na thread específica.\n3. Votações ficam abertas por 48h.",
    activeWorks: [
      { id: "duna-livro", type: "livro", title: "Duna" },
      { id: "m1", type: "filme", title: "Duna: Parte Dois" },
      { id: "g_mass_effect", type: "jogo", title: "Mass Effect Legendary" },
      { id: "a_blade_runner_ost", type: "album", title: "Blade Runner Blues" },
    ],
    topics: [
      {
        id: "t1",
        title: "Boas-vindas e Apresentações",
        author: "alexl",
        isPinned: true,
        context: "general",
        date: "20 Out 2025",
        body: "Olá a todos! Sejam bem-vindos ao Clube Sci-Fi. Use este espaço para se apresentar, dizer qual sua obra de ficção científica favorita e o que espera das nossas leituras.",
        replies: [
          {
            id: "r1",
            author: "maris",
            text: "Oi gente! Sou a Marina. Minha obra favorita é Duna (óbvio).",
            date: "20 Out 2025",
          }
        ],
      }
    ],
    members: [
      { name: "Alex Lima", handle: "@alexl", role: "owner", avatar: "A" },
      { name: "Marina Silva", handle: "@maris", role: "mod", avatar: "M" },
    ],
  },
{
  id: "c2",
  name: "Terror à Meia-Noite",
  description: "Dissecando o horror psicológico e slashers clássicos.",
  ownerHandle: "maris",
  membersCount: 89,
  nextMeeting: "31/10 • 23:59",
  tags: ["tag.horror", "tag.cinema", "tag.suspense"],
  coverGradient: "from-red-900 via-red-600 to-orange-900",
  rules: "Proibido gore real. Apenas ficção.",
  activeWorks: [{ id: "m_hereditario", type: "filme", title: "Hereditário" }],
  topics: [],
  members: [],
},
{
  id: "c3",
  name: "Indie Games Corner",
  description: "Descobrindo joias escondidas.",
  ownerHandle: "maris",
  membersCount: 215,
  tags: ["tag.indie", "tag.jogos", "tag.art"],
  coverGradient: "from-emerald-500 via-teal-500 to-cyan-500",
  activeWorks: [],
  topics: [],
  members: [],
},
{
  id: "c4",
  name: "Sociedade do Anel",
  description: "Alta fantasia.",
  ownerHandle: "gandalf_fake",
  membersCount: 350,
  tags: ["tag.fantasia", "tag.rpg", "tag.literatura"],
  coverGradient: "from-amber-500 via-yellow-600 to-orange-500",
  activeWorks: [],
  topics: [],
  members: [],
},
{
  id: "c5",
  name: "Cinephiles Noir",
  description: "Cinema preto e branco.",
  ownerHandle: "bogart",
  membersCount: 45,
  tags: ["tag.noir", "tag.cinema", "tag.classico"],
  coverGradient: "from-gray-900 via-gray-700 to-gray-500",
  activeWorks: [],
  topics: [],
  members: [],
},
{
  id: "c6",
  name: "Vinil & Café",
  description: "Apreciação de álbuns.",
  ownerHandle: "alexl",
  membersCount: 120,
  tags: ["tag.musica", "tag.jazz", "tag.rock"],
  coverGradient: "from-amber-900 via-yellow-900 to-brown-800",
  activeWorks: [],
  topics: [],
  members: [],
},
{
  id: "c7",
  name: "Literatura Latino-Americana",
  description: "Realismo mágico.",
  ownerHandle: "gabo",
  membersCount: 78,
  tags: ["tag.literatura", "tag.cultura", "tag.historia"],
  coverGradient: "from-green-600 via-yellow-500 to-blue-600",
  activeWorks: [],
  topics: [],
  members: [],
},
{
  id: "c8",
  name: "Cyberpunk Netrunners",
  description: "High Tech, Low Life.",
  ownerHandle: "v_cyber",
  membersCount: 156,
  tags: ["tag.scifi", "tag.ciberpunk", "tag.tecnologia"],
  coverGradient: "from-pink-600 via-purple-600 to-cyan-400",
  activeWorks: [],
  topics: [],
  members: [],
},
];

// ==========================
// BANCO DE DADOS DE MÍDIAS (CACHE)
// ==========================
export const staticMediaDatabase = {
  m1: {
    id: "m1",
    type: "filme",
    title: { PT: "Duna: Parte Dois", EN: "Dune: Part Two", ES: "Dune: Parte Dos" },
    posterUrl: "https://image.tmdb.org/t/p/w500/1m02V5s5z03iV2lX3a1iV77F22i.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    sinopse: { PT: "Paul Atreides se une a Chani..." },
    details: { Diretor: "Denis Villeneuve", Duração: "2h 46min", Gênero: ["tag.scifi", "tag.aventura"], Ano: "2024" },
    communityAverage: 9.18,
    communityReviews: [{ id: "cr1", user: { name: "Júlia", handle: "@ju", avatar: "J" }, score: 9.1, text: "Visual imersivo..." }]
  },
  "duna-livro": {
    id: "duna-livro",
    type: "livro",
    title: { PT: "Duna", EN: "Dune" },
    posterUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414l/44767458.jpg",
    details: { Autor: "Frank Herbert", Gênero: ["tag.scifi", "tag.fantasia"], Ano: "1965" }
  },
  "duna-1984": {
    id: "duna-1984",
    type: "filme",
    title: { PT: "Duna", EN: "Dune" },
    posterUrl: "https://image.tmdb.org/t/p/w500/a3nDwAnKAl0jsSmsGaen09F2s6G.jpg",
    details: { Diretor: "David Lynch", Gênero: ["tag.scifi", "tag.aventura"], Ano: "1984" }
  },
  "portrait-2019": {
    id: "portrait-2019",
    type: "filme",
    title: { PT: "Retrato de uma Jovem em Chamas" },
    posterUrl: "https://image.tmdb.org/t/p/w500/s2C0QeCcrT1BwE7cW3H1a3q3uY1.jpg",
    details: { Diretor: "Céline Sciamma", Gênero: ["tag.drama", "tag.romance"], Ano: "2019" }
  },
  m2: { id: "m2", type: "filme", title: { PT: "Parasita" }, posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", details: { Ano: "2019", Gênero: ["tag.drama"] } },
  m4: { id: "m4", type: "filme", title: { PT: "Blade Runner 2049" }, posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", details: { Ano: "2017", Gênero: ["tag.scifi"] } },
  m5: { id: "m5", type: "filme", title: { PT: "Oppenheimer" }, posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", details: { Ano: "2023", Gênero: ["tag.biografia"] } },
  g1: { id: "g1", type: "jogo", title: { PT: "Hades" }, posterUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg", details: { Ano: "2020", Gênero: ["tag.roguelike"] } },
  g2: { id: "g2", type: "jogo", title: { PT: "Baldur's Gate 3" }, posterUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg", details: { Ano: "2023", Gênero: ["tag.rpg"] } },
  b1: { id: "b1", type: "livro", title: { PT: "1984" }, posterUrl: "https://images-na.ssl-images-amazon.com/images/I/91SZSW8qSsL.jpg", details: { Ano: "1949", Gênero: ["tag.distopia"] } },
  b2: { id: "b2", type: "livro", title: { PT: "O Nome do Vento" }, posterUrl: "https://images-na.ssl-images-amazon.com/images/I/91M9xPIf10L.jpg", details: { Ano: "2007", Gênero: ["tag.fantasia"] } },
  a2: { id: "a2", type: "album", title: { PT: "To Pimp a Butterfly" }, posterUrl: "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png", details: { Ano: "2015", Gênero: ["tag.hiphop"] } },
};

export function getMediaDetails(mediaId) {
  return staticMediaDatabase[mediaId];
}

export function useUserProfileData(handle) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { clubsDb } = useUserDatabase();
  const finalHandle = (handle || "alexl").replace("@", "");

  useEffect(() => {
    async function fetchAllProfileData() {
      try {
        setLoading(true);

        const profileRes = await fetch(`${API_BASE_URL}/users/profile/${finalHandle}`);
        if (!profileRes.ok) throw new Error("Usuário não encontrado.");
        const profileData = await profileRes.json();

        const userId = profileData.id;

        const reviewsRes = await fetch(`${API_BASE_URL}/reviews/user/${userId}`);
        const reviewsData = reviewsRes.ok ? await reviewsRes.json() : [];

        const achievementsRes = await fetch(`${API_BASE_URL}/achievements/${userId}`);
        const achievementsData = achievementsRes.ok ? await achievementsRes.json() : [];

        // MAPEAMENTO DE DADOS (BANCO -> UI):
        // 1. Reviews: Rating vira Score, Content vira Text, CreatedAt vira Date
        const formattedReviews = reviewsData.map(r => ({
          ...r,
          score: r.rating ?? 0,
          date: r.createdAt ?? new Date().toISOString(),
                                                       text: r.content || "", // Correção: Resenha aparecendo vazia
                                                       type: r.media?.type || "filme",
                                                       title: r.media?.titles?.PT || r.media?.titles?.DEFAULT || "Sem título"
        }));

        // 2. Favoritos: releaseYear vira year, titles vira title
        const formattedFavorites = (profileData.favorites || []).map(f => ({
          ...f,
          title: f.titles || "Sem título", // MediaCard espera objeto ou string
          year: f.releaseYear || "N/A" // Correção: Ano não visível nos favoritos
        }));

        setUserData({
          profile: {
            name: profileData.name,
            handle: `@${profileData.handle}`,
            bio: profileData.bio,
            avatarUrl: profileData.avatarUrl,
          },
          badges: achievementsData.map(a => ({
            id: a.achievementId,
            progress: a.progress
          })),
          reviews: formattedReviews,
          favorites: formattedFavorites,
          collections: profileData.collections || []
        });

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (finalHandle) {
      fetchAllProfileData();
    }
  }, [finalHandle]);

  const dynamicTags = useMemo(() => {
    if (!userData) return [];
    const tagScores = new Map();
    const FAVORITE_WEIGHT = 4;
    const REVIEW_WEIGHT = 2;

    (userData.favorites || []).forEach((item) => {
      // Correção: Mídias no Prisma usam 'genres' ou 'tags'
      const tags = item.genres || item.tags || [];
      tags.forEach((tag) => {
        tagScores.set(tag, (tagScores.get(tag) || 0) + FAVORITE_WEIGHT);
      });
    });

    (userData.reviews || []).forEach((item) => {
      const tags = item.media?.genres || item.media?.tags || item.tags || [];
      tags.forEach((tag) => {
        tagScores.set(tag, (tagScores.get(tag) || 0) + REVIEW_WEIGHT);
      });
    });

    return Array.from(tagScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .slice(0, 10)
    .map(([tag]) => tag);
  }, [userData]);

  return {
    userData,
    loading,
    error,
    dynamicTags,
    clubs: clubsDb,
    homeData: staticHomeDatabase,
  };
}
