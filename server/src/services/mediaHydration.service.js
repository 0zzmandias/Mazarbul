import prisma from '../lib/prisma.js';
import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

import {
    getEntities,
    searchEntities,
    buildTechnicalDetailsFromWikidata,
    isQid
} from '../utils/wikidata.adapter.js';

import {
    normalizeCountry,
    normalizeMediaGenres
} from '../utils/normalization.js';

/**
 * MEDIA HYDRATION SERVICE
 * * Responsável pela consolidação e persistência de mídias no Banco de Dados.
 * REGRAS DO PLANO:
 * - Wikidata: Fonte da Identidade (QID), Títulos, Diretor, Ano, País e Gêneros.
 * - APIs Específicas: Fonte de Sinopse e Imagens.
 * - Gêneros: Redução (Funil) -> Tradução Condicional.
 * - Países: Internacionalizados em 3 línguas (PT, EN, ES).
 * - Duração (Runtime): Descartado.
 */

const now = () => new Date();

// --- HELPERS DE APOIO ---

const pickFirst = (...values) => {
    for (const v of values) {
        if (v == null) continue;
        if (typeof v === 'string' && !v.trim()) continue;
        return v;
    }
    return null;
};

const normalizeSlug = (value) =>
String(value || '')
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/[^a-z0-9\s-]/g, ' ')
.replace(/\s+/g, ' ')
.trim()
.replace(/\s+/g, '-');

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
 */
const applyTitleRulesByType = (type, titles) => {
    const t = ensureTitlesShape(titles);

    // Jogos e Álbuns: Mantém título original/global (EN).
    if (type === 'jogo' || type === 'album') {
        const base = pickFirst(t.EN, t.PT, t.ES, t.DEFAULT, null);
        return {
            PT: base,
            EN: base,
            ES: base,
            DEFAULT: base,
        };
    }

    // Filmes e Livros: Títulos traduzidos oficialmente.
    const base = pickFirst(t.PT, t.EN, t.ES, t.DEFAULT, null);
    return {
        PT: t.PT || base,
        EN: t.EN || base,
        ES: t.ES || base,
        DEFAULT: base,
    };
};

// --- RESOLUÇÃO DE DADOS EXTERNOS ---

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
 * Resolve o ISO2 de um país para o formato trilingue do Mazarbul.
 */
const resolveCountryObject = async (countryQid) => {
    if (!isQid(countryQid)) return null;

    const entitiesRes = await getEntities({
        qids: [countryQid],
        languages: ['en'],
        props: ['claims'],
    });

    const entities = unwrapEntitiesMap(entitiesRes);
    const country = entities?.[countryQid] || null;
    if (!country) return null;

    const iso2 = extractClaimString(country, 'P297');
    return normalizeCountry(iso2);
};

// ==========================================
// ENRIQUECIMENTO DE APIs (CONTEÚDO)
// ==========================================

const enrichFromApis = async ({ type, externalIds, canonicalTitle, canonicalCreatorName }) => {
    if (type === 'filme') {
        const tmdbId = externalIds?.tmdb || null;
        if (!tmdbId) return {};

        // TMDB fornece exclusivamente Sinopse e Imagem.
        const data = await tmdb.getMovieData(tmdbId);

        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
        };
    }

    if (type === 'livro') {
        const workId = externalIds?.openLibraryWorkId || externalIds?.openLibrary || null;
        if (!workId) return {};
        const data = await books.getBookData(`ol_${workId}`);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
        };
    }

    if (type === 'jogo') {
        const rawgId = externalIds?.rawg || null;
        if (!rawgId) return {};
        const data = await rawg.getGameData(rawgId);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
            details: data?.details || null,
        };
    }

    if (type === 'album') {
        const mbid = pickFirst(externalIds?.musicbrainzReleaseGroup, externalIds?.mbid, null);
        if (!mbid) return {};

        const data = await lastfm.getAlbumData(mbid);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            details: data?.details || null,
        };
    }

    return {};
};

// --- CONFIGURAÇÕES DE FILTRO ---
const BLOCKED_INSTANCE_OF_QIDS = ['Q24856', 'Q277759', 'Q7058673', 'Q196600'];
const GENRE_ROOT_QIDS = ['Q132311', 'Q24925', 'Q16575965', 'Q19765983', 'Q1762165', 'Q21802675', 'Q40831', 'Q25372'];

