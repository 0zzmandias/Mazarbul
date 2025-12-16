import { useMemo } from "react";
// 1. Importar o hook para usar o Contexto
import { useUserDatabase } from "../contexts/UserDatabaseContext.jsx";

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
// BANCO DE DADOS DA HOME (NOVO)
// ==========================
const homeDatabase = {
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
// BANCO DE DADOS DE CLUBES (ATUALIZADO COM CONTEÚDO DE TÓPICOS)
// ==========================
const clubsDatabase = [
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
        body: "Olá a todos! Sejam bem-vindos ao Clube Sci-Fi. Use este espaço para se apresentar, dizer qual sua obra de ficção científica favorita e o que espera das nossas leituras.\n\nEu começo: Sou o Alex, adoro Philip K. Dick e espero que a gente consiga ler algo de Ursula K. Le Guin esse ano.",
        replies: [
          {
            id: "r1",
            author: "maris",
            text: "Oi gente! Sou a Marina. Minha obra favorita é Duna (óbvio).",
            date: "20 Out 2025",
          },
          {
            id: "r2",
            author: "joao",
            text: "E aí pessoal. Sou o João. Gosto muito de Cyberpunk.",
            date: "21 Out 2025",
          },
        ],
      },
      {
        id: "t2",
        title: "Discussão: Capítulos 1-5",
        author: "alexl",
        isPinned: false,
        context: "duna-livro",
        date: "22 Out 2025",
        body: "Vamos começar a discussão oficial de Duna! O que vocês acharam da introdução do Paul e do teste do Gom Jabbar?\n\nAchei a tensão da cena incrível, mesmo já tendo visto o filme.",
        replies: [
          {
            id: "r3",
            author: "maris",
            text: "A descrição da dor na mão dele é muito vívida. Herbert escreve muito bem.",
            date: "22 Out 2025",
          },
          {
            id: "r4",
            author: "bia",
            text: "Eu fiquei com pena dele, mas entendo a necessidade do teste para as Bene Gesserit.",
            date: "23 Out 2025",
          },
        ],
      },
      {
        id: "t3",
        title: "O filme fez justiça ao livro?",
        author: "maris",
        isPinned: false,
        context: "m1",
        date: "25 Out 2025",
        body: "Acabei de rever a Parte Dois. Visualmente é impecável, mas senti falta de alguns diálogos internos do livro. O que vocês acham? A mudança na Chani foi boa ou ruim?",
        replies: [
          {
            id: "r5",
            author: "lucas",
            text: "Acho que a mudança na Chani deu mais agência pra ela. No livro ela é meio passiva no final.",
            date: "25 Out 2025",
          },
        ],
      },
    ],
    members: [
      { name: "Alex Lima", handle: "@alexl", role: "owner", avatar: "A" },
      { name: "Marina Silva", handle: "@maris", role: "mod", avatar: "M" },
      { name: "João Silva", handle: "@joao", role: "member", avatar: "J" },
      { name: "Ana Clara", handle: "@anac", role: "member", avatar: "A" },
      { name: "Lucas P.", handle: "@lucas", role: "member", avatar: "L" },
      { name: "Beatriz", handle: "@bia", role: "member", avatar: "B" },
    ],
  },
  // ... MANTENHA OS OUTROS CLUBES (c2 a c8) IGUAIS, APENAS ADICIONANDO CAMPOS VAZIOS SE NECESSÁRIO
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
    members: [
      { name: "Marina Silva", handle: "@maris", role: "owner", avatar: "M" },
      { name: "Alex Lima", handle: "@alexl", role: "member", avatar: "A" },
    ],
  },
  {
    id: "c3",
    name: "Indie Games Corner",
    description:
      "Descobrindo joias escondidas e apoiando desenvolvedores independentes.",
    ownerHandle: "maris",
    membersCount: 215,
    nextMeeting: "10/11 • 18:00",
    tags: ["tag.indie", "tag.jogos", "tag.art"],
    coverGradient: "from-emerald-500 via-teal-500 to-cyan-500",
    rules: "Sem gatekeeping. Todo jogo é jogo.",
    activeWorks: [
      { id: "g_hollow", type: "jogo", title: "Hollow Knight" },
      { id: "g_celeste", type: "jogo", title: "Celeste" },
      { id: "a_celeste_ost", type: "album", title: "Celeste OST" },
    ],
    topics: [],
    members: [],
  },
  {
    id: "c4",
    name: "Sociedade do Anel",
    description: "Para os amantes da alta fantasia e construção de mundos.",
    ownerHandle: "gandalf_fake",
    membersCount: 350,
    nextMeeting: "05/11 • 19:00",
    tags: ["tag.fantasia", "tag.rpg", "tag.literatura"],
    coverGradient: "from-amber-500 via-yellow-600 to-orange-500",
    rules: "Fale amigo e entre.",
    activeWorks: [
      { id: "b_silmarillion", type: "livro", title: "O Silmarillion" },
    ],
    topics: [],
    members: [],
  },
  {
    id: "c5",
    name: "Cinephiles Noir",
    description: "Sombras, detetives e a estética do cinema preto e branco.",
    ownerHandle: "bogart",
    membersCount: 45,
    nextMeeting: "15/11 • 21:00",
    tags: ["tag.noir", "tag.cinema", "tag.classico"],
    coverGradient: "from-gray-900 via-gray-700 to-gray-500",
    rules: "Preto e branco é lei.",
    activeWorks: [{ id: "m_maltese", type: "filme", title: "O Falcão Maltês" }],
    topics: [],
    members: [],
  },
  {
    id: "c6",
    name: "Vinil & Café",
    description: "Apreciação de álbuns completos, do Jazz ao Rock Progressivo.",
    ownerHandle: "alexl",
    membersCount: 120,
    nextMeeting: "Domingo • 10:00",
    tags: ["tag.musica", "tag.jazz", "tag.rock"],
    coverGradient: "from-amber-900 via-yellow-900 to-brown-800",
    rules: "Escute o álbum inteiro antes de opinar.",
    activeWorks: [{ id: "a_kindofblue", type: "album", title: "Kind of Blue" }],
    topics: [],
    members: [],
  },
  {
    id: "c7",
    name: "Literatura Latino-Americana",
    description: "Realismo mágico e as vozes do nosso continente.",
    ownerHandle: "gabo",
    membersCount: 78,
    nextMeeting: "02/11 • 19:30",
    tags: ["tag.literatura", "tag.cultura", "tag.historia"],
    coverGradient: "from-green-600 via-yellow-500 to-blue-600",
    rules: "Português ou Espanhol apenas.",
    activeWorks: [
      { id: "b_cem_anos", type: "livro", title: "Cem Anos de Solidão" },
    ],
    topics: [],
    members: [],
  },
  {
    id: "c8",
    name: "Cyberpunk Netrunners",
    description:
      "High Tech, Low Life. Discussões sobre distopias tecnológicas.",
    ownerHandle: "v_cyber",
    membersCount: 156,
    nextMeeting: "Sexta • 22:00",
    tags: ["tag.scifi", "tag.ciberpunk", "tag.tecnologia"],
    coverGradient: "from-pink-600 via-purple-600 to-cyan-400",
    rules: "Não hackear o grupo.",
    activeWorks: [
      { id: "g_cp2077", type: "jogo", title: "Cyberpunk 2077" },
      { id: "m_bladerunner", type: "filme", title: "Blade Runner" },
    ],
    topics: [],
    members: [],
  },
];

