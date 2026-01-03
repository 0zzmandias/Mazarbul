import prisma from '../lib/prisma.js';
import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

export const searchMedia = async (req, res) => {
    const { q, type } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' é obrigatória" });
    }

    try {
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
        console.error("Erro na busca:", error);
        return res.status(500).json({ error: "Falha ao buscar mídia" });
    }
};

export const getMediaDetails = async (req, res) => {
    const { id } = req.params;

    const refreshParam = String(req.query.refresh || '').toLowerCase();
    const forceRefresh = refreshParam === '1' || refreshParam === 'true' || refreshParam === 'yes';

    try {
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
            return res.status(400).json({ error: "Fonte de mídia desconhecida." });
        }

        if (!externalData) {
            return res.status(404).json({ error: "Mídia não encontrada na fonte externa." });
        }

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
                details: externalData.details
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
                details: externalData.details
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
        console.error("Erro ao buscar detalhes da mídia:", error);
        return res.status(500).json({ error: "Erro interno ao processar mídia." });
    }
};
