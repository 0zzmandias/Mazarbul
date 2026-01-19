import axios from 'axios';

const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';

const wikidataClient = axios.create({
    baseURL: WIKIDATA_API_URL,
    timeout: 15000,
    headers: {
        'User-Agent': 'Mazarbul/1.0 (Wikidata integration; no personal data)'
    }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getHttpStatus = (error) => error?.response?.status ?? null;

const requestWithRetry = async (makeRequest, { retries = 2 } = {}) => {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await makeRequest();
        } catch (error) {
            lastError = error;

            const status = getHttpStatus(error);
            const isRetryable = status === 429 || (status != null && status >= 500 && status <= 599);

            if (!isRetryable || attempt === retries) {
                throw error;
            }

            const backoffMs = 250 * Math.pow(2, attempt);
            await sleep(backoffMs);
        }
    }

    throw lastError;
};

/**
 * Normaliza o idioma da UI para o padrão da Wikidata.
 * AJUSTE: Força o pt-br como prioridade absoluta para evitar nomes de Portugal.
 */
export const normalizeUiLangToWikidataLang = (lang) => {
    if (!lang) return 'pt-br';

    const normalized = String(lang).trim().toLowerCase();

    // No Mazarbul, se for português, queremos explicitamente o Brasileiro (pt-br)
    if (normalized.startsWith('pt')) return 'pt-br';
    if (normalized.startsWith('en')) return 'en';
    if (normalized.startsWith('es')) return 'es';

    return 'pt-br';
};

export const isQid = (value) => /^Q\d+$/.test(String(value ?? '').trim());

export const WD_PROPS = {
    INSTANCE_OF: 'P31',
    GENRE: 'P136',
    SUBCLASS_OF: 'P279',
    PUBLICATION_DATE: 'P577',
    COUNTRY_OF_ORIGIN: 'P495',
    ISO3166_ALPHA2: 'P297',

    DIRECTOR: 'P57',
    AUTHOR: 'P50',
    DEVELOPER: 'P178',
    PUBLISHER: 'P123',
    PERFORMER: 'P175',
    CREATOR_GENERIC: 'P170',

    TMDB_MOVIE_ID: 'P4947',
    RAWG_GAME_ID: 'P9968',
    OPEN_LIBRARY_ID: 'P648',
    MUSICBRAINZ_RELEASE_GROUP_ID: 'P436',

    // Propriedades para expansão de séries e franquias
    HAS_PART: 'P527',
    PART_OF: 'P361'
};

export const PRIMARY_CREATOR_PROPS_BY_TYPE = {
    filme: [WD_PROPS.DIRECTOR, WD_PROPS.CREATOR_GENERIC],
    livro: [WD_PROPS.AUTHOR, WD_PROPS.CREATOR_GENERIC],
    jogo: [WD_PROPS.DEVELOPER, WD_PROPS.PUBLISHER, WD_PROPS.CREATOR_GENERIC],
    album: [WD_PROPS.PERFORMER, WD_PROPS.CREATOR_GENERIC]
};

export const makeWikidataCache = () => ({
    entities: new Map(),
                                        countryIso2: new Map(),
                                        labels: new Map()
});

const getClaimArray = (entity, prop) => {
    const claims = entity?.claims ?? null;
    if (!claims) return [];
    const arr = claims[prop];
    return Array.isArray(arr) ? arr : [];
};

const getDatavalue = (claim) => claim?.mainsnak?.datavalue ?? null;

const getDatavalueType = (dv) => dv?.type ?? null;

const getDatavalueValue = (dv) => dv?.value ?? null;

const getEntityIdFromDatavalue = (dv) => {
    if (!dv) return null;
    if (getDatavalueType(dv) !== 'wikibase-entityid') return null;

    const v = getDatavalueValue(dv);
    const id = v?.id ?? null;
    return isQid(id) ? id : null;
};

const getStringFromDatavalue = (dv) => {
    if (!dv) return null;
    const v = getDatavalueValue(dv);

    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);

    return null;
};

const getTimeFromDatavalue = (dv) => {
    if (!dv) return null;
    if (getDatavalueType(dv) !== 'time') return null;
    const v = getDatavalueValue(dv);
    return v?.time ?? null;
};

