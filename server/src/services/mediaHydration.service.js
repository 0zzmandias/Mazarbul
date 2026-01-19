import prisma from '../lib/prisma.js';
import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

import {
    getEntities,
    buildTechnicalDetailsFromWikidata,
    isQid
} from '../utils/wikidata.adapter.js';

import {
    normalizeCountry,
    normalizeMediaGenres
} from '../utils/normalization.js';

/**
 * MEDIA HYDRATION SERVICE
 * * Responsável pela consolidação e persistência definitiva de mídias no Banco de Dados.
 * REGRAS DO PLANO:
 * 1. Identidade: Baseada no QID único da Wikidata.
 * 2. Dados Técnicos: Autoridade da WIKIDATA para Diretor/Autor, Ano, País e Gêneros.
 * 3. Conteúdo: APIs (TMDB/Google Books/RAWG/LastFM) fornecem Sinopses, Capas e Tracklists.
 * 4. Normalização: Países como objetos {PT, EN, ES} e Gêneros via Funil de Redução.
 */

const now = () => new Date();

// ==========================================
// 1. HELPERS DE APOIO E FORMATAÇÃO
// ==========================================

const pickFirst = (...values) => {
    for (const v of values) {
        if (v != null && typeof v === 'string' && v.trim()) return v;
    }
    return null;
};

const normalizeSlug = (value) =>
String(value || '')
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/[^a-z0-9\s-]/g, ' ')
.trim()
.replace(/\s+/g, '-');

/**
 * Garante que o objeto de títulos tenha a estrutura PT, EN, ES, DEFAULT.
 */
const ensureTitlesShape = (titles) => {
    const t = titles && typeof titles === 'object' ? { ...titles } : {};
    if (!('PT' in t)) t.PT = null;
    if (!('EN' in t)) t.EN = null;
    if (!('ES' in t)) t.ES = null;

    const base = pickFirst(t.DEFAULT, t.PT, t.EN, t.ES, null);
    t.DEFAULT = base;

    return t;
};

/**
 * Aplica internacionalização de títulos conforme o tipo de mídia.
 * CORREÇÃO DEFINITIVA: Para Livros e Filmes, preservamos as traduções individuais.
 */
const applyTitleRulesByType = (type, titles) => {
    const t = ensureTitlesShape(titles);

    // Jogos e Álbuns: Mantêm o título global (geralmente em Inglês)
    if (type === 'jogo' || type === 'album') {
        const base = pickFirst(t.EN, t.PT, t.ES, t.DEFAULT, null);
        return {
            PT: base,
            EN: base,
            ES: base,
            DEFAULT: base,
        };
    }

    // Filmes e Livros: Respeitam as traduções oficiais da Wikidata.
    return {
        PT: t.PT || t.DEFAULT,
        EN: t.EN || t.DEFAULT,
        ES: t.ES || t.DEFAULT,
        DEFAULT: t.DEFAULT,
    };
};

// ==========================================
// 2. RESOLUÇÃO DE DADOS TÉCNICOS ADICIONAIS
// ==========================================

const unwrapEntitiesMap = (entitiesResponse) => {
    if (!entitiesResponse) return {};
    if (entitiesResponse.entities && typeof entitiesResponse.entities === 'object') return entitiesResponse.entities;
    return entitiesResponse;
};