// ==========================
// SIMULAÇÃO DE BANCO DE DADOS (MOCK DB)
// ==========================

// --- DADOS DE MÍDIA DETALHADOS ---
const mediaDatabase = {
  m1: {
    id: "m1",
    type: "filme",
    title: {
      PT: "Duna: Parte Dois",
      EN: "Dune: Part Two",
      ES: "Dune: Parte Dos",
    },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/1m02V5s5z03iV2lX3a1iV77F22i.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    sinopse: {
      PT: "Paul Atreides se une a Chani e aos Fremen em uma guerra de vingança contra os conspiradores que destruíram sua família. Diante de uma escolha entre o amor de sua vida e o destino do universo conhecido, ele se esforça para evitar um futuro terrível que só ele pode prever.",
      EN: "Paul Atreides unites with Chani and the Fremen on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
      ES: "Paul Atreides se une a Chani y a los Fremen mientras emprende un camino de venganza contra los conspiradores que destruyeron a su familia. Al enfrentarse a una elección entre el amor de su vida y el destino del universo, se esfuerça por evitar un futuro terrible que solo él pode prever.",
    },
    details: {
      Diretor: "Denis Villeneuve",
      Duração: "2h 46min",
      Gênero: ["tag.scifi", "tag.aventura"],
      Ano: "2024",
      País: {
        PT: "Estados Unidos",
        EN: "United States",
        ES: "Estados Unidos",
      },
    },
    communityAverage: 9.18,
    communityReviews: [
      {
        id: "cr1",
        user: { name: "Júlia", handle: "@ju", avatar: "J" },
        score: 9.1,
        text: "Visual imersivo e trilha absurda...",
      },
    ],
  },
  "duna-livro": {
    id: "duna-livro",
    type: "livro",
    title: {
      PT: "Duna",
      EN: "Dune",
      ES: "Dune",
    },
    posterUrl:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414l/44767458.jpg",
    backdropUrl: "https://images.alphacoders.com/133/1333069.jpeg",
    sinopse: {
      PT: "Uma mistura de aventura e misticismo, ecologia e política, este romance premiado deu origem a um dos universos mais épicos da ficção científica.",
      EN: "A blend of adventure and mysticism, ecology and politics, this award-winning novel gave rise to one of the most epic universes in science fiction.",
      ES: "Una mezcla de aventura y misticismo, ecología y política, esta novela galardonada dio origen a uno de los universos más épicos de la ciencia ficción.",
    },
    details: {
      Autor: "Frank Herbert",
      Páginas: "688",
      Gênero: ["tag.scifi", "tag.fantasia", "tag.epica"],
      Ano: "1965",
      País: {
        PT: "Estados Unidos",
        EN: "United States",
        ES: "Estados Unidos",
      },
    },
  },
  "duna-1984": {
    id: "duna-1984",
    type: "filme",
    title: {
      PT: "Duna",
      EN: "Dune",
      ES: "Dune",
    },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/a3nDwAnKAl0jsSmsGaen09F2s6G.jpg",
    backdropUrl:
      "https://media.wired.com/photos/5f97371a536952d793623916/master/pass/Culture_Dune_Lynch-10659730-Edit.jpg",
    sinopse: {
      PT: "Em um futuro distante, clãs nobres rivais lutam pelo controle do desértico planeta Arrakis, a única fonte da valiosa especiaria Melange. A família Atreides aceita a administração do planeta, mas é traída por seus inimigos, os Harkonnens.",
      EN: "In the distant future, rival noble clans fight for control of the desert planet Arrakis, the only source of the valuable spice Melange. The Atreides family accepts stewardship of the planet, but is betrayed by their enemies, the Harkonnens.",
      ES: "En un futuro lejano, clanes nobles rivales luchan por el control del planeta desértico Arrakis, la única fuente de la valiosa especia Melange. La familia Atreides acepta la administración del planeta, pero es traicionada por sus enemigos, los Harkonnen.",
    },
    details: {
      Diretor: "David Lynch",
      Duração: "2h 17min",
      Gênero: ["tag.scifi", "tag.aventura", "tag.acao"],
      Ano: "1984",
      País: {
        PT: "Estados Unidos",
        EN: "United States",
        ES: "Estados Unidos",
      },
    },
  },
  "portrait-2019": {
    id: "portrait-2019",
    type: "filme",
    aliases: ["Portrait de la jeune fille en feu"],
    title: {
      PT: "Retrato de uma Jovem em Chamas",
      EN: "Portrait of a Lady on Fire",
      ES: "Retrato de una mujer en llamas",
    },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/s2C0QeCcrT1BwE7cW3H1a3q3uY1.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/g6PfZVLtYCaPiof5G3PEsIGV2cf.jpg",
    sinopse: {
      PT: "França, 1770. Marianne, uma pintora, é contratada para pintar o retrato de casamento de Héloïse, uma jovem que acaba de deixar o convento. Héloïse resiste ao seu destino, recusando-se a posar, então Marianne deve pintá-la em segredo.",
      EN: "France, 1770. Marianne, a painter, is commissioned to paint the wedding portrait of Héloïse, a young woman who has just left the convent. Héloïse resists her fate by refusing to pose, so Marianne must paint her in secret.",
      ES: "Francia, 1770. Marianne, una pintora, recibe el encargo de pintar el retrato de bodas de Héloïse, una joven que acaba de salir del convento. Héloïse se resiste a su destino negándose a posar, por lo que Marianne debe pintarla en secreto.",
    },
    details: {
      Diretor: "Céline Sciamma",
      Duração: "2h 2min",
      Gênero: ["tag.drama", "tag.romance", "tag.historia"],
      Ano: "2019",
      País: {
        PT: "França",
        EN: "France",
        ES: "Francia",
      },
    },
  },
  m2: {
    id: "m2",
    type: "filme",
    title: { PT: "Parasita" },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    sinopse: {
      PT: "A história de uma família pobre que se infiltra na vida de uma família rica.",
    },
    details: {
      Ano: "2019",
      Gênero: ["tag.drama", "tag.thriller", "tag.comedia"],
    },
  },
  m4: {
    id: "m4",
    type: "filme",
    title: { PT: "Blade Runner 2049" },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/sAtomqDVhNDQBc3QJl3RF6hlhGq.jpg",
    sinopse: {
      PT: "K, um novo Blade Runner, descobre um segredo há muito tempo enterrado.",
    },
    details: { Ano: "2017", Gênero: ["tag.scifi", "tag.noir", "tag.distopia"] },
  },
  m5: {
    id: "m5",
    type: "filme",
    title: { PT: "Oppenheimer" },
    posterUrl:
      "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwvkHIeHYDI2.jpg",
    sinopse: {
      PT: "A história do cientista americano J. Robert Oppenheimer e seu papel no desenvolvimento da bomba atômica.",
    },
    details: {
      Ano: "2023",
      Gênero: ["tag.biografia", "tag.drama", "tag.historia"],
    },
  },
  g1: {
    id: "g1",
    type: "jogo",
    title: { PT: "Hades" },
    posterUrl:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg",
    sinopse: {
      PT: "Desafie o deus dos mortos enquanto você batalha para sair do Submundo.",
    },
    details: {
      Ano: "2020",
      Gênero: ["tag.roguelike", "tag.mitologia", "tag.indie"],
    },
  },
  g2: {
    id: "g2",
    type: "jogo",
    title: { PT: "Baldur's Gate 3" },
    posterUrl:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg",
    sinopse: { PT: "Reúna seu grupo e retorne aos Reinos Esquecidos." },
    details: {
      Ano: "2023",
      Gênero: ["tag.rpg", "tag.fantasia", "tag.estrategia"],
    },
  },
  b1: {
    id: "b1",
    type: "livro",
    title: { PT: "1984" },
    posterUrl:
      "https://images-na.ssl-images-amazon.com/images/I/91SZSW8qSsL.jpg",
    sinopse: {
      PT: "Em 1984, Winston Smith vive em uma sociedade totalitária sob o olhar atento do Grande Irmão.",
    },
    details: {
      Ano: "1949",
      Gênero: ["tag.distopia", "tag.scifi", "tag.politica"],
    },
  },
  b2: {
    id: "b2",
    type: "livro",
    title: { PT: "O Nome do Vento" },
    posterUrl:
      "https://images-na.ssl-images-amazon.com/images/I/91M9xPIf10L.jpg",
    sinopse: {
      PT: "A história de Kvothe, um jovem dotado de magia, em sua busca por vingança.",
    },
    details: { Ano: "2007", Gênero: ["tag.fantasia", "tag.epica"] },
  },
  a2: {
    id: "a2",
    type: "album",
    title: { PT: "To Pimp a Butterfly" },
    posterUrl:
      "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png",
    sinopse: {
      PT: "O terceiro álbum de estúdio do rapper americano Kendrick Lamar.",
    },
    details: {
      Ano: "2015",
      Gênero: ["tag.hiphop", "tag.jazz", "tag.funk", "tag.criticasocial"],
    },
  },
};

