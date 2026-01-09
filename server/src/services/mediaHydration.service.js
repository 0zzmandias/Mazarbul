import prisma from '../lib/prisma.js';

import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

import { getEntities, searchEntities, buildTechnicalDetailsFromWikidata, isQid } from '../utils/wikidata.adapter.js';

const now = () => new Date();

const pickFirst = (...values) => {
    for (const v of values) {
        if (v == null) continue;
        if (typeof v === 'string' && !v.trim()) continue;
        return v;
    }
    return null;
};

const normalizeComparableName = (value) =>
String(value || '')
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/[^a-z0-9\s]/g, ' ')
.replace(/\s+/g, ' ')
.trim();

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

const applyTitleRulesByType = (type, titles) => {
    const t = ensureTitlesShape(titles);

    if (type === 'jogo' || type === 'album') {
        const base = pickFirst(t.EN, t.PT, t.ES, t.DEFAULT, null);
        return {
            PT: base,
            EN: base,
            ES: base,
            DEFAULT: base,
        };
    }

    const base = pickFirst(t.PT, t.EN, t.ES, t.DEFAULT, null);
    return {
        PT: t.PT || base,
        EN: t.EN || base,
        ES: t.ES || base,
        DEFAULT: base,
    };
};

const buildGenresForUi = (type, technicalGenres) => {
    const base = Array.isArray(technicalGenres) ? technicalGenres : [];

    const byLang = { PT: [], EN: [], ES: [] };
    const forceSame = type === 'jogo' || type === 'album';

    for (const g of base) {
        const titles = g?.titles && typeof g.titles === 'object' ? g.titles : null;
        const en = titles?.EN || null;
        const pt = titles?.PT || null;
        const es = titles?.ES || null;

        if (forceSame) {
            const v = pickFirst(en, pt, es, null);
            if (v) {
                byLang.PT.push(v);
                byLang.EN.push(v);
                byLang.ES.push(v);
            }
            continue;
        }

        if (pt) byLang.PT.push(pt);
        if (en) byLang.EN.push(en);
        if (es) byLang.ES.push(es);
    }

    const dedupe = (arr) => {
        const out = [];
        const seen = new Set();
        for (const v of arr || []) {
            const s = String(v || '').trim();
            if (!s) continue;
            const k = s.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(s);
        }
        return out;
    };

    const limited = (arr) => dedupe(arr).slice(0, 2);

    const pt = limited(byLang.PT);
    const en = limited(byLang.EN.length ? byLang.EN : pt);
    const es = limited(byLang.ES.length ? byLang.ES : en);

    return {
        PT: pt,
        EN: en,
        ES: es,
        DEFAULT: en.length ? en : pt,
    };
};

const getFirstCountryIso2FromAdapterPayload = (payload) => {
    const c = payload?.countries;

    if (Array.isArray(c) && c.length > 0) {
        const code = String(c[0] || '').toUpperCase().trim();
        return code.length === 2 ? code : null;
    }

    if (c && typeof c === 'object') {
        const candidates = [c.EN, c.PT, c.ES, c.DEFAULT].filter(Array.isArray);
        for (const arr of candidates) {
            if (arr.length === 0) continue;
            const code = String(arr[0] || '').toUpperCase().trim();
            if (code.length === 2) return code;
        }
    }

    return null;
};

const unwrapEntitiesMap = (entitiesResponse) => {
    if (!entitiesResponse) return {};
    if (entitiesResponse.entities && typeof entitiesResponse.entities === 'object') return entitiesResponse.entities;
    if (entitiesResponse.data?.entities && typeof entitiesResponse.data.entities === 'object') return entitiesResponse.data.entities;
    return entitiesResponse;
};

const getClaimSnaks = (entity, pid) => {
    const claims = entity?.claims || {};
    const arr = claims?.[pid];
    return Array.isArray(arr) ? arr : [];
};