const extractClaimString = (entity, pid) => {
    const claims = entity?.claims || {};
    const arr = claims?.[pid];
    if (!Array.isArray(arr)) return null;
    for (const snak of arr) {
        const v = snak?.mainsnak?.datavalue?.value;
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
};

/**
 * Extrai o ID de uma entidade (QID) de um claim da Wikidata.
 */
const extractClaimEntityId = (entity, pid) => {
    const claims = entity?.claims || {};
    const arr = claims?.[pid];
    if (!Array.isArray(arr)) return null;
    const id = arr[0]?.mainsnak?.datavalue?.value?.id;
    return isQid(id) ? id : null;
};

/**
 * Resolve o objeto de país trilingue a partir de um QID de país.
 */
const resolveCountryObject = async (countryQid) => {
    if (!isQid(countryQid)) return null;

    const entitiesRes = await getEntities({
        qids: [countryQid],
        languages: ['en', 'pt', 'es'],
        props: ['claims'],
    });

    const entities = unwrapEntitiesMap(entitiesRes);
    const country = entities?.[countryQid] || null;
    if (!country) return null;

    const iso2 = extractClaimString(country, 'P297');
    return normalizeCountry(iso2);
};

// ==========================================
// 3. ENRIQUECIMENTO VIA APIs DE CONTEÚDO
// ==========================================

const enrichFromApis = async ({ type, externalIds, titles, canonicalTitle, canonicalCreatorName }) => {
    // FILMES: TMDB
    if (type === 'filme') {
        const tmdbId = externalIds?.tmdb || null;
        if (!tmdbId) return {};
        const data = await tmdb.getMovieData(tmdbId);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
        };
    }

    // LIVROS: GOOGLE BOOKS
    if (type === 'livro') {
        const data = await books.getBookEnrichment({
            titles,
            author: canonicalCreatorName
        });
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: null,
        };
    }

    // JOGOS: RAWG
    if (type === 'jogo') {
        const rawgId = externalIds?.rawg || null;
        if (!rawgId) return {};
        const data = await rawg.getGameData(rawgId);
        // AJUSTE: Retornamos também os gêneros originais do RAWG para evitar o Funil da Wikidata em jogos
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
            genres: data?.genres || null
        };
    }

    // MÚSICA: LastFM + MusicBrainz
    if (type === 'album') {
        // Tenta pegar o MBID (Release Group) vindo da Wikidata (P436) ou o salvo anteriormente
        try {
            const mbid = pickFirst(externalIds?.musicbrainzReleaseGroup, externalIds?.mbid, null);
            if (!mbid) return {};
            const data = await lastfm.getAlbumData(mbid);
            return {
                synopses: data?.synopses || null,
                posterUrl: data?.posterUrl || null,
                // Detalhes contêm a Tracklist e BonusSections formatadas
                details: data?.details || null
            };
        } catch (albumError) {
            console.warn('[Hydration] Falha no enriquecimento do álbum:', albumError.message);
            return {};
        }
    }

    return {};
};

// --- CONFIGURAÇÕES DE FILTRO ---
const BLOCKED_INSTANCE_OF_QIDS = [
    'Q24856', 'Q277759', 'Q7058673', 'Q196600',
'Q235545', 'Q334335', 'Q5398426'
];

// QIDs para o Funil de Redução de Gêneros
const GENRE_ROOT_QIDS = [
    'Q132311', 'Q24925', 'Q16575965', 'Q19765983',
'Q1762165', 'Q21802675', 'Q40831', 'Q8261', 'Q11406', 'Q133292'
];

// ==========================================
// 4. FUNÇÃO PRINCIPAL DE HIDRATAÇÃO
// ==========================================

/**
 * Hidrata uma MediaReference usando o QID como âncora de identidade.
 * @param {string} qid - Identificador único da Wikidata.
 * @param {object} options - Opções (forceRefresh, type).
 */