// --- DADOS DE USUÁRIO (MARINA) ---
const marisData = {
  profile: {
    name: "Marina Silva",
    handle: "@maris",
    bio: "Viciada em listas, sci‑fi e cafés gelados. Avalio tudo que assisto/leio/jogo para lembrar por que gostei.",
    avatarUrl: "https://i.pravatar.cc/200?img=5",
  },
  badges: [
    { id: "the-one", progress: 60 },
    { id: "narya", progress: 5 },
    { id: "vilya", progress: 26 },
    { id: "nenya", progress: 12 },
    { id: "zeitgeist", progress: 8 },
    { id: "khazad-dum", progress: 2 },
  ],
  favorites: [
    {
      id: "g2",
      type: "jogo",
      title: "Baldur's Gate 3",
      year: 2023,
      score: 9.7,
      tags: ["tag.rpg", "tag.fantasia", "tag.estrategia"],
    },
    {
      id: "a2",
      type: "album",
      title: "To Pimp a Butterfly",
      year: 2015,
      score: 9.6,
      tags: ["tag.hiphop", "tag.jazz", "tag.funk", "tag.criticasocial"],
    },
    {
      id: "b1",
      type: "livro",
      title: "1984 (George Orwell)",
      year: 1949,
      score: 9.25,
      tags: ["tag.distopia", "tag.scifi", "tag.politica"],
    },
    {
      id: "m1",
      type: "filme",
      title: {
        PT: "Duna: Parte Dois",
        EN: "Dune: Part Two",
        ES: "Dune: Parte Dos",
      },
      year: 2024,
      score: 9.2,
      tags: ["tag.scifi", "tag.aventura"],
    },
    {
      id: "g1",
      type: "jogo",
      title: "Hades",
      year: 2020,
      score: 9.1,
      tags: ["tag.roguelike", "tag.mitologia", "tag.indie"],
    },
    {
      id: "m2",
      type: "filme",
      title: "Parasita",
      year: 2019,
      score: 9.0,
      tags: ["tag.drama", "tag.thriller", "tag.comedia"],
    },
    {
      id: "m4",
      type: "filme",
      title: "Blade Runner 2049",
      year: 2017,
      score: 8.9,
      tags: ["tag.scifi", "tag.noir", "tag.distopia"],
    },
    {
      id: "b2",
      type: "livro",
      title: "O Nome do Vento",
      year: 2007,
      score: 8.7,
      tags: ["tag.fantasia", "tag.epica"],
    },
  ],
  reviews: [
    {
      id: "r1",
      type: "filme",
      date: "12 Ago 2025",
      score: 9.25,
      title: "Duna: Parte Dois",
      tags: ["tag.scifi", "tag.aventura"],
      text: "Villeneuve mantém a grandiosidade sem perder os personagens de vista...",
    },
    {
      id: "r2",
      type: "livro",
      date: "08 Ago 2025",
      score: 9.0,
      title: "1984 (George Orwell)",
      tags: ["tag.distopia", "tag.politica"],
      text: "Revisita dolorosa e necessária...",
    },
    {
      id: "r3",
      type: "jogo",
      date: "03 Ago 2025",
      score: 9.5,
      title: "Baldur's Gate 3",
      tags: ["tag.rpg", "tag.fantasia"],
      text: "Liberdade real sem quebrar a narrativa...",
    },
    {
      id: "r4",
      type: "album",
      date: "26 Jul 2025",
      score: 8.75,
      title: "Random Access Memories",
      tags: ["tag.eletronica", "tag.disco"],
      text: "Produção analógica brilhante com espaço para respirar...",
    },
    {
      id: "r5",
      type: "filme",
      date: "20 Jul 2025",
      score: 9.0,
      title: "Oppenheimer",
      tags: ["tag.biografia", "tag.drama"],
      text: "Nolan de um jeito que nunca vimos: denso, dialógico e tenso...",
    },
    {
      id: "r6",
      type: "jogo",
      date: "15 Jul 2025",
      score: 9.2,
      title: "Hades",
      tags: ["tag.roguelike", "tag.mitologia"],
      text: "Combate viciante, com cada tentativa de fuga revelando mais da história...",
    },
    {
      id: "r7",
      type: "livro",
      date: "01 Jul 2025",
      score: 8.8,
      title: "O Nome do Vento",
      tags: ["tag.fantasia", "tag.epica"],
      text: "Construção de mundo e sistema de magia fascinantes...",
    },
    {
      id: "r8",
      type: "filme",
      date: "25 Jun 2025",
      score: 9.0,
      title: "Blade Runner 2049",
      tags: ["tag.scifi", "tag.noir"],
      text: "Visualmente deslumbrante e atmosférico...",
    },
  ],
  collections: [],
};

