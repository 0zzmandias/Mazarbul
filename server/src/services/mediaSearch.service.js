import prisma from '../lib/prisma.js';
import { createHash } from 'crypto';
import { searchEntities, getEntities, isQid } from '../utils/wikidata.adapter.js';

/**
 * MEDIA SEARCH SERVICE
 * * Este serviço implementa a busca híbrida (Cache-Aside):
 * 1. Procura no banco de dados local (MediaAlias/MediaReference).
 * 2. Se não encontrar resultados suficientes, consulta a Wikidata.
 * 3. Filtra ruídos e ordena os resultados (Filmes/Livros/Jogos/Álbuns).
 */

// ==============================================================================
// 1. CONFIGURAÇÕES E DEFINIÇÕES
// ==============================================================================

const TYPE_DEFINITIONS = {
    livro: ['Q571', 'Q7725634', 'Q47461344', 'Q8261', 'Q277759', 'Q190192', 'Q334335'],
    filme: ['Q11424', 'Q229390', 'Q506240'],
    jogo: ['Q7889', 'Q115621596', 'Q7058673'],
    album: ['Q482994', 'Q208569']
};

const BLOCKLIST_TYPES = new Set(['Q24856', 'Q196600', 'Q32906', 'Q5398426']);

const WD_CLAIMS = {
    instanceOf: 'P31',
    subclassOf: 'P279',
    publicationDate: 'P577',
        inception: 'P571',
        seriesOrdinal: 'P1545',
        tmdbMovieId: 'P4947',
        rawgGameId: 'P9968',
        openLibraryId: 'P648',
        hasPart: 'P527',
        partOf: 'P361'
};

const TITLE_NOISE_REGEX = /\b(making of|bastidores|documentári|documentary|comemoração|celebration|concert|live in|entrevista|interview|tour|soundtrack|trilha sonora|anniversary|special|especial|de volta a|return to)\b/i;
const BAD_TITLES = ['sem título', 'untitled', 'sem titulo', 'unnamed', 'episódio'];

// ==============================================================================
// 2. HELPERS DE NORMALIZAÇÃO E LIMPEZA
// ==============================================================================

