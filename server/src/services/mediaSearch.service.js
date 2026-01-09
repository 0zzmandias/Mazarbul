import prisma from '../lib/prisma.js';
import { createHash } from 'crypto';
import { searchEntities, getEntities, isQid } from '../utils/wikidata.adapter.js';

// ==============================================================================
// 1. CONFIGURAÇÕES
// ==============================================================================

const WD_LANGS = ['pt-br', 'pt', 'en', 'es'];

const TYPE_DEFINITIONS = {
    livro: [
        'Q571', 'Q7725634', 'Q47461344', 'Q8261', 'Q277759', 'Q190192', 'Q334335'
    ],
    filme: [
        'Q11424', 'Q229390', 'Q506240'
    ],
    jogo: [
        'Q7889', 'Q115621596', 'Q7058673'
    ],
    album: [
        'Q482994', 'Q208569'
    ]
};

const BLOCKLIST_TYPES = new Set([
    'Q24856', 'Q196600', 'Q32906', 'Q5398426'
]);

const WD_CLAIMS = {
    instanceOf: 'P31', subclassOf: 'P279', basedOn: 'P144',
    publicationDate: 'P577', inception: 'P571', seriesOrdinal: 'P1545',
        tmdbMovieId: 'P4947', rawgGameId: 'P9968', openLibraryId: 'P648',
        hasPart: 'P527', partOf: 'P361'
};

const TITLE_NOISE_REGEX = /\b(making of|bastidores|documentári|documentary|comemoração|celebration|concert|live in|entrevista|interview|tour|soundtrack|trilha sonora|anniversary|special|especial|de volta a|return to)\b/i;
const BAD_TITLES = ['sem título', 'untitled', 'sem titulo', 'unnamed', 'episódio'];

// ==============================================================================
// 2. HELPERS
// ==============================================================================

const normalizeTitle = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['"`´’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const cleanTitleForUi = (value) => {
    const s = String(value || '').replace(/_/g, ' ').trim();
    if (!s) return null;
    const m = s.match(/^(.*)\s+\(([^)]+)\)\s*$/);
    return m ? m[1].trim() : s;
};

// ==============================================================================
// 3. CACHE E BANCO DE DADOS
// ==============================================================================

const dbFetchAliasPool = async ({ queryNormalized, pool = 100 }) => {
    try {
        const matches = await prisma.mediaAlias.findMany({
            where: { titleNormalized: { contains: queryNormalized } },
            take: pool,
            orderBy: { lastAccessedAt: 'desc' },
            select: { canonicalId: true }
        });
        return Array.from(new Set(matches.map(x => x.canonicalId)));
    } catch { return []; }
};

const fetchFromDb = async (ids, uiLang) => {
    try {
        const refs = await prisma.mediaReference.findMany({ where: { id: { in: ids } } });
        return refs.map(ref => ({
            id: ref.id, type: ref.type,
            title: ref.titles?.[uiLang] || ref.titles?.PT || ref.titles?.EN,
            year: ref.releaseYear,
            ordinal: ref.details?.technical?.seriesOrdinal,
            tmdb: ref.externalIds?.tmdb, score: 100
        }));
    } catch { return []; }
};

const saveToDbBackground = (items) => {
    setTimeout(async () => {
        for (const item of items) {
            try {
                if (!item.rawEntity) continue;
                const tech = { qid: item.id, type: item.type, year: item.year, seriesOrdinal: item.ordinal };
                const titles = { PT: item.title, EN: item.title };

                await prisma.mediaReference.upsert({
                    where: { id: item.id },
                    create: { id: item.id, type: item.type, titles, releaseYear: item.year, externalIds: { tmdb: item.tmdb }, details: { technical: tech }, isStub: true, synopses: {}, tags: [] },
                    update: { lastAccessedAt: new Date() }
                });

                const seed = `${item.id}|${normalizeTitle(item.title)}`;
                const hash = createHash('sha1').update(seed).digest('hex');
                await prisma.mediaAlias.upsert({
                    where: { id: `ma_${hash}` },
                    create: { id: `ma_${hash}`, canonicalId: item.id, type: item.type, lang: 'PT', title: item.title, titleNormalized: normalizeTitle(item.title), source: 'wikidata', lastAccessedAt: new Date() },
                                               update: { lastAccessedAt: new Date() }
                });
            } catch (e) {}
        }
    }, 100);
};

// ==============================================================================
// 4. LÓGICA DE ORDENAÇÃO REFINADA
// ==============================================================================

