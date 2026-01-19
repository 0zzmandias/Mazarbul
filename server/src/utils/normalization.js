/**
 * NORMALIZATION ENGINE
 * * Este módulo implementa a "Regra Geral" do sistema Mazarbul:
 * 1. Internacionalização de Países (ISO2 -> Objeto Trilingue).
 * 2. Funil de Gêneros (Mapeamento de chaves canônicas -> Tradução Condicional).
 * * Seguindo o PLANO:
 * - Jogos e Álbuns: Não traduzem gêneros (mantêm o termo original/EN).
 * - Livros e Filmes: Traduzem gêneros para PT, EN e ES.
 */

// ==========================================
// 1. DICIONÁRIO DE PAÍSES (ISO2 -> TRILINGUE)
// ==========================================
export const COUNTRY_MAP = {
    "BR": { PT: "Brasil", EN: "Brazil", ES: "Brasil" },
    "US": { PT: "Estados Unidos", EN: "United States", ES: "Estados Unidos" },
    "GB": { PT: "Reino Unido", EN: "United Kingdom", ES: "Reino Unido" },
    "FR": { PT: "França", EN: "France", ES: "Francia" },
    "DE": { PT: "Alemanha", EN: "Germany", ES: "Alemania" },
    "JP": { PT: "Japão", EN: "Japan", ES: "Japón" },
    "ES": { PT: "Espanha", EN: "Spain", ES: "España" },
    "IT": { PT: "Itália", EN: "Italy", ES: "Italia" },
    "CA": { PT: "Canadá", EN: "Canada", ES: "Canadá" },
    "AR": { PT: "Argentina", EN: "Argentina", ES: "Argentina" },
    "MX": { PT: "México", EN: "Mexico", ES: "México" },
    "KR": { PT: "Coreia do Sul", EN: "South Korea", ES: "Corea del Sur" },
    "CN": { PT: "China", EN: "China", ES: "China" },
    "IN": { PT: "Índia", EN: "India", ES: "India" },
    "AU": { PT: "Austrália", EN: "Australia", ES: "Australia" }
    // O sistema aceita qualquer código ISO2, usando o padrão EN se não estiver no mapa
};

// ==========================================
// 2. DICIONÁRIO DE GÊNEROS (CHAVES CANÔNICAS)
// ==========================================
// Estas chaves são o resultado do "Funil" (Redução de Gêneros)
export const GENRE_MAP = {
    "fantasy": {
        PT: "Fantasia",
        EN: "Fantasy",
        ES: "Fantasía",
        QIDS: ["Q132311", "Q211059", "Q1762165"] // Fantasy, High Fantasy, Sword and Sorcery
    },
    "sci_fi": {
        PT: "Ficção Científica",
        EN: "Science Fiction",
        ES: "Ciencia Ficción",
        QIDS: ["Q164395", "Q469241", "Q182015"] // Sci-Fi, Space Opera, Cyberpunk
    },
    "action": {
        PT: "Ação",
        EN: "Action",
        ES: "Acción",
        QIDS: ["Q188473", "Q170217", "Q200793"] // Action, Martial Arts, Adventure
    },
    "horror": {
        PT: "Terror",
        EN: "Horror",
        ES: "Terror",
        QIDS: ["Q193132", "Q211026", "Q845778"] // Horror, Supernatural, Slasher
    },
    "romance": {
        PT: "Romance",
        EN: "Romance",
        ES: "Romance",
        QIDS: ["Q1054574", "Q130232"] // Romance, Drama
    },
    "mystery": {
        PT: "Mistério",
        EN: "Mystery",
        ES: "Misterio",
        QIDS: ["Q211018", "Q182015"] // Mystery, Crime, Detective
    },
    "thriller": {
        PT: "Suspense",
        EN: "Thriller",
        ES: "Suspenso",
        QIDS: ["Q24925", "Q132311"] // Thriller, Psychological Thriller
    }
};

/**
 * Normaliza o país para um objeto estruturado em 3 línguas.
 * @param {string} isoCode - Código ISO2 (ex: "BR")
 */
export const normalizeCountry = (isoCode) => {
    if (!isoCode) return null;
    const code = isoCode.toUpperCase();
    const entry = COUNTRY_MAP[code];

    if (entry) return entry;

    // Se não estiver no mapa, retorna o código bruto como fallback para as 3 línguas
    return {
        PT: code,
        EN: code,
        ES: code
    };
};

/**
 * Aplica a "Regra Geral" de Gêneros do Plano.
 * 1. Redução via QID (Funil).
 * 2. Tradução Condicional baseada no tipo de mídia.
 * * @param {string} mediaType - 'filme', 'livro', 'jogo', 'album'
 * @param {Array} wikidataGenres - Array de objetos { qid, titles } vindos da Wikidata
 */
export const normalizeMediaGenres = (mediaType, wikidataGenres) => {
    if (!Array.isArray(wikidataGenres)) return { PT: [], EN: [], ES: [] };

    const isTranslatable = mediaType === 'filme' || mediaType === 'livro';
    const result = { PT: [], EN: [], ES: [] };

    wikidataGenres.forEach(genre => {
        // 1. Tenta encontrar a chave canônica pelo QID (Funil)
        let canonicalKey = null;
        for (const [key, data] of Object.entries(GENRE_MAP)) {
            if (data.QIDS.includes(genre.qid)) {
                canonicalKey = key;
                break;
            }
        }

        if (canonicalKey && isTranslatable) {
            // 2. Se for traduzível (Filme/Livro), usa o dicionário
            const trans = GENRE_MAP[canonicalKey];
            result.PT.push(trans.PT);
            result.EN.push(trans.EN);
            result.ES.push(trans.ES);
        } else {
            // 3. Se for Jogo/Álbum OU se não houver chave canônica,
            // usa o termo original (geralmente EN ou o label da Wikidata)
            const original = genre.titles?.EN || genre.titles?.PT || "Generic";
            result.PT.push(original);
            result.EN.push(original);
            result.ES.push(original);
        }
    });

    // Remove duplicatas e limita a 2 gêneros por mídia para manter a UI limpa
    const clean = (arr) => [...new Set(arr)].slice(0, 2);

    return {
        PT: clean(result.PT),
        EN: clean(result.EN),
        ES: clean(result.ES),
        DEFAULT: clean(result.EN)
    };
};