export const hydrateMediaReferenceByQid = async (qid, { forceRefresh = false, type: providedType = null } = {}) => {
    const canonicalId = String(qid || '').trim();
    if (!isQid(canonicalId)) throw new Error('QID inválido para hidratação.');

    const accessedAt = now();

    const existing = await prisma.mediaReference.findUnique({
        where: { id: canonicalId },
    });

    // Se já estiver no banco, estiver completa e não for solicitado refresh, apenas atualiza o acesso
    if (existing && existing.isStub === false && !forceRefresh) {
        await prisma.mediaReference.update({
            where: { id: canonicalId },
            data: { lastAccessedAt: accessedAt },
        });
        return existing;
    }

    // CORREÇÃO DO ERRO DE TIPO: Determina o tipo via banco ou via parâmetro fornecido no controller
    const type = providedType || existing?.type || null;
    if (!type) throw new Error('Tipo de mídia ausente no registro da MediaReference.');

    /**
     * PASSO 1: DADOS TÉCNICOS (WIKIDATA)
     */
    const technical = await buildTechnicalDetailsFromWikidata({
        qid: canonicalId,
        type,
        blockedInstanceOfQids: BLOCKED_INSTANCE_OF_QIDS,
        genreRootQids: GENRE_ROOT_QIDS,
        maxGenres: 2, // Garante o limite de 2 gêneros conforme o plano de Álbuns
    });

    if (!technical || technical.found === false) throw new Error('Mídia não encontrada na Wikidata.');
    if (technical.blocked) throw new Error('Entidade bloqueada por ser uma série ou franquia genérica.');

    const titles = applyTitleRulesByType(type, technical.titles);
    const creatorName = technical.primaryCreator?.name || null;

    /**
     * PASSO 2: CONTEÚDO (APIs EXTERNAS)
     * AJUSTE: Try/Catch envolta do enrichFromApis para evitar Erro 500 se as APIs externas falharem.
     */
    let enrichment = {};
    try {
        enrichment = await enrichFromApis({
            type,
            externalIds: {
                ...(existing?.externalIds || {}),
                                          ...(technical.externalIds || {}),
                                          wikidata: canonicalId
            },
            titles,
            canonicalTitle: pickFirst(titles.DEFAULT, titles.EN, titles.PT, titles.ES, null),
                                          canonicalCreatorName: creatorName
        });
    } catch (apiError) {
        console.warn(`[Hydration] Falha no enriquecimento de APIs para ${canonicalId}:`, apiError.message);
    }

    /**
     * PASSO 3: NORMALIZAÇÃO E RESOLUÇÃO DE PAÍS
     */
    let countryData = technical.country?.iso2 ? normalizeCountry(technical.country.iso2) : null;
    if (!countryData && technical.country?.qid) {
        countryData = await resolveCountryObject(technical.country.qid);
    }

    // LÓGICA DE FALLBACK PARA JOGOS: Busca país sede da desenvolvedora
    if (!countryData && type === 'jogo' && technical.primaryCreator?.qid) {
        try {
            const devRes = await getEntities({
                qids: [technical.primaryCreator.qid],
                props: ['claims']
            });
            const devEntity = unwrapEntitiesMap(devRes)?.[technical.primaryCreator.qid];
            const countryIdFromDev = extractClaimEntityId(devEntity, 'P17');
            if (countryIdFromDev) {
                countryData = await resolveCountryObject(countryIdFromDev);
            }
        } catch (err) {
            console.error('[Hydration] Falha no fallback de país da desenvolvedora:', err.message);
        }
    }

    // LÓGICA DE FALLBACK PARA ÁLBUNS: Busca país do artista
    if (!countryData && type === 'album' && technical.primaryCreator?.qid) {
        try {
            const artistRes = await getEntities({
                qids: [technical.primaryCreator.qid],
                props: ['claims']
            });
            const artistEntity = unwrapEntitiesMap(artistRes)?.[technical.primaryCreator.qid];
            // Busca P17 (País) ou P27 (Cidadania) do artista para garantir o campo preenchido
            const countryIdFromArtist = extractClaimEntityId(artistEntity, 'P17') || extractClaimEntityId(artistEntity, 'P27');
            if (countryIdFromArtist) {
                countryData = await resolveCountryObject(countryIdFromArtist);
            }
        } catch (err) {
            console.error('[Hydration] Falha no fallback de país do artista:', err.message);
        }
    }

    // NORMALIZAÇÃO DE GÊNEROS: Jogos usam dados do RAWG; outros usam Funil da Wikidata.
    let genresTrilingual;
    if (type === 'jogo' && enrichment.genres) {
        genresTrilingual = enrichment.genres;
    } else {
        genresTrilingual = normalizeMediaGenres(type, technical.genres);
    }

    const canonicalGenres = Array.isArray(technical.genres)
    ? technical.genres.slice(0, 2).map((g) => ({
        qid: g?.qid || null,
        slug: (g?.titles?.EN || g?.titles?.DEFAULT) ? normalizeSlug(g.titles.EN || g.titles.DEFAULT) : null,
                                               titles: g?.titles || null,
    })) : [];

    const mergedDetails = {
        ...(existing?.details || {}),
        ...(enrichment?.details || {}), // Injeta a Tracklist/BonusSections vinda do adaptador de música
        technical: {
            qid: canonicalId,
            type,
            releaseYear: technical.year ?? null,
            creator: technical.primaryCreator || null,
            country: countryData,
            genres: canonicalGenres,
        },
    };

    /**
     * PASSO 4: PERSISTÊNCIA FINAL
     */
    const dataToSave = {
        id: canonicalId,
        type,
        titles,
        releaseYear: technical.year ?? existing?.releaseYear ?? null,
        director: creatorName ?? existing?.director ?? null,
        genres: genresTrilingual,
        countries: countryData,
        synopses: enrichment?.synopses ?? existing?.synopses ?? null,
        posterUrl: enrichment?.posterUrl ?? existing?.posterUrl ?? null,
        backdropUrl: enrichment?.backdropUrl ?? existing?.backdropUrl ?? null,
        details: mergedDetails,
        externalIds: {
            ...(existing?.externalIds || {}),
            ...(technical.externalIds || {}),
            wikidata: canonicalId
        },
        tags: existing?.tags ?? [],
        isStub: false,
        lastFetchedAt: accessedAt,
        lastAccessedAt: accessedAt,
    };

    if (existing) {
        const updateData = { ...dataToSave };
        delete updateData.id;
        return await prisma.mediaReference.update({
            where: { id: canonicalId },
            data: updateData,
        });
    }

    return await prisma.mediaReference.create({ data: dataToSave });
};
