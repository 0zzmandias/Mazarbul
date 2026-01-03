// src/constants/books.genres.js

// =====================================================
// LIVROS (Google Books Categories -> Classificador -> Top 3)
// =====================================================
//
// Objetivo:
// - Receber categories do Google Books (strings ruidosas e hierárquicas)
// - Classificar em chaves canônicas (conjunto pequeno) para evitar ruído infinito
// - Traduzir essas chaves para PT/ES/EN
// - Retornar no máximo 3 gêneros por livro
//
// Observação:
// - O backend entrega para livros um array "genres" com as categories cruas do Google Books.
// - Este módulo transforma esse array em 1..3 gêneros "bons" para exibição.

export const BOOK_GENRE_TRANSLATIONS = {
    // Macros
    fiction: { pt: "Ficção", es: "Ficción", en: "Fiction" },
    non_fiction: { pt: "Não Ficção", es: "No Ficción", en: "Non-fiction" },

    // Ficção
    fantasy: { pt: "Fantasia", es: "Fantasía", en: "Fantasy" },
    sci_fi: { pt: "Ficção Científica", es: "Ciencia Ficción", en: "Science Fiction" },
    romance: { pt: "Romance", es: "Romance", en: "Romance" },
    mystery: { pt: "Mistério", es: "Misterio", en: "Mystery" },
    thriller: { pt: "Suspense", es: "Suspenso", en: "Thriller" },
    horror: { pt: "Terror", es: "Terror", en: "Horror" },

    // Não ficção / temas grandes
    history: { pt: "História", es: "Historia", en: "History" },
    biography: { pt: "Biografia", es: "Biografía", en: "Biography" },
    philosophy: { pt: "Filosofia", es: "Filosofía", en: "Philosophy" },
    religion: { pt: "Religião", es: "Religión", en: "Religion" },
    psychology: { pt: "Psicologia", es: "Psicología", en: "Psychology" },
    self_help: { pt: "Autoajuda", es: "Autoayuda", en: "Self-help" },

    business: { pt: "Negócios", es: "Negocios", en: "Business" },
    economics: { pt: "Economia", es: "Economía", en: "Economics" },
    finance: { pt: "Finanças", es: "Finanzas", en: "Finance" },

    politics: { pt: "Política", es: "Política", en: "Politics" },
    social_science: { pt: "Ciências Sociais", es: "Ciencias Sociales", en: "Social Science" },

    science: { pt: "Ciência", es: "Ciencia", en: "Science" },
    technology: { pt: "Tecnologia", es: "Tecnología", en: "Technology" },
    education: { pt: "Educação", es: "Educación", en: "Education" },
    health: { pt: "Saúde", es: "Salud", en: "Health" },

    // Formatos / públicos
    children: { pt: "Infantil", es: "Infantil", en: "Children" },
    young_adult: { pt: "Jovem Adulto", es: "Juvenil", en: "Young Adult" },
    comics: { pt: "Quadrinhos", es: "Cómics", en: "Comics" },
    poetry: { pt: "Poesia", es: "Poesía", en: "Poetry" },

    // Lifestyle
    cooking: { pt: "Culinária", es: "Cocina", en: "Cooking" },
    travel: { pt: "Viagem", es: "Viajes", en: "Travel" },
    art: { pt: "Arte", es: "Arte", en: "Art" }
};

const normalizeLang = (langCode = "PT") => {
    const l = langCode ? String(langCode).toLowerCase().split("-")[0] : "pt";
    if (l !== "pt" && l !== "es" && l !== "en") return "pt";
    return l;
};