const sortBooks = (a, b) => {
    // 1. Ordinal
    if (a.ordinal && b.ordinal) return a.ordinal - b.ordinal;

    // 2. Apêndices (Sempre no fim absoluto da lista de livros)
    const isAppA = a.title.toLowerCase().includes('apêndices') || a.title.toLowerCase().includes('appendices');
    const isAppB = b.title.toLowerCase().includes('apêndices') || b.title.toLowerCase().includes('appendices');

    if (isAppA && !isAppB) return 1;  // A vai pro fundo
    if (!isAppA && isAppB) return -1; // B vai pro fundo

    // 3. Cronologia Padrão
    return (a.year || 9999) - (b.year || 9999);
};

const sortMovies = (a, b) => {
    if (a.ordinal && b.ordinal) return a.ordinal - b.ordinal;

    const yearA = a.year || 0;
    const yearB = b.year || 0;
    const diff = Math.abs(yearA - yearB);

    // Simplificação de título para detecção de Reboot
    // Se os títulos normalizados forem IGUAIS (ex: "duna" vs "duna") e o gap for grande,
    // assumimos que é um remake/reboot e queremos o mais novo primeiro.
    const titleA = normalizeTitle(a.title);
    const titleB = normalizeTitle(b.title);

    // Duna (1984) vs Duna (2021) -> Iguais -> Novo Primeiro
    // Senhor dos Anéis (2001) vs Guerra dos Rohirrim (2024) -> Diferentes -> Antigo Primeiro
    if (titleA === titleB && diff > 10) {
        return yearB - yearA; // Descendente (Novo -> Antigo)
    }

    // Padrão Sequencial (LOTR, Harry Potter)
    return yearA - yearB; // Ascendente (Antigo -> Novo)
};

const sortRecent = (a, b) => (b.year || 0) - (a.year || 0);

const dynamicSort = (buckets) => {
    // Ordena internamente
    buckets.livro.sort(sortBooks);
    buckets.filme.sort(sortMovies);
    buckets.jogo.sort(sortRecent);
    buckets.album.sort(sortRecent);

    // Regra dos 4 Anos (Livro vs Filme)
    const startBook = buckets.livro[0]?.year || 9999;
    const startMovie = buckets.filme[0]?.year || 9999;

    let sorted = [];
    if (startBook <= startMovie - 4) {
        sorted = [...buckets.livro, ...buckets.filme];
    } else {
        sorted = [...buckets.filme, ...buckets.livro];
    }

    return [...sorted, ...buckets.jogo, ...buckets.album];
};

// ==============================================================================
// 5. EXTRAÇÃO
// ==============================================================================

const safeSearch = async (query, lang) => {
    try {
        const res = await searchEntities({ query, language: lang, limit: 40 });
        if (res && (Array.isArray(res) || Array.isArray(res.search))) return res;
        return await searchEntities(query, lang, 40);
    } catch (e) { return []; }
};

const normalizeSearchResults = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.search)) return res.search;
    return [];
};

