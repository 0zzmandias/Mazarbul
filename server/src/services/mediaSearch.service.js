import prisma from '../lib/prisma.js';
import { createHash } from 'crypto';
import {
    searchEntities,
    getEntities,
    isQid
} from '../utils/wikidata.adapter.js';

// ==============================================================================
// 1. CONFIGURAÇÕES E DEFINIÇÕES (REGRAS DE NEGÓCIO)
// ==============================================================================

/**
 * Mapeamento de QIDs da Wikidata para os tipos internos do Mazarbul.
 * Cada categoria agrupa identificadores de 'instance of' ou 'subclass of'.
 */
const TYPE_DEFINITIONS = {
    livro: [
        'Q571',      // livro
        'Q7725634',  // obra literária
        'Q47461344', // edição escrita
        'Q8261',     // romance
        'Q277759',   // série de livros
        'Q190192',   // antologia
        'Q334335'    // trilogia
    ],
    filme: [
        'Q11424',    // filme
        'Q229390',   // longa-metragem
        'Q506240'    // filme de televisão
    ],
    jogo: [
        'Q7889',      // videogame
        'Q115621596', // série de videogames
        'Q7058673'    // franquia de mídia
    ],
    album: [
        'Q482994',   // álbum musical
        'Q208569'    // álbum de estúdio
    ]
};

/**
 * Entidades que são apenas conceitos ou categorias de franquia.
 * Devem ser filtradas para manter a unicidade da obra individual.
 */
const BLOCKLIST_TYPES = new Set([
    'Q24856',   // série de filmes
    'Q196600',  // saga
    'Q32906',   // franquia de mídia
    'Q5398426'  // série de televisão (por enquanto)
]);

/**
 * Propriedades canônicas da Wikidata utilizadas no sistema.
 */
const WD_CLAIMS = {
    instanceOf: 'P31',
    subclassOf: 'P279',
    basedOn: 'P144',
    publicationDate: 'P577',
        inception: 'P571',
        seriesOrdinal: 'P1545',
        tmdbMovieId: 'P4947',
        rawgGameId: 'P9968',
        openLibraryId: 'P648',
        hasPart: 'P527', // Crucial para expandir "Senhor dos Anéis" em livros
        partOf: 'P361'   // Parte de (Franquia/Série)
};

/**
 * Regex para filtrar resultados irrelevantes (ruído).
 */
const TITLE_NOISE_REGEX = /\b(making of|bastidores|documentári|documentary|comemoração|celebration|concert|live in|entrevista|interview|tour|soundtrack|trilha sonora|anniversary|special|especial|de volta a|return to)\b/i;

/**
 * Títulos genéricos que devem ser descartados.
 */
const BAD_TITLES = [
    'sem título',
'untitled',
'sem titulo',
'unnamed',
'episódio',
'episode'
];

// ==============================================================================
// 2. HELPERS DE NORMALIZAÇÃO E LIMPEZA
// ==============================================================================

/**
 * Normaliza títulos para comparação (remove acentos, caixa baixa, símbolos).
 */
