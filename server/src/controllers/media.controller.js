import prisma from '../lib/prisma.js';

import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

import { searchUnifiedMedia } from '../services/mediaSearch.service.js';
import { hydrateMediaReferenceByQid } from '../services/mediaHydration.service.js';
import { isQid } from '../utils/wikidata.adapter.js';

const isTruthy = (value) => {
    const v = String(value ?? '').trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'y';
};

export const searchMedia = async (req, res) => {
    const { q, type, lang, canonical, limit } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' é obrigatória" });
    }

    const useCanonical = isTruthy(canonical) || !type || type === 'all';

    try {
        if (useCanonical) {
            const parsedLimit = Number.parseInt(String(limit ?? ''), 10);
            const finalLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 30)) : 20;

            const results = await searchUnifiedMedia({
                query: q,
                uiLang: lang || 'PT',
                type: type && type !== 'all' ? type : null,
                limit: finalLimit
            });

            return res.json(results);
        }

        let results = [];

        switch (type) {
            case 'filme':
                results = await tmdb.searchMovies(q);
                break;
            case 'jogo':
                results = await rawg.searchGames(q);
                break;
            case 'livro':
                results = await books.searchBooks(q);
                break;
            case 'album':
                results = await lastfm.searchAlbums(q);
                break;
            default:
                results = await tmdb.searchMovies(q);
        }

        return res.json(results);
    } catch (error) {
        console.error('Erro na busca:', error);
        return res.status(500).json({ error: 'Falha ao buscar mídia' });
    }
};

export const getMediaDetails = async (req, res) => {
    const { id } = req.params;

    const refreshParam = String(req.query.refresh || '').toLowerCase();
    const forceRefresh = refreshParam === '1' || refreshParam === 'true' || refreshParam === 'yes';

    try {
        if (isQid(id)) {
            const cachedMedia = await prisma.mediaReference.findUnique({
                where: { id },
                include: {
                    reviews: {
                        include: { user: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    _count: {
                        select: { favoritedBy: true }
                    }
                }
            });

            if (cachedMedia && cachedMedia.isStub === false && !forceRefresh) {
                await prisma.mediaReference.update({
                    where: { id },
                    data: { lastAccessedAt: new Date() }
                });

                return res.json(cachedMedia);
            }

            await hydrateMediaReferenceByQid(id, { forceRefresh });

            const hydrated = await prisma.mediaReference.findUnique({
                where: { id },
                include: {
                    reviews: {
                        include: { user: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    _count: {
                        select: { favoritedBy: true }
                    }
                }
            });

            if (!hydrated) {
                return res.status(404).json({ error: 'Mídia não encontrada.' });
            }

            return res.json(hydrated);
        }

        const cachedMedia = await prisma.mediaReference.findUnique({
            where: { id },
            include: {
                reviews: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: { favoritedBy: true }
                }
            }
        });

        if (cachedMedia && !forceRefresh) {
            await prisma.mediaReference.update({
                where: { id },
                data: { lastAccessedAt: new Date() }
            });

            return res.json(cachedMedia);
        }

        const [prefix, ...rest] = id.split('_');
        const externalId = rest.join('_');

        let externalData = null;

        if (prefix === 'tmdb') {
            externalData = await tmdb.getMovieData(externalId);
        } else if (prefix === 'rawg') {
            externalData = await rawg.getGameData(externalId);
        } else if (prefix === 'google' || prefix === 'ol') {
            externalData = await books.getBookData(id);
        } else if (prefix === 'lastfm') {
            externalData = await lastfm.getAlbumData(externalId);
        } else {
            return res.status(400).json({ error: 'Fonte de mídia desconhecida.' });
        }

        if (!externalData) {
            return res.status(404).json({ error: 'Mídia não encontrada na fonte externa.' });
        }

        const at = new Date();

        await prisma.mediaReference.upsert({
            where: { id: externalData.id },
            create: {
                id: externalData.id,
                type: externalData.type,
                titles: externalData.titles,
                synopses: externalData.synopses,
                posterUrl: externalData.posterUrl,
                backdropUrl: externalData.backdropUrl,
                releaseYear: externalData.releaseYear,
                tags: externalData.tags || [],
                externalIds: externalData.externalIds || {},

                runtime: externalData.runtime,
                director: externalData.director,
                genres: externalData.genres,
                countries: externalData.countries,
                details: externalData.details,

                isStub: false,
                lastFetchedAt: at,
                lastAccessedAt: at,
                countrySource: null
            },
            update: {
                type: externalData.type,
                titles: externalData.titles,
                synopses: externalData.synopses,
                posterUrl: externalData.posterUrl,
                backdropUrl: externalData.backdropUrl,
                releaseYear: externalData.releaseYear,
                tags: externalData.tags || [],
                externalIds: externalData.externalIds || {},

                runtime: externalData.runtime,
                director: externalData.director,
                genres: externalData.genres,
                countries: externalData.countries,
                details: externalData.details,

                isStub: false,
                lastFetchedAt: at,
                lastAccessedAt: at
            }
        });

        const hydrated = await prisma.mediaReference.findUnique({
            where: { id: externalData.id },
            include: {
                reviews: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: { favoritedBy: true }
                }
            }
        });

        return res.json(hydrated);
    } catch (error) {
        const msg = String(error?.message || '');

        if (msg.toLowerCase().includes('não encontrado')) {
            return res.status(404).json({ error: msg });
        }

        if (msg.toLowerCase().includes('qid inválido') || msg.toLowerCase().includes('tipo de mídia não definido')) {
            return res.status(400).json({ error: msg });
        }

        console.error('Erro ao buscar detalhes da mídia:', error);
        return res.status(500).json({ error: 'Erro interno ao processar mídia.' });
    }
};