const extractClaimEntityQids = (entity, pid) => {
    const out = [];
    for (const snak of getClaimSnaks(entity, pid)) {
        const v = snak?.mainsnak?.datavalue?.value;
        const id = v?.id || null;
        if (isQid(id)) out.push(id);
    }
    return out;
};

const extractClaimString = (entity, pid) => {
    for (const snak of getClaimSnaks(entity, pid)) {
        const v = snak?.mainsnak?.datavalue?.value;
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
};

const resolveCountryIso2FromCountryQid = async (countryQid) => {
    if (!isQid(countryQid)) return null;

    const entitiesRes = await getEntities({
        qids: [countryQid],
        languages: ['en'],
        props: ['claims', 'labels'],
    });

    const entities = unwrapEntitiesMap(entitiesRes);
    const country = entities?.[countryQid] || null;
    if (!country) return null;

    const iso2 = extractClaimString(country, 'P297');
    if (!iso2) return null;

    const code = iso2.toUpperCase().trim();
    return code.length === 2 ? code : null;
};

const resolveCountryQidFromEntity = (entity) => {
    return pickFirst(
        extractClaimEntityQids(entity, 'P17')[0],
                     extractClaimEntityQids(entity, 'P495')[0],
                     extractClaimEntityQids(entity, 'P27')[0]
    );
};

const resolveArtistCountryIso2 = async (artistQid) => {
    if (!isQid(artistQid)) return null;

    const entitiesRes = await getEntities({
        qids: [artistQid],
        languages: ['en'],
        props: ['claims', 'labels'],
    });

    const entities = unwrapEntitiesMap(entitiesRes);
    const artist = entities?.[artistQid] || null;
    if (!artist) return null;

    const countryQid = resolveCountryQidFromEntity(artist);
    return await resolveCountryIso2FromCountryQid(countryQid);
};

const resolveGameStudioCountryIso2 = async ({ studioName }) => {
    const studio = String(studioName || '').trim();
    if (!studio) return null;

    const results = await searchEntities({ query: studio, language: 'en', limit: 6 });
    const candidates = Array.isArray(results) ? results : [];

    for (const r of candidates) {
        const qid = r?.qid || r?.id || null;
        if (!isQid(qid)) continue;

        const label = r?.label || r?.name || null;
        if (label) {
            const a = normalizeComparableName(label);
            const b = normalizeComparableName(studio);
            if (a && b && a !== b && !a.includes(b) && !b.includes(a)) continue;
        }

        const entitiesRes = await getEntities({
            qids: [qid],
            languages: ['en'],
            props: ['claims', 'labels'],
        });

        const entities = unwrapEntitiesMap(entitiesRes);
        const ent = entities?.[qid] || null;
        if (!ent) continue;

        const countryQid = pickFirst(
            extractClaimEntityQids(ent, 'P17')[0],
                                     extractClaimEntityQids(ent, 'P495')[0]
        );

        const iso2 = await resolveCountryIso2FromCountryQid(countryQid);
        if (iso2) return iso2;
    }

    return null;
};

const parseLastfmMbidFromId = (id) => {
    const s = String(id || '').trim();
    if (!s.startsWith('lastfm_')) return null;
    const mbid = s.slice('lastfm_'.length);
    return mbid && mbid.length >= 8 ? mbid : null;
};

const scoreLastfmCandidate = ({ candidateTitle, candidateArtist, title, artist }) => {
    const ct = normalizeComparableName(candidateTitle);
    const ca = normalizeComparableName(candidateArtist);
    const t = normalizeComparableName(title);
    const a = normalizeComparableName(artist);

    let score = 0;

    if (ct && t) {
        if (ct === t) score += 60;
        else if (ct.includes(t) || t.includes(ct)) score += 35;
    }

    if (ca && a) {
        if (ca === a) score += 60;
        else if (ca.includes(a) || a.includes(ca)) score += 25;
    }

    return score;
};

const resolveLastfmAlbumMbid = async ({ title, artist }) => {
    const t = String(title || '').trim();
    if (!t) return null;

    const results = await lastfm.searchAlbums(t);
    const candidates = Array.isArray(results) ? results : [];

    let best = null;
    let bestScore = -1;

    for (const c of candidates) {
        const mbid = parseLastfmMbidFromId(c?.id);
        if (!mbid) continue;

        const s = scoreLastfmCandidate({
            candidateTitle: c?.title || c?.name || '',
            candidateArtist: c?.artist || '',
            title: t,
            artist: artist || '',
        });

        if (s > bestScore) {
            bestScore = s;
            best = { mbid, score: s };
        }
    }

    if (!best) return null;

    if (artist && best.score < 80) return null;
    if (!artist && best.score < 60) return null;

    return best.mbid;
};

const enrichFromApis = async ({ type, externalIds, canonicalTitle, canonicalCreatorName }) => {
    if (type === 'filme') {
        const tmdbId = externalIds?.tmdb || null;
        if (!tmdbId) return {};
        const data = await tmdb.getMovieData(tmdbId);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            backdropUrl: data?.backdropUrl || null,
            runtime: data?.runtime ?? null,
            countries: data?.countries || null,
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
            countries: data?.countries || null,
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
            runtime: data?.runtime ?? null,
            details: data?.details || null,
            studioName: data?.director || null,
        };
    }

    if (type === 'album') {
        const directMbid = pickFirst(
            externalIds?.mbid,
            externalIds?.musicBrainzReleaseId,
            null
        );

        const mbid =
        directMbid ||
        (await resolveLastfmAlbumMbid({
            title: canonicalTitle,
            artist: canonicalCreatorName
        }));

        if (!mbid) return {};

        const data = await lastfm.getAlbumData(mbid);
        return {
            synopses: data?.synopses || null,
            posterUrl: data?.posterUrl || null,
            details: data?.details || null,
            mbidUsed: mbid
        };
    }

    return {};
};