const normalizeTitle = (value) =>
String(value ?? '')
.normalize('NFKD')
.replace(/[\u0300-\u036f]/g, '')
.toLowerCase()
.replace(/['"`´’]/g, '')
.replace(/[^a-z0-9]+/g, ' ')
.trim();

const cleanTitleForUi = (value) => {
    const s = String(value || '').replace(/_/g, ' ').trim();
    if (!s) return null;
    const m = s.match(/^(.*)\s+\(([^)]+)\)\s*$/);
    return m ? m[1].trim() : s;
};

// ==============================================================================
// 3. PERSISTÊNCIA E CACHE (BANCO DE DADOS)
// ==============================================================================

/**
 * Busca IDs de mídias conhecidas no banco local através de apelidos (aliases).
 */
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

/**
 * Busca os objetos completos de mídia do banco para exibir na busca.
 * Ajustado para incluir o posterUrl conforme o plano.
 */
const fetchFromDb = async (ids, uiLang) => {
    try {
        const refs = await prisma.mediaReference.findMany({
            where: { id: { in: ids } }
        });
        return refs.map(ref => ({
            id: ref.id,
            type: ref.type,
            title: ref.titles?.[uiLang] || ref.titles?.PT || ref.titles?.EN || ref.titles?.DEFAULT,
            year: ref.releaseYear,
            posterUrl: ref.posterUrl, // Agora traz o poster se já existir no banco
            ordinal: ref.details?.technical?.seriesOrdinal,
            tmdb: ref.externalIds?.tmdb,
            score: 100 // Resultados do banco têm prioridade máxima
        }));
    } catch { return []; }
};

/**
 * Salva resultados da Wikidata como "stubs" (rascunhos) para buscas futuras.
 */
const saveToDbBackground = (items) => {
    setTimeout(async () => {
        for (const item of items) {
            try {
                if (!item.rawEntity) continue;
                const tech = { qid: item.id, type: item.type, year: item.year, seriesOrdinal: item.ordinal };
                const titles = { PT: item.title, EN: item.title, DEFAULT: item.title };

                await prisma.mediaReference.upsert({
                    where: { id: item.id },
                    create: {
                        id: item.id,
                        type: item.type,
                        titles,
                        releaseYear: item.year,
                        externalIds: { tmdb: item.tmdb },
                        details: { technical: tech },
                        isStub: true, // Marcado como stub até ser hidratado (clicado)
                synopses: {},
                tags: []
                    },
                    update: { lastAccessedAt: new Date() }
                });

                const seed = `${item.id}|${normalizeTitle(item.title)}`;
                const hash = createHash('sha1').update(seed).digest('hex');
                await prisma.mediaAlias.upsert({
                    where: { id: `ma_${hash}` },
                    create: {
                        id: `ma_${hash}`,
                        canonicalId: item.id,
                        type: item.type,
                        lang: 'PT',
                        title: item.title,
                        titleNormalized: normalizeTitle(item.title),
                                               source: 'wikidata',
                                               lastAccessedAt: new Date()
                    },
                    update: { lastAccessedAt: new Date() }
                });
            } catch (e) {}
        }
    }, 100);
};

// ==============================================================================
// 4. LÓGICA DE ORDENAÇÃO (FILMES E LIVROS)
// ==============================================================================

const sortMovies = (a, b) => {
    if (a.ordinal && b.ordinal) return a.ordinal - b.ordinal;

    const yearA = a.year || 0;
    const yearB = b.year || 0;
    const diff = Math.abs(yearA - yearB);

    const titleA = normalizeTitle(a.title);
    const titleB = normalizeTitle(b.title);

    // Se forem remakes (mesmo nome, longo intervalo), mostra o mais novo primeiro
    if (titleA === titleB && diff > 10) {
        return yearB - yearA;
    }

    // Cronologia padrão (LOTR, Star Wars etc)
    return yearA - yearB;
};

const sortRecent = (a, b) => (b.year || 0) - (a.year || 0);

const dynamicSort = (buckets) => {
    buckets.filme.sort(sortMovies);
    buckets.livro.sort((a,b) => (a.ordinal && b.ordinal) ? a.ordinal - b.ordinal : (a.year || 0) - (b.year || 0));
    buckets.jogo.sort(sortRecent);
    buckets.album.sort(sortRecent);

    // Prioridade visual: Livros antes de filmes se houver um gap histórico (Regra dos 4 anos)
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
// 5. EXTRAÇÃO E INFERÊNCIA (WIKIDATA)
// ==============================================================================

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
    const langs = uiLang.toLowerCase().startsWith('pt') ? ['pt-br', 'pt', 'en', 'es'] : ['en', 'pt-br', 'es'];
    for (const l of langs) if (e.labels?.[l]?.value) return cleanTitleForUi(e.labels[l].value);
    return cleanTitleForUi(e.labels?.en?.value || 'Sem Título');
};

// ==============================================================================
// 6. FUNÇÃO PRINCIPAL: BUSCA UNIFICADA
// ==============================================================================

export const searchUnifiedMedia = async ({ query, uiLang = 'PT', limit = 25, type = null }) => {
    const qRaw = String(query || '').trim();
    if (qRaw.length < 2) return [];
    const qNorm = normalizeTitle(qRaw);

    // --- 1. CONSULTA AO BANCO (CACHE) ---
    const localIds = await dbFetchAliasPool({ queryNormalized: qNorm, pool: 50 });
    let items = [];
    let usedApi = false;

    // Se já temos bastantes resultados no banco, usamos eles (suprindo a base)
    if (localIds.length >= 5) {
        items = await fetchFromDb(localIds, uiLang);
    } else {
        // --- 2. CONSULTA EXTERNA (WIKIDATA) ---
        usedApi = true;
        const wdLang = uiLang.toLowerCase().startsWith('pt') ? 'pt-br' : 'en';

        // Busca entidades na Wikidata
        let rawResults = [];
        try {
            const res = await searchEntities({ query: qRaw, language: wdLang, limit: 40 });
            rawResults = Array.isArray(res) ? res : (res.search || []);
        } catch (e) { rawResults = []; }

        const qidsToFetch = Array.from(new Set(rawResults.map(r => r.id || r.qid))).filter(isQid).slice(0, 50);

        if (qidsToFetch.length > 0) {
            const details = await getEntities({ qids: qidsToFetch, languages: ['pt-br', 'en', 'es'], props: ['labels', 'claims'] });
            const entities = details.entities || details || {};

            const currentYear = new Date().getFullYear();

            for (const qid of qidsToFetch) {
                const ent = entities[qid];
                if (!ent) continue;

                const mediaType = inferType(ent);
                if (!mediaType || mediaType === 'outros') continue;
                if (type && type !== 'all' && mediaType !== type) continue;

                const year = getYear(ent);
                const title = getDisplayTitle(ent, uiLang);

                // Filtros de qualidade
                if (BAD_TITLES.some(bad => title.toLowerCase().includes(bad))) continue;
                if (TITLE_NOISE_REGEX.test(title)) continue;
                if (year && year > currentYear + 1) continue; // Remove lançamentos muito futuros
                if ((mediaType === 'filme' || mediaType === 'livro') && !year) continue;

                const tmdb = getClaimString(ent, WD_CLAIMS.tmdbMovieId);
                const ordinal = parseFloat(getClaimString(ent, WD_CLAIMS.seriesOrdinal)) || null;

                items.push({
                    id: qid,
                    type: mediaType,
                    title,
                    year,
                    ordinal,
                    tmdb,
                    posterUrl: null, // Wikidata não tem poster, será hidratado depois
                    rawEntity: ent
                });
            }
        }
    }

    // --- 3. DEDUPLICAÇÃO E ORGANIZAÇÃO ---
    const seenMap = new Map();
    items.forEach(item => {
        const key = `${item.type}|${item.year}|${normalizeTitle(item.title)}`;
        const existing = seenMap.get(key);
        // Prioriza o que tem ID externo (TMDB) ou o que já está no banco
        if (!existing || (!existing.tmdb && item.tmdb)) seenMap.set(key, item);
    });

        const buckets = { livro: [], filme: [], jogo: [], album: [] };
        Array.from(seenMap.values()).forEach(item => {
            if (buckets[item.type]) buckets[item.type].push(item);
        });

            const finalSorted = dynamicSort(buckets);

            // Se usamos a API, salvamos os stubs para a próxima busca vir do banco
            if (usedApi) saveToDbBackground(finalSorted);

            // Retorno para o Frontend
            return finalSorted.slice(0, limit).map(i => ({
                id: i.id,
                type: i.type,
                title: i.title,
                year: i.year,
                poster: i.posterUrl // Retorna o poster se o banco já o tiver!
            }));
};