const normalizeTitle = (value) =>
String(value ?? '')
.normalize('NFKD')
.replace(/[\u0300-\u036f]/g, '')
.toLowerCase()
.replace(/['"`´’]/g, '')
.replace(/[^a-z0-9]+/g, ' ')
.trim();

/**
 * Limpa títulos vindos da Wikidata (remove anos entre parênteses, etc).
 */
const cleanTitleForUi = (value) => {
    const s = String(value || '').replace(/_/g, ' ').trim();
    if (!s) return null;
    const m = s.match(/^(.*)\s+\(([^)]+)\)\s*$/);
    return m ? m[1].trim() : s;
};

// ==============================================================================
// 3. PERSISTÊNCIA E CACHE (LOCAL DATABASE)
// ==============================================================================

/**
 * Busca IDs canônicos no banco de dados local com base no título normalizado.
 * Utilizado como primeira camada de cache para velocidade.
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
    } catch (error) {
        console.error('[DB Cache] Erro ao buscar aliases:', error);
        return [];
    }
};

/**
 * Converte IDs do banco em objetos de resultado enriquecidos.
 */
const fetchFromDb = async (ids, uiLang) => {
    try {
        const refs = await prisma.mediaReference.findMany({
            where: { id: { in: ids } }
        });
        const safeUiLang = uiLang.toLowerCase().startsWith('pt') ? 'PT' : uiLang.toUpperCase();

        return refs.map(ref => ({
            id: ref.id,
            type: ref.type,
            title: ref.titles?.[safeUiLang] || ref.titles?.PT || ref.titles?.EN || ref.titles?.DEFAULT,
            year: ref.releaseYear,
            posterUrl: ref.posterUrl,
            ordinal: ref.details?.technical?.seriesOrdinal,
            tmdb: ref.externalIds?.tmdb,
            score: 100 // Itens do banco já passaram por validação anterior
        }));
    } catch (error) {
        console.error('[DB Cache] Erro ao buscar referências:', error);
        return [];
    }
};

/**
 * Salva resultados da API no banco em background como Stubs (Rascunhos).
 * Garante que a próxima busca seja instantânea.
 */
const saveToDbBackground = (items) => {
    setTimeout(async () => {
        for (const item of items) {
            try {
                if (!item.rawEntity) continue;

                const tech = {
                    qid: item.id,
                    type: item.type,
                    year: item.year,
                    seriesOrdinal: item.ordinal
                };

                const titles = {
                    PT: item.title,
                    EN: item.title,
                    ES: item.title,
                    DEFAULT: item.title
                };

                // 1. Salva a Referência principal
                await prisma.mediaReference.upsert({
                    where: { id: item.id },
                    create: {
                        id: item.id,
                        type: item.type,
                        titles,
                        releaseYear: item.year,
                        externalIds: { tmdb: item.tmdb },
                        details: { technical: tech },
                        isStub: true,
                        synopses: {},
                        tags: []
                    },
                    update: { lastAccessedAt: new Date() }
                });

                // 2. Salva o Alias para busca por texto posterior
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
            } catch (e) {
                // Erro silencioso em background
            }
        }
    }, 100);
};

// ==============================================================================
// 4. LÓGICA DE ORDENAÇÃO DINÂMICA
// ==============================================================================

const sortBooks = (a, b) => {
    if (a.ordinal && b.ordinal) return a.ordinal - b.ordinal;
    return (a.year || 9999) - (b.year || 9999);
};

const sortMovies = (a, b) => {
    if (a.ordinal && b.ordinal) return a.ordinal - b.ordinal;
    return (a.year || 0) - (b.year || 0);
};

const sortRecent = (a, b) => (b.year || 0) - (a.year || 0);

/**
 * Organiza os buckets de mídia por ordem de prioridade definida no plano.
 */
const dynamicSort = (buckets) => {
    buckets.livro.sort(sortBooks);
    buckets.filme.sort(sortMovies);
    buckets.jogo.sort(sortRecent);
    buckets.album.sort(sortRecent);

    const startBook = buckets.livro[0]?.year || 9999;
    const startMovie = buckets.filme[0]?.year || 9999;

    let sorted = [];
    // Regra: Se os livros começaram antes dos filmes (como em LOTR), livros vêm antes.
    if (startBook <= startMovie - 4) {
        sorted = [...buckets.livro, ...buckets.filme];
    } else {
        sorted = [...buckets.filme, ...buckets.livro];
    }

    return [...sorted, ...buckets.jogo, ...buckets.album];
};

// ==============================================================================
// 5. AUXILIARES DE EXTRAÇÃO WIKIDATA (IDENTIDADE CANÔNICA)
// ==============================================================================

const safeSearch = async (query, lang) => {
    try {
        const res = await searchEntities({ query, language: lang, limit: 40 });
        if (!res) return [];
        return Array.isArray(res) ? res : (res.search || []);
    } catch (e) { return []; }
};

const normalizeSearchResults = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.search)) return res.search;
    return [];
};

const getClaimIds = (e, p) => {
    const claims = e.claims?.[p] || [];
    return claims.map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
};

const getClaimString = (e, p) => {
    return e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value || null;
};