export const parseWikidataTimeToYear = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return null;

    const match = timeString.match(/^([+-]?\d{1,})-/);
    if (!match) return null;

    const yearNum = Number(match[1]);
    if (!Number.isFinite(yearNum)) return null;

    return yearNum;
};

const uniq = (arr) => Array.from(new Set(arr));

const pickBestLabel = (labelsObj, langOrder = ['pt-br', 'pt', 'en', 'es']) => {
    const labels = labelsObj ?? {};
    for (const lang of langOrder) {
        const v = labels?.[lang]?.value;
        if (v && String(v).trim()) return String(v);
    }

    const firstKey = Object.keys(labels)[0];
    const any = firstKey ? labels?.[firstKey]?.value : null;
    return any && String(any).trim() ? String(any) : null;
};

export const getTitlesPTENES = (entity) => {
    const labels = entity?.labels ?? {};
    // AJUSTE: Prioriza pt-br para garantir que "Sociedade do Anel" apareça no lugar de "Irmandade"
    const pt = labels?.['pt-br']?.value || labels?.pt?.value || null;
    const en = labels?.en?.value ?? null;
    const es = labels?.es?.value ?? null;

    return {
        PT: pt,
        EN: en,
        ES: es
    };
};

const getEntityCached = async ({ qid, languages, props, cache }) => {
    const key = String(qid ?? '').trim();
    if (!isQid(key)) return null;

    if (cache?.entities?.has(key)) {
        return cache.entities.get(key) ?? null;
    }

    const entity = await getEntity({ qid: key, languages, props });
    if (cache?.entities) cache.entities.set(key, entity ?? null);
    return entity ?? null;
};

export const searchEntities = async ({ query, language = 'pt-br', limit = 10 }) => {
    if (!query || !String(query).trim()) {
        return [];
    }

    const lang = normalizeUiLangToWikidataLang(language);

    const response = await requestWithRetry(() =>
    wikidataClient.get('', {
        params: {
            action: 'wbsearchentities',
            format: 'json',
                type: 'item',
                search: String(query),
                       language: lang,
                       uselang: lang,
                       limit
        }
    })
    );

    const results = response?.data?.search ?? [];

    return results
    .filter((r) => isQid(r?.id))
    .map((r) => ({
        qid: r.id,
        label: r.label ?? null,
        description: r.description ?? null,
        conceptUri: r.concepturi ?? null
    }));
};

export const getEntities = async ({
    qids,
    languages = ['pt-br', 'pt', 'en', 'es'],
    props = ['labels', 'aliases', 'descriptions', 'claims']
}) => {
    const ids = Array.isArray(qids) ? qids : [qids];
    const cleanIds = ids.map((id) => String(id ?? '').trim()).filter((id) => isQid(id));

    if (cleanIds.length === 0) {
        return {};
    }

    const langs = Array.isArray(languages) ? languages : [languages];
    const cleanLangs = langs.map(normalizeUiLangToWikidataLang);

    const response = await requestWithRetry(() =>
    wikidataClient.get('', {
        params: {
            action: 'wbgetentities',
            format: 'json',
                ids: cleanIds.join('|'),
                       languages: cleanLangs.join('|'),
                       props: props.join('|')
        }
    })
    );

    return response?.data?.entities ?? {};
};

export const getEntity = async ({
    qid,
    languages = ['pt-br', 'pt', 'en', 'es'],
    props = ['labels', 'aliases', 'descriptions', 'claims']
}) => {
    const entities = await getEntities({ qids: [qid], languages, props });
    return entities?.[qid] ?? null;
};