const BLOCKED_INSTANCE_OF_QIDS = [
    'Q24856',
'Q277759',
'Q7058673',
'Q196600',
];

const GENRE_ROOT_QIDS = [
    'Q132311',
'Q24925',
'Q16575965',
'Q19765983',
'Q1762165',
'Q21802675',
'Q40831',
'Q25372'
];

export const hydrateMediaReferenceByQid = async (qid, { forceRefresh = false } = {}) => {
    const canonicalId = String(qid || '').trim();
    if (!isQid(canonicalId)) {
        throw new Error('QID inválido.');
    }

    const accessedAt = now();

    const existing = await prisma.mediaReference.findUnique({
        where: { id: canonicalId },
    });

    if (existing && existing.isStub === false && !forceRefresh) {
        await prisma.mediaReference.update({
            where: { id: canonicalId },
            data: { lastAccessedAt: accessedAt },
        });
        return existing;
    }

    const type = existing?.type || null;
    if (!type) {
        throw new Error('Tipo de mídia não definido para este QID (stub ausente).');
    }

    const technical = await buildTechnicalDetailsFromWikidata({
        qid: canonicalId,
        type,
        blockedInstanceOfQids: BLOCKED_INSTANCE_OF_QIDS,
        genreRootQids: GENRE_ROOT_QIDS,
        maxGenres: 2,
    });

    if (!technical || technical.found === false) {
        throw new Error('Item não encontrado no Wikidata.');
    }

    if (technical.blocked) {
        throw new Error(technical.reason || 'Este item não pode ser exibido.');
    }

    const titles = applyTitleRulesByType(type, technical.titles);
    const canonicalTitle = pickFirst(titles.DEFAULT, titles.EN, titles.PT, titles.ES, null);

    const externalIds = {
        ...(existing?.externalIds && typeof existing.externalIds === 'object' ? existing.externalIds : {}),
        ...(technical.externalIds && typeof technical.externalIds === 'object' ? technical.externalIds : {}),
        wikidata: canonicalId,
    };

    const creatorName = technical.primaryCreator?.name || null;

    const enrichment = await enrichFromApis({
        type,
        externalIds,
        canonicalTitle,
        canonicalCreatorName: creatorName
    });

    let countryIso2 = technical.country?.iso2 || null;
    let countrySource = countryIso2 ? 'wikidata' : null;

    if (!countryIso2) {
        const wdCountryQid = technical.country?.qid || null;
        const iso2 = await resolveCountryIso2FromCountryQid(wdCountryQid);
        if (iso2) {
            countryIso2 = iso2;
            countrySource = 'wikidata';
        }
    }

    if (!countryIso2) {
        if (type === 'filme') {
            const tmdbIso2 = getFirstCountryIso2FromAdapterPayload(enrichment);
            if (tmdbIso2) {
                countryIso2 = tmdbIso2;
                countrySource = 'tmdb';
            }
        } else if (type === 'livro') {
            const bookIso2 = getFirstCountryIso2FromAdapterPayload(enrichment);
            if (bookIso2) {
                countryIso2 = bookIso2;
                countrySource = 'openlibrary';
            }
        } else if (type === 'album') {
            const artistQid = technical.primaryCreator?.qid || null;
            const artistIso2 = await resolveArtistCountryIso2(artistQid);
            if (artistIso2) {
                countryIso2 = artistIso2;
                countrySource = 'wikidata-artist';
            }
        } else if (type === 'jogo') {
            const studioIso2 = await resolveGameStudioCountryIso2({
                studioName: enrichment?.studioName || null,
            });
            if (studioIso2) {
                countryIso2 = studioIso2;
                countrySource = 'rawg-wikidata';
            }
        }
    }

    const countries = countryIso2 ? [countryIso2] : null;
    const genresForUi = buildGenresForUi(type, technical.genres);

    const canonicalGenres = Array.isArray(technical.genres)
    ? technical.genres.slice(0, 2).map((g) => {
        const base = pickFirst(g?.titles?.EN, g?.titles?.PT, g?.titles?.ES, null);
        return {
            qid: g?.qid || null,
            slug: base ? normalizeSlug(base) : null,
                                       titles: g?.titles || null,
        };
    }).filter((g) => isQid(g.qid))
    : [];

    const previousDetails = existing?.details && typeof existing.details === 'object' ? existing.details : {};
    const enrichmentDetails = enrichment?.details && typeof enrichment.details === 'object' ? enrichment.details : {};

    const mergedDetails = {
        ...previousDetails,
        ...enrichmentDetails,
        technical: {
            qid: canonicalId,
            type,
            releaseYear: technical.year ?? null,
            creator: technical.primaryCreator || null,
            countryIso2: countryIso2 || null,
            countryQid: technical.country?.qid || null,
            genres: canonicalGenres,
        },
    };

    if (type === 'album') {
        if (creatorName) mergedDetails.Artista = creatorName;
        if (enrichment?.mbidUsed) {
            mergedDetails.external = {
                ...(mergedDetails.external || {}),
                lastfmMbid: enrichment.mbidUsed
            };
        }
    }

    const dataToSave = {
        id: canonicalId,
        type,
        titles,

        releaseYear: technical.year ?? existing?.releaseYear ?? null,
        director: creatorName ?? existing?.director ?? null,

        genres: genresForUi,
        countries: countries,

        synopses: enrichment?.synopses ?? existing?.synopses ?? null,
        posterUrl: enrichment?.posterUrl ?? existing?.posterUrl ?? null,
        backdropUrl: enrichment?.backdropUrl ?? existing?.backdropUrl ?? null,
        runtime: enrichment?.runtime ?? existing?.runtime ?? null,

        details: mergedDetails,
        externalIds: externalIds,
        tags: existing?.tags ?? [],

        isStub: false,
        lastFetchedAt: accessedAt,
        lastAccessedAt: accessedAt,
        countrySource: countrySource,
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