// --- DADOS DE USUÁRIO (ALEX) ---
const alexlData = {
  profile: {
    name: "Alex Lima",
    handle: "@alexl",
    bio: "Explorando mundos de fantasia e futuros distópicos. Foco em RPGs, cinema de autor e álbuns conceituais.",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
  },
  badges: [
    { id: "the-one", progress: 14 },
    { id: "narya", progress: 55 },
    { id: "nenya", progress: 24 },
    { id: "wood-between-worlds", progress: 7 },
    { id: "zeitgeist", progress: 10 },
  ],
  favorites: [
    {
      id: "m1",
      type: "filme",
      title: {
        PT: "Duna: Parte Dois",
        EN: "Dune: Part Two",
        ES: "Dune: Parte Dos",
      },
      year: 2024,
      score: 9.2,
      tags: ["tag.scifi", "tag.aventura"],
    },
    {
      id: "al_fav1",
      type: "jogo",
      title: "The Witcher 3: Wild Hunt",
      year: 2015,
      score: 9.8,
      tags: ["tag.rpg", "tag.fantasia", "tag.epica"],
    },
    {
      id: "al_fav2",
      type: "filme",
      title: "Interestelar",
      year: 2014,
      score: 9.5,
      tags: ["tag.scifi", "tag.drama"],
    },
    {
      id: "al_fav3",
      type: "livro",
      title: "O Senhor dos Anéis",
      year: 1954,
      score: 10,
      tags: ["tag.fantasia", "tag.epica", "tag.aventura"],
    },
    {
      id: "al_fav4",
      type: "album",
      title: "The Dark Side of the Moon",
      year: 1973,
      score: 9.9,
      tags: ["tag.rock", "tag.conceitual"],
    },
    {
      id: "al_fav5",
      type: "jogo",
      title: "Cyberpunk 2077",
      year: 2020,
      score: 9.0,
      tags: ["tag.rpg", "tag.scifi", "tag.distopia"],
    },
    {
      id: "al_fav6",
      type: "filme",
      title: "Blade Runner",
      year: 1982,
      score: 9.1,
      tags: ["tag.scifi", "tag.noir"],
    },
    {
      id: "al_fav7",
      type: "livro",
      title: "Neuromancer",
      year: 1984,
      score: 9.3,
      tags: ["tag.ciberpunk"],
    },
    {
      id: "al_fav8",
      type: "album",
      title: "OK Computer",
      year: 1997,
      score: 9.7,
      tags: ["tag.rock", "tag.alternativo"],
    },
  ],
  reviews: [
    {
      id: "al_rev1",
      type: "jogo",
      date: "15 Out 2025",
      score: 9.8,
      title: "The Witcher 3",
      tags: ["tag.rpg", "tag.fantasia"],
      text: "Uma obra-prima da narrativa em jogos. Cada contrato de bruxo conta uma história.",
    },
    {
      id: "al_rev2",
      type: "filme",
      date: "10 Out 2025",
      score: 9.5,
      title: "Interestelar",
      tags: ["tag.scifi"],
      text: "Uma jornada emocional e visualmente espetacular. A trilha sonora de Hans Zimmer é icônica.",
    },
    {
      id: "al_rev3",
      type: "livro",
      date: "05 Out 2025",
      score: 9.3,
      title: "O Senhor dos Anéis",
      tags: ["tag.fantasia", "tag.epica"],
      text: "A base de toda a fantasia moderna. Uma leitura obrigatória que te transporta para outro mundo.",
    },
    {
      id: "al_rev4",
      type: "album",
      date: "01 Out 2025",
      score: 9.9,
      title: "The Dark Side of the Moon",
      tags: ["tag.rock", "tag.conceitual"],
      text: "Um marco na história da música. Atmosférico, filosófico e sonoramente perfeito.",
    },
    {
      id: "al_rev5",
      type: "jogo",
      date: "28 Set 2025",
      score: 9.0,
      title: "Cyberpunk 2077",
      tags: ["tag.rpg", "tag.scifi"],
      text: "Apesar de um lançamento turbulento, a história e o mundo de Night City são cativantes. Um RPG profundo.",
    },
    {
      id: "al_rev6",
      type: "filme",
      date: "20 Set 2025",
      score: 9.1,
      title: "Blade Runner",
      tags: ["tag.scifi", "tag.noir"],
      text: "Clássico atemporal que define o gênero cyberpunk. A atmosfera e as questões filosóficas são ainda relevantes.",
    },
    {
      id: "al_rev7",
      type: "livro",
      date: "15 Set 2025",
      score: 9.3,
      title: "Neuromancer",
      tags: ["tag.ciberpunk"],
      text: "O livro que deu origem ao cyberpunk. Leitura densa mas recompensadora, um mergulho em um futuro tecnológico e sombrio.",
    },
    {
      id: "al_rev8",
      type: "album",
      date: "10 Set 2025",
      score: 9.7,
      title: "OK Computer",
      tags: ["tag.rock", "tag.alternativo"],
      text: "Radiohead no seu auge. Melancólico e visionário, um álbum que captura a ansiedade da era digital.",
    },
    {
      id: "al_rev9",
      type: "jogo",
      date: "05 Set 2025",
      score: 9.6,
      title: "God of War (2018)",
      tags: ["tag.aventura", "tag.mitologia"],
      text: "Uma reinvenção brilhante de Kratos. Combate visceral e uma história emocionante de pai e filho.",
    },
    {
      id: "al_rev10",
      type: "filme",
      date: "01 Set 2025",
      score: 9.0,
      title: "Arrival",
      tags: ["tag.scifi", "tag.drama"],
      text: "Um sci-fi inteligente e comovente sobre linguagem e tempo. Amy Adams entrega uma performance memorável.",
    },
  ],
  collections: [
    {
      id: "col1",
      title: "Cyberpunk Completo",
      description: "Uma imersão no gênero, do livro ao jogo.",
      items: [
        { id: "al_fav7", type: "livro", title: "Neuromancer" },
        { id: "al_fav6", type: "filme", title: "Blade Runner" },
        { id: "al_fav5", type: "jogo", title: "Cyberpunk 2077" },
      ],
    },
    {
      id: "col2",
      title: "Filmes para ver em 2025",
      description: "Minha lista de filmes para assistir este ano.",
      items: [{ id: "m5", type: "filme", title: "Oppenheimer" }],
    },
    {
      id: "col3",
      title: "Clássicos da Fantasia",
      description: "As obras que definiram o gênero.",
      items: [
        { id: "al_fav3", type: "livro", title: "O Senhor dos Anéis" },
        { id: "g2", type: "jogo", title: "Baldur's Gate 3" },
      ],
    },
  ],
};