export const extractTechnicalClaims = ({ entity, type }) => {
    const instanceOfQids = getClaimArray(entity, WD_PROPS.INSTANCE_OF)
    .map(getDatavalue)
    .map(getEntityIdFromDatavalue)
    .filter(Boolean);

    const genreQids = getClaimArray(entity, WD_PROPS.GENRE)
    .map(getDatavalue)
    .map(getEntityIdFromDatavalue)
    .filter(Boolean);

    const countryQids = getClaimArray(entity, WD_PROPS.COUNTRY_OF_ORIGIN)
    .map(getDatavalue)
    .map(getEntityIdFromDatavalue)
    .filter(Boolean);

    const timeYears = getClaimArray(entity, WD_PROPS.PUBLICATION_DATE)
    .map(getDatavalue)
    .map(getTimeFromDatavalue)
    .map(parseWikidataTimeToYear)
    .filter((y) => typeof y === 'number' && Number.isFinite(y));

    const year = timeYears.length > 0 ? Math.min(...timeYears) : null;

    const creatorProps = PRIMARY_CREATOR_PROPS_BY_TYPE[type] ?? [WD_PROPS.CREATOR_GENERIC];
    const creatorQids = creatorProps.flatMap((prop) =>
    getClaimArray(entity, prop).map(getDatavalue).map(getEntityIdFromDatavalue).filter(Boolean)
    );

    const externalIds = {
        tmdb:
        getClaimArray(entity, WD_PROPS.TMDB_MOVIE_ID)
        .map(getDatavalue)
        .map(getStringFromDatavalue)
        .filter(Boolean)[0] ?? null,
        rawg:
        getClaimArray(entity, WD_PROPS.RAWG_GAME_ID)
        .map(getDatavalue)
        .map(getStringFromDatavalue)
        .filter(Boolean)[0] ?? null,
        openLibrary:
        getClaimArray(entity, WD_PROPS.OPEN_LIBRARY_ID)
        .map(getDatavalue)
        .map(getStringFromDatavalue)
        .filter(Boolean)[0] ?? null,
        musicbrainzReleaseGroup:
        getClaimArray(entity, WD_PROPS.MUSICBRAINZ_RELEASE_GROUP_ID)
        .map(getDatavalue)
        .map(getStringFromDatavalue)
        .filter(Boolean)[0] ?? null
    };

    return {
        qid: entity?.id ?? null,
        instanceOfQids: uniq(instanceOfQids),
        year,
        countryQids: uniq(countryQids),
        genreQids: uniq(genreQids),
        primaryCreatorQids: uniq(creatorQids),
        externalIds
    };
};

export const isBlockedByInstanceOf = ({ instanceOfQids, blockedInstanceOfQids }) => {
    const blocked = Array.isArray(blockedInstanceOfQids) ? blockedInstanceOfQids : [];
    if (blocked.length === 0) return false;

    const set = new Set(blocked.filter(isQid));
    for (const qid of instanceOfQids ?? []) {
        if (set.has(qid)) return true;
    }
    return false;
};

export const getLabelForQid = async ({ qid, uiLang = 'pt-br', cache }) => {
    const lang = normalizeUiLangToWikidataLang(uiLang);
    const cacheKey = `${qid}|${lang}`;

    if (cache?.labels?.has(cacheKey)) {
        return cache.labels.get(cacheKey) ?? null;
    }

    const entity = await getEntityCached({
        qid,
        languages: [lang, 'pt-br', 'en', 'es'],
        props: ['labels'],
        cache
    });

    const label = pickBestLabel(entity?.labels, [lang, 'pt-br', 'en', 'es']);
    if (cache?.labels) cache.labels.set(cacheKey, label ?? null);
    return label ?? null;
};

export const getCountryIso2ByCountryQid = async ({ countryQid, uiLang = 'pt-br', cache }) => {
    if (!isQid(countryQid)) return null;

    if (cache?.countryIso2?.has(countryQid)) {
        return cache.countryIso2.get(countryQid) ?? null;
    }

    const entity = await getEntityCached({
        qid: countryQid,
        languages: [normalizeUiLangToWikidataLang(uiLang), 'en'],
                                         props: ['claims'],
                                         cache
    });

    const iso2 =
    getClaimArray(entity, WD_PROPS.ISO3166_ALPHA2).map(getDatavalue).map(getStringFromDatavalue).filter(Boolean)[0] ?? null;

    const clean = iso2 && typeof iso2 === 'string' && iso2.trim() ? iso2.trim().toUpperCase() : null;
    if (cache?.countryIso2) cache.countryIso2.set(countryQid, clean);
    return clean;
};