const getClaimIds = (e, p) => (e.claims?.[p] || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
const getClaimString = (e, p) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value || null;
const getYear = (e) => {
    const time = e.claims?.[WD_CLAIMS.publicationDate]?.[0]?.mainsnak?.datavalue?.value?.time
    || e.claims?.[WD_CLAIMS.inception]?.[0]?.mainsnak?.datavalue?.value?.time;
    return time ? parseInt(String(time).match(/[+-](\d{4})/)?.[1] || 0) : null;
};

const inferType = (entity) => {
    if (getClaimString(entity, WD_CLAIMS.tmdbMovieId)) return 'filme';
    if (getClaimString(entity, WD_CLAIMS.openLibraryId)) return 'livro';

    const ids = new Set([...getClaimIds(entity, WD_CLAIMS.instanceOf), ...getClaimIds(entity, WD_CLAIMS.subclassOf)]);
    for (const id of ids) if (BLOCKLIST_TYPES.has(id)) return null;

    for (const id of ids) {
        if (TYPE_DEFINITIONS.livro.includes(id)) return 'livro';
        if (TYPE_DEFINITIONS.filme.includes(id)) return 'filme';
        if (TYPE_DEFINITIONS.jogo.includes(id)) return 'jogo';
        if (TYPE_DEFINITIONS.album.includes(id)) return 'album';
    }
    return 'outros';
};

const getDisplayTitle = (e, uiLang) => {
    const t = uiLang.toLowerCase().startsWith('pt') ? ['pt-br', 'pt', 'en', 'es'] : ['en', 'pt-br', 'es'];
    for (const l of t) if (e.labels?.[l]?.value) return cleanTitleForUi(e.labels[l].value);
    return cleanTitleForUi(e.labels?.en?.value || 'Sem Título');
};

// ==============================================================================
// 6. FUNÇÃO PRINCIPAL
// ==============================================================================

export const searchUnifiedMedia = async ({ query, uiLang = 'PT', limit = 25 }) => {
    const qRaw = String(query || '').trim();
    if (qRaw.length < 2) return [];
    const qNorm = normalizeTitle(qRaw);

    // --- 1. CACHE DB ---
    const localIds = await dbFetchAliasPool({ queryNormalized: qNorm, pool: 50 });
    let items = [];
    let usedApi = false;

    if (localIds.length >= 4) {
        items = await fetchFromDb(localIds, uiLang);
    } else {
        // --- 2. API ---
        usedApi = true;
        const wdLang = uiLang.toLowerCase().startsWith('pt') ? 'pt-br' : 'en';

        let rawResults = normalizeSearchResults(await safeSearch(qRaw, wdLang));
        if (rawResults.length === 0 && wdLang !== 'en') {
            const fallback = normalizeSearchResults(await safeSearch(qRaw, 'en'));
            rawResults = [...fallback];
        }

        let qidsToFetch = Array.from(new Set(rawResults.map(r => r.id || r.qid).filter(isQid))).slice(0, 60);

        if (qidsToFetch.length > 0) {
            const details1 = await getEntities({ qids: qidsToFetch, languages: ['pt-br', 'en', 'es'], props: ['labels', 'claims'] });
            let entities = details1.entities || details1 || {};

            const partsToFetch = new Set();
            const parentIds = new Set();
            for (const qid of qidsToFetch) {
                const ent = entities[qid];
                if (!ent) continue;
                const parts = getClaimIds(ent, WD_CLAIMS.hasPart);
                if (parts.length > 0) {
                    parentIds.add(qid);
                    parts.slice(0, 15).forEach(p => partsToFetch.add(p));
                }
            }
            if (partsToFetch.size > 0) {
                const newIds = Array.from(partsToFetch).filter(id => !entities[id]);
                if (newIds.length > 0) {
                    const detailsParts = await getEntities({ qids: newIds, languages: ['pt-br', 'en', 'es'], props: ['labels', 'claims'] });
                    entities = { ...entities, ...(detailsParts.entities || detailsParts || {}) };
                    qidsToFetch = [...qidsToFetch, ...newIds];
                }
            }

            const currentYear = new Date().getFullYear();

            for (const qid of qidsToFetch) {
                const ent = entities[qid];
                if (!ent) continue;

                const type = inferType(ent);
                if (!type || type === 'outros') continue;

                const year = getYear(ent);
                const title = getDisplayTitle(ent, uiLang);

                // --- FILTROS RÍGIDOS ---
                // Remove Pai se for livro
                if (parentIds.has(qid) && type === 'livro') continue;
                // Remove Títulos Ruins
                if (BAD_TITLES.some(bad => title.toLowerCase().includes(bad))) continue;
                if (TITLE_NOISE_REGEX.test(title)) continue;
                // Remove Futuro
                if (year && year >= 2026) continue;

                // Remove SEM ANO para Livros e Filmes (Limpa Dunal, Macedonski e Nárnia lixo)
                if ((type === 'filme' || type === 'livro') && !year) continue;

                // Remove Lixo Antigo
                if (year && year < 1900 && type !== 'livro') continue;

                // Remove Filmes sem TMDB se forem recentes (especulação)
                const tmdb = getClaimString(ent, WD_CLAIMS.tmdbMovieId);
                if (type === 'filme' && year >= currentYear && !tmdb) continue;

                const ordinal = parseFloat(getClaimString(ent, WD_CLAIMS.seriesOrdinal)) || null;
                const score = normalizeTitle(title) === qNorm ? 100 : 50;

                items.push({ id: qid, type, title, year, ordinal, score, tmdb, rawEntity: ent });
            }
        }
    }

    const seenMap = new Map();
    items.forEach(item => {
        const key = `${item.type}|${item.year}|${normalizeTitle(item.title)}`;
        const existing = seenMap.get(key);
        if (!existing || (!existing.tmdb && item.tmdb)) seenMap.set(key, item);
    });

        const buckets = { livro: [], filme: [], jogo: [], album: [] };
        Array.from(seenMap.values()).forEach(item => {
            if (buckets[item.type]) buckets[item.type].push(item);
        });

            // Ordenação e Montagem Dinâmica
            const finalSorted = dynamicSort(buckets);

            if (usedApi) saveToDbBackground(finalSorted);

            return finalSorted.slice(0, limit).map(i => ({
                id: i.id, type: i.type, title: i.title, year: i.year, poster: null
            }));
};