// --- DADOS DE HOME ESTÁTICOS (Novos) ---
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

export const staticUserDatabase = { maris: marisData, alexl: alexlData };
export const staticMediaDatabase = mediaDatabase;
export const staticClubsDatabase = clubsDatabase;

function getUserData(handle) {
  const finalHandle = handle || "alexl";
  const userData = staticUserDatabase[finalHandle] || staticUserDatabase.alexl;
  return userData;
}

export function getMediaDetails(mediaId) {
  return staticMediaDatabase[mediaId];
}

export function useUserProfileData(handle) {
  // LENDO DO CONTEXTO: Agora inclui clubsDb
  const { db, clubsDb } = useUserDatabase();
  const finalHandle = handle || "alexl";
  const userData = db[finalHandle] || db.alexl;

  const dynamicTags = useMemo(() => {
    if (!userData) return [];
    const tagScores = new Map();
    const FAVORITE_WEIGHT = 4;
    const REVIEW_WEIGHT = 2;

    (userData.favorites || []).forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => {
          tagScores.set(tag, (tagScores.get(tag) || 0) + FAVORITE_WEIGHT);
        });
      }
    });

    (userData.reviews || []).forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => {
          tagScores.set(tag, (tagScores.get(tag) || 0) + REVIEW_WEIGHT);
        });
      }
    });

    const sortedTags = Array.from(tagScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 10)
      .map(([tag]) => tag);

    return sortedTags;
  }, [userData]);

  // Retorna os dados do usuário + a lista dinâmica de clubes (clubsDb) + dados da home
  return {
    ...userData,
    dynamicTags,
    clubs: clubsDb, // Clubes agora vêm do contexto (estado dinâmico)
    homeData: staticHomeDatabase, // Home continua estática por enquanto
  };
}