const getYear = (e) => {
    const time = e.claims?.[WD_CLAIMS.publicationDate]?.[0]?.mainsnak?.datavalue?.value?.time
    || e.claims?.[WD_CLAIMS.inception]?.[0]?.mainsnak?.datavalue?.value?.time;
    return time ? parseInt(String(time).match(/[+-](\d{4})/)?.[1] || 0) : null;
};

/**
 * Infere o tipo de mídia Mazarbul com base em Claims da Wikidata.
 */
const inferType = (entity) => {
    // Prioridade por IDs externos conhecidos
    if (getClaimString(entity, WD_CLAIMS.tmdbMovieId)) return 'filme';
    if (getClaimString(entity, WD_CLAIMS.openLibraryId)) return 'livro';

    const ids = new Set([
        ...getClaimIds(entity, WD_CLAIMS.instanceOf),
                        ...getClaimIds(entity, WD_CLAIMS.subclassOf)
    ]);

    // Verifica se é uma franquia ou série bloqueada
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
    // Priorização rigorosa de Português Brasileiro (pt-br)
    const t = uiLang.toLowerCase().startsWith('pt') ? ['pt-br', 'pt', 'en', 'es'] : ['en', 'pt-br', 'es'];
    for (const l of t) if (e.labels?.[l]?.value) return cleanTitleForUi(e.labels[l].value);
    return cleanTitleForUi(e.labels?.en?.value || 'Sem Título');
};

// ==============================================================================
// 6. FUNÇÃO PRINCIPAL: BUSCA UNIFICADA (HÍBRIDA)
// ==============================================================================

/**
 * Realiza a busca unificada de mídia, gerenciando cache local e expansão via Wikidata.
 * @param {string} query - O termo de busca.
 * @param {string} uiLang - O idioma da interface (PT, EN, ES).
 * @param {number} limit - Limite de resultados.
 * @param {string|null} type - Filtro de tipo opcional (filme, livro, jogo, album).
 */