// ==========================================
// FUNÇÃO PRINCIPAL: HIDRATAÇÃO
// ==========================================

export const hydrateMediaReferenceByQid = async (qid, { forceRefresh = false } = {}) => {
    const canonicalId = String(qid || '').trim();
    if (!isQid(canonicalId)) throw new Error('QID inválido.');

    const accessedAt = now();

    const existing = await prisma.mediaReference.findUnique({
        where: { id: canonicalId },
    });

    // Se já estiver no banco e completo, apenas atualiza acesso
    if (existing && existing.isStub === false && !forceRefresh) {
        await prisma.mediaReference.update({
            where: { id: canonicalId },
            data: { lastAccessedAt: accessedAt },
        });
        return existing;
    }

    const type = existing?.type || null;
    if (!type) throw new Error('Tipo de mídia ausente. Execute a busca primeiro.');

    /**
     * PASSO 1: DADOS TÉCNICOS (WIKIDATA)
     * Fonte de: Títulos, Diretor/Autor, Ano, País e Gêneros.
     */
    const technical = await buildTechnicalDetailsFromWikidata({
        qid: canonicalId,
        type,
        blockedInstanceOfQids: BLOCKED_INSTANCE_OF_QIDS,
        genreRootQids: GENRE_ROOT_QIDS,
        maxGenres: 2,
    });

    if (!technical || technical.found === false) throw new Error('Mídia não encontrada na Wikidata.');
    if (technical.blocked) throw new Error(technical.reason || 'Mídia bloqueada por política de conteúdo.');

    const titles = applyTitleRulesByType(type, technical.titles);
    const canonicalTitle = pickFirst(titles.DEFAULT, titles.EN, titles.PT, titles.ES, null);

    const externalIds = {
        ...(existing?.externalIds || {}),
        ...(technical.externalIds || {}),
        wikidata: canonicalId,
    };

    const creatorName = technical.primaryCreator?.name || null;

    /**
     * PASSO 2: CONTEÚDO (APIs ESPECÍFICAS)
     * Fonte de: Sinopses e Posters.
     */
    const enrichment = await enrichFromApis({
        type,
        externalIds,
        canonicalTitle,
        canonicalCreatorName: creatorName
    });

    /**
     * PASSO 3: NORMALIZAÇÃO (MOTOR GERAL)
     * Aplica o "Funil" de Gêneros e a Tradução de Países.
     */

    // Normalização do País (Trilingue)
    let countryData = technical.country?.iso2 ? normalizeCountry(technical.country.iso2) : null;
    if (!countryData && technical.country?.qid) {
        countryData = await resolveCountryObject(technical.country.qid);
    }

    // Normalização de Gêneros (Redução + Tradução Condicional)
    const genresTrilingual = normalizeMediaGenres(type, technical.genres);

    // Estrutura interna para o campo 'details' do banco
    const canonicalGenres = Array.isArray(technical.genres)
    ? technical.genres.slice(0, 2).map((g) => {
        const label = pickFirst(g?.titles?.EN, g?.titles?.PT, g?.titles?.ES, null);
        return {
            qid: g?.qid || null,
            slug: label ? normalizeSlug(label) : null,
                                       titles: g?.titles || null,
        };
    }).filter((g) => isQid(g.qid))
    : [];

    const mergedDetails = {
        ...(existing?.details || {}),
        ...(enrichment.details || {}),
        technical: {
            qid: canonicalId,
            type,
            releaseYear: technical.year ?? null,
            creator: technical.primaryCreator || null,
            country: countryData, // Objeto {PT, EN, ES}
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

        // Dados Técnicos (WIKIDATA)
        releaseYear: technical.year ?? existing?.releaseYear ?? null,
        director: creatorName ?? existing?.director ?? null,

        // Gêneros e Países Normalizados
        genres: genresTrilingual,
        countries: countryData, // Salva o objeto trilingue para o Front

        // Conteúdo (APIs)
        synopses: enrichment?.synopses ?? existing?.synopses ?? null,
        posterUrl: enrichment?.posterUrl ?? existing?.posterUrl ?? null,
        backdropUrl: enrichment?.backdropUrl ?? existing?.backdropUrl ?? null,

        details: mergedDetails,
        externalIds: externalIds,
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