const cleanCategoryString = (value) => {
    if (!value || typeof value !== "string") return "";
    return value
    .replace("tag.", "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const splitCategoryPath = (category) => {
    // Ex.: "Fiction / Fantasy / General" -> ["fiction", "fantasy", "general"]
    const cleaned = cleanCategoryString(category);
    if (!cleaned) return [];
    return cleaned
    .split("/")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
};

// Genéricos: só entram se não houver nenhum gênero mais específico
const BOOK_GENERIC_KEYS = new Set(["fiction", "non_fiction"]);

// Tokens que pouco ajudam e aparecem muito em paths
const BOOK_IGNORE_TOKENS = new Set(["general", "miscellaneous", "other", "books", "literature"]);

// Regras: padrões para mapear tokens (ou a string inteira) em chaves canônicas.
const BOOK_RULES = [
    // Público / faixa
    { key: "children", patterns: [/juvenile/, /children/, /\bkids?\b/] },
{ key: "young_adult", patterns: [/young adult/, /\bya\b/] },

// Ficção
{ key: "fantasy", patterns: [/fantasy/] },
{ key: "sci_fi", patterns: [/science fiction/, /sci[\s-]?fi/, /\bsf\b/] },
{ key: "romance", patterns: [/romance/] },
{ key: "mystery", patterns: [/mystery/, /detective/] },
{ key: "thriller", patterns: [/thriller/, /suspense/] },
{ key: "horror", patterns: [/horror/] },

// Macros
{ key: "non_fiction", patterns: [/non[\s-]?fiction/] },
{ key: "fiction", patterns: [/^fiction$/, /literary fiction/, /\bnovel\b/] },

// Não ficção / grandes temas
{ key: "history", patterns: [/^history$/, /historical/] },
{ key: "biography", patterns: [/biography/, /autobiography/, /memoir/] },
{ key: "philosophy", patterns: [/philosophy/] },
{ key: "religion", patterns: [/religion/, /theology/, /spiritual/] },
{ key: "psychology", patterns: [/psychology/, /behavior/, /behaviour/] },
{ key: "self_help", patterns: [/self[\s-]?help/, /personal growth/, /motivational/] },

{ key: "business", patterns: [/business/, /management/, /marketing/, /entrepreneur/] },
{ key: "economics", patterns: [/economics/] },
{ key: "finance", patterns: [/finance/, /investment/, /investing/, /personal finance/] },

{ key: "politics", patterns: [/politics/, /government/, /public policy/, /political science/] },
{ key: "social_science", patterns: [/social science/, /sociology/, /anthropology/] },

{ key: "science", patterns: [/science/, /physics/, /chemistry/, /biology/, /mathematics/, /astronomy/] },
{ key: "technology", patterns: [/computers/, /technology/, /programming/, /software/, /internet/] },
{ key: "education", patterns: [/education/, /study aids/, /language arts/, /disciplines/, /reference/] },
{ key: "health", patterns: [/health/, /fitness/, /medical/, /nutrition/, /wellness/] },

// Formatos
{ key: "comics", patterns: [/comics/, /graphic novels?/, /manga/] },
{ key: "poetry", patterns: [/poetry/] },

// Lifestyle
{ key: "cooking", patterns: [/cooking/, /food/, /recipes?/] },
{ key: "travel", patterns: [/travel/] },
{ key: "art", patterns: [/art/, /photography/, /music/, /performing arts/] }
];

const matchBookRule = (tokenOrFullString) => {
    if (!tokenOrFullString) return null;
    for (const rule of BOOK_RULES) {
        for (const re of rule.patterns) {
            if (re.test(tokenOrFullString)) return rule.key;
        }
    }
    return null;
};

const uniq = (arr) => Array.from(new Set(arr));

/**
 * Classifica categories do Google Books em chaves canônicas.
 * Retorna no máximo 3.
 * Importante: este passo reduz ruído e evita dicionário infinito.
 */
export const classifyBookGenres = (rawCategories, limit = 3) => {
    const categories = Array.isArray(rawCategories)
    ? rawCategories
    : typeof rawCategories === "string"
    ? [rawCategories]
    : [];

    if (categories.length === 0) return [];

    const scores = {}; // key -> score

    for (const cat of categories) {
        const segments = splitCategoryPath(cat);

        // 1) tenta casar por segmento (path)
        for (let i = 0; i < segments.length; i++) {
            const token = segments[i];
            if (!token) continue;
            if (BOOK_IGNORE_TOKENS.has(token)) continue;

            // Peso: quanto mais profundo no path, mais específico tende a ser.
            const weight = 10 + i * 10;

            const matchedKey = matchBookRule(token);
            if (matchedKey) {
                scores[matchedKey] = (scores[matchedKey] || 0) + weight;
            }
        }

        // 2) tenta casar na string inteira (às vezes o split perde informação como "&")
        const full = cleanCategoryString(cat).toLowerCase();
        if (full) {
            const matchedKey = matchBookRule(full);
            if (matchedKey) {
                scores[matchedKey] = (scores[matchedKey] || 0) + 8;
            }
        }
    }

    // Ranking por score
    const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

    // Fallback para evitar "livro alien":
    // Se nenhuma regra casou, tenta inferir macro por presença de "fiction".
    if (ranked.length === 0) {
        const joined = categories.map((c) => cleanCategoryString(c).toLowerCase()).join(" | ");
        if (/\bfiction\b/.test(joined)) return ["fiction"].slice(0, limit);
        return ["non_fiction"].slice(0, limit);
    }

    // Remove genéricos se já existe algo mais específico.
    const hasSpecific = ranked.some((k) => !BOOK_GENERIC_KEYS.has(k));
    let filtered = ranked;
    if (hasSpecific) filtered = ranked.filter((k) => !BOOK_GENERIC_KEYS.has(k));

    // Garante que nunca fica vazio aqui
    if (filtered.length === 0) filtered = ranked;

    // Dedup e top N
    return uniq(filtered).slice(0, limit);
};

export const translateBookGenreKey = (genreKey, langCode = "PT") => {
    if (!genreKey) return "";
    const lang = normalizeLang(langCode);

    const entry = BOOK_GENRE_TRANSLATIONS[genreKey];
    if (!entry) {
        // fallback: humaniza a chave
        return String(genreKey).replace(/_/g, " ").trim();
    }

    if (lang === "pt") return entry.pt || entry.en || entry.es || genreKey;
    if (lang === "es") return entry.es || entry.pt || entry.en || genreKey;
    return entry.en || entry.pt || entry.es || genreKey;
};

/**
 * Retorna os gêneros de livros já prontos para exibição (no idioma do site),
 * limitados a no máximo 3.
 */
export const getBookGenresTop3 = (rawCategories, langCode = "PT", limit = 3) => {
    const keys = classifyBookGenres(rawCategories, limit);
    return keys.map((k) => translateBookGenreKey(k, langCode)).filter(Boolean);
};