export const searchUnifiedMedia = async ({ query, uiLang = 'PT', limit = 25, type = null }) => {
    const qRaw = String(query || '').trim();
    if (qRaw.length < 2) return [];

    // Normalização usada apenas para cache e comparação
    const qNorm = normalizeTitle(qRaw);

    // USAMOS UM MAP PARA COLETAR TUDO E GARANTIR UNICIDADE ABSOLUTA PELO QID
    // Resolve o erro "Encountered two children with the same key" no Frontend
    const collectorMap = new Map();

    // --- 1. BUSCA LOCAL (CAMADA 1: CACHE DB) ---
    const localIds = await dbFetchAliasPool({ queryNormalized: qNorm, pool: 50 });
    if (localIds.length > 0) {
        const localItems = await fetchFromDb(localIds, uiLang);
        localItems.forEach(item => {
            // Respeita o filtro de tipo solicitado pelo componente de busca
            if (!type || type === 'all' || item.type === type) {
                collectorMap.set(item.id, item);
            }
        });
    }

    // --- 2. BUSCA NA WIKIDATA (CAMADA 2: API) ---
    // Se o banco retornou poucos resultados, ou para buscas novas, consultamos a API
    let usedApi = false;
    if (collectorMap.size < 15) {
        usedApi = true;

        // Busca na API usando o termo bruto (resiliente a acentos)
        let apiResults = normalizeSearchResults(await safeSearch(qRaw, 'pt-br'));
        if (apiResults.length === 0) {
            apiResults = normalizeSearchResults(await safeSearch(qRaw, 'en'));
        }

        let qidsToFetch = Array.from(new Set(apiResults.map(r => r.id || r.qid))).filter(isQid);

        if (qidsToFetch.length > 0) {
            // Coleta de detalhes das mídias encontradas
            const entitiesMap = await getEntities({
                qids: qidsToFetch,
                languages: ['pt-br', 'pt', 'en', 'es'],
                props: ['labels', 'claims']
            });
            const entities = entitiesMap.entities || entitiesMap || {};

            const partsToFetch = new Set();
            const parentData = new Map(); // Mapa para associar filhos aos pais (Franquias)

            // FASE DE EXPANSÃO: HAS_PART (Propriedade P527)
            // Resolve: Busca "Senhor dos Anéis" -> Retorna os 3 livros individuais.
            for (const qid of qidsToFetch) {
                const ent = entities[qid];
                if (!ent) continue;

                const parts = getClaimIds(ent, WD_CLAIMS.hasPart);
                if (parts.length > 0) {
                    const parentTitle = getDisplayTitle(ent, uiLang);
                    parentData.set(qid, parentTitle); // Marca o ID como um Pai

                    // Adicionamos as partes (filhos) para serem buscados detalhadamente
                    parts.slice(0, 15).forEach(p => {
                        partsToFetch.add(p);
                        // Associa o título do pai ao filho para composição posterior
                        if (!parentData.has(p)) parentData.set(p, parentTitle);
                    });
                }
            }

            // Busca detalhes das partes (filhos) expandidas
            if (partsToFetch.size > 0) {
                const newIds = Array.from(partsToFetch).filter(id => !entities[id]);
                if (newIds.length > 0) {
                    const partsDetails = await getEntities({
                        qids: newIds,
                        languages: ['pt-br', 'pt', 'en', 'es'],
                        props: ['labels', 'claims']
                    });
                    Object.assign(entities, partsDetails.entities || partsDetails || {});
                }
                // Unificamos a lista final de IDs a processar
                qidsToFetch = Array.from(new Set([...qidsToFetch, ...partsToFetch]));
            }

            for (const qid of qidsToFetch) {
                const ent = entities[qid];
                // Regra: Se é um Pai (Franquia) e já expandimos os filhos, ignoramos o Pai.
                // Isso garante a unicidade da obra conforme o plano.
                if (!ent || (parentData.has(qid) && !partsToFetch.has(qid))) continue;

                const mediaType = inferType(ent);

                // Filtro de tipo via backend para economizar processamento no frontend
                if (!mediaType || mediaType === 'outros' || (type && type !== 'all' && mediaType !== type)) {
                    continue;
                }

                let title = getDisplayTitle(ent, uiLang);
                const parentTitle = parentData.get(qid);

                /**
                 * LÓGICA DE TÍTULO COMPOSTO:
                 * Se o item for filho de uma série, garantimos que o nome da série esteja no título.
                 * Isso resolve: Busca "Sociedade do Anel" retornando nada no Frontend por score baixo.
                 */
                if (parentTitle && !title.toLowerCase().includes(parentTitle.toLowerCase())) {
                    title = `${parentTitle}: ${title}`;
                }

                // Filtros de qualidade
                if (BAD_TITLES.some(bad => title.toLowerCase().includes(bad)) || TITLE_NOISE_REGEX.test(title)) {
                    continue;
                }

                const year = getYear(ent);
                const currentYear = new Date().getFullYear();
                if (year && year > currentYear + 1) continue;
                if ((mediaType === 'filme' || mediaType === 'livro') && !year) continue;

                const tmdb = getClaimString(ent, WD_CLAIMS.tmdbMovieId);
                const ordinal = parseFloat(getClaimString(ent, WD_CLAIMS.seriesOrdinal)) || null;

                // Armazenamento no Map (Garantia de Unicidade)
                // Se já existir, mantemos a versão do banco se ela tiver posterUrl
                if (!collectorMap.has(qid) || !collectorMap.get(qid).posterUrl) {
                    collectorMap.set(qid, {
                        id: qid,
                        type: mediaType,
                        title,
                        year,
                        ordinal,
                        tmdb,
                        posterUrl: collectorMap.get(qid)?.posterUrl || null,
                                     rawEntity: ent
                    });
                }
            }
        }
    }

    // --- 3. DEDUPLICAÇÃO E ORGANIZAÇÃO FINAL ---
    const dedupedList = Array.from(collectorMap.values());

    // Organização em Buckets para a ordenação dinâmica
    const buckets = { livro: [], filme: [], jogo: [], album: [] };
    dedupedList.forEach(item => {
        if (buckets[item.type]) buckets[item.type].push(item);
    });

        const finalSorted = dynamicSort(buckets);

        // Persistência assíncrona para cache local
        if (usedApi) saveToDbBackground(finalSorted);

        // Mapeamento final para o Frontend
        return finalSorted.slice(0, limit).map(i => ({
            id: i.id,
            type: i.type,
            title: i.title,
            year: i.year,
            poster: i.posterUrl
        }));
};