export const resolveGenreToRoot = async ({
    genreQid,
    genreRootQids,
    maxDepth = 8,
    uiLang = 'pt-br',
    cache
}) => {
    if (!isQid(genreQid)) return null;

    const roots = Array.isArray(genreRootQids) ? genreRootQids.filter(isQid) : [];
    const rootsSet = new Set(roots);

    if (rootsSet.size > 0 && rootsSet.has(genreQid)) {
        return genreQid;
    }

    const visited = new Set([genreQid]);
    let frontier = [genreQid];
    let depth = 0;

    while (frontier.length > 0 && depth < maxDepth) {
        const entities = await getEntities({
            qids: frontier,
            languages: [normalizeUiLangToWikidataLang(uiLang), 'en'],
                                           props: ['claims']
        });

        const next = [];

        for (const current of frontier) {
            const entity = entities?.[current] ?? null;
            const parents = getClaimArray(entity, WD_PROPS.SUBCLASS_OF)
            .map(getDatavalue)
            .map(getEntityIdFromDatavalue)
            .filter(Boolean);

            for (const p of parents) {
                if (visited.has(p)) continue;
                visited.add(p);

                if (rootsSet.size > 0 && rootsSet.has(p)) {
                    return p;
                }

                next.push(p);
            }
        }

        frontier = next;
        depth += 1;
    }

    return genreQid;
};

export const resolveCanonicalGenres = async ({
    genreQids,
    genreRootQids,
    maxGenres = 2,
    maxDepth = 8,
    uiLang = 'pt-br',
    cache
}) => {
    const list = Array.isArray(genreQids) ? genreQids.filter(isQid) : [];
    const limited = list.slice(0, Math.max(0, maxGenres));

    const resolved = [];
    for (const g of limited) {
        const root = await resolveGenreToRoot({
            genreQid: g,
            genreRootQids,
            maxDepth,
            uiLang,
            cache
        });

        if (root && !resolved.includes(root)) {
            resolved.push(root);
        }

        if (resolved.length >= maxGenres) break;
    }

    return resolved;
};

export const buildTechnicalDetailsFromWikidata = async ({
    qid,
    type,
    uiLang = 'pt-br',
    blockedInstanceOfQids = [],
    genreRootQids = [],
    maxGenres = 2,
    cache
}) => {
    const lang = normalizeUiLangToWikidataLang(uiLang);
    const localCache = cache ?? makeWikidataCache();

    const entity = await getEntityCached({
        qid,
        languages: [lang, 'pt-br', 'en', 'es'],
        props: ['labels', 'aliases', 'descriptions', 'claims'],
        cache: localCache
    });

    if (!entity) {
        return {
            qid,
            type,
            found: false
        };
    }

    const titles = getTitlesPTENES(entity);
    const extracted = extractTechnicalClaims({ entity, type });

    const blocked = isBlockedByInstanceOf({
        instanceOfQids: extracted.instanceOfQids,
        blockedInstanceOfQids
    });

    if (blocked) {
        return {
            qid: entity.id,
            type,
            found: true,
            blocked: true,
            titles
        };
    }

    const primaryCreatorQid = extracted.primaryCreatorQids[0] ?? null;
    const primaryCreatorName = primaryCreatorQid
    ? await getLabelForQid({ qid: primaryCreatorQid, uiLang: lang, cache: localCache })
    : null;

    const countryQid = extracted.countryQids[0] ?? null;
    const countryIso2 = countryQid
    ? await getCountryIso2ByCountryQid({ countryQid, uiLang: lang, cache: localCache })
    : null;

    const canonicalGenreQids = await resolveCanonicalGenres({
        genreQids: extracted.genreQids,
        genreRootQids,
        maxGenres,
        uiLang: lang,
        cache: localCache
    });

    const genres = [];
    for (const gq of canonicalGenreQids) {
        const gEntity = await getEntityCached({
            qid: gq,
            languages: [lang, 'pt-br', 'en', 'es'],
            props: ['labels'],
            cache: localCache
        });

        genres.push({
            qid: gq,
            titles: getTitlesPTENES(gEntity)
        });
    }

    return {
        qid: entity.id,
        type,
        found: true,
        blocked: false,
        titles,
        year: extracted.year ?? null,
        primaryCreator: {
            qid: primaryCreatorQid,
            name: primaryCreatorName
        },
        country: {
            qid: countryQid,
            iso2: countryIso2
        },
        genres,
        externalIds: extracted.externalIds
    };
};
