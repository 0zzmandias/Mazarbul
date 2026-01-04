import prisma from '../lib/prisma.js';
import * as tmdb from '../utils/tmdb.adapter.js';
import * as rawg from '../utils/rawg.adapter.js';
import * as books from '../utils/books.adapter.js';
import * as lastfm from '../utils/lastfm.adapter.js';

const MBID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const looksLikeMbid = (value) => MBID_REGEX.test(String(value || '').trim());

const hydrateMediaById = async (id) => {
    return prisma.mediaReference.findUnique({
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
};

const ensureAlias = async (tx, aliasId, canonicalId) => {
    const a = String(aliasId || '').trim();
    const c = String(canonicalId || '').trim();

    if (!a || !c) return;
    if (a === c) return;

    await tx.mediaAlias.upsert({
        where: { aliasId: a },
        create: { aliasId: a, canonicalId: c },
        update: { canonicalId: c }
    });
};

const migrateMediaToCanonical = async (tx, oldId, canonicalId) => {
    const oldKey = String(oldId || '').trim();
    const canonKey = String(canonicalId || '').trim();

    if (!oldKey || !canonKey) return;
    if (oldKey === canonKey) return;

    const oldMedia = await tx.mediaReference.findUnique({
        where: { id: oldKey },
        select: {
            id: true,
            favoritedBy: { select: { id: true } }
        }
    });

    if (!oldMedia) {
        // Mesmo se não existir MediaReference, ainda vale garantir o alias
        await ensureAlias(tx, oldKey, canonKey);
        await tx.mediaAlias.updateMany({
            where: { canonicalId: oldKey },
            data: { canonicalId: canonKey }
        });
        return;
    }

    // Reviews: move para o canônico
    await tx.review.updateMany({
        where: { mediaId: oldKey },
        data: { mediaId: canonKey }
    });

    // Favoritos: move para o canônico
    const favoritedUsers = Array.isArray(oldMedia.favoritedBy) ? oldMedia.favoritedBy : [];
    for (const u of favoritedUsers) {
        try {
            await tx.user.update({
                where: { id: u.id },
                data: {
                    favorites: {
                        disconnect: { id: oldKey },
                        connect: { id: canonKey }
                    }
                }
            });
        } catch (e) {
            // Se já estiver conectado ao canônico, não bloqueia a migração
            try {
                await tx.user.update({
                    where: { id: u.id },
                    data: {
                        favorites: {
                            disconnect: { id: oldKey }
                        }
                    }
                });
            } catch (e2) {
                // ignora
            }
        }
    }

    // Aliases que apontavam para o antigo canônico devem apontar para o novo
    await tx.mediaAlias.updateMany({
        where: { canonicalId: oldKey },
        data: { canonicalId: canonKey }
    });

    // Mantém URL antiga funcionando
    await ensureAlias(tx, oldKey, canonKey);

    // Remove duplicata
    await tx.mediaReference.delete({ where: { id: oldKey } });
};

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
        console.error('Erro na busca:', error);
        return res.status(500).json({ error: 'Falha ao buscar mídia' });
    }
};

export const getMediaDetails = async (req, res) => {
    const requestedId = String(req.params.id || '').trim();
    if (!requestedId) {
        return res.status(400).json({ error: 'ID de mídia inválido.' });
    }

    const refreshParam = String(req.query.refresh || '').toLowerCase();
    const forceRefresh = refreshParam === '1' || refreshParam === 'true' || refreshParam === 'yes';

    try {
        // 1) Resolve alias (se existir) para garantir página única no cache
        const alias = await prisma.mediaAlias.findUnique({
            where: { aliasId: requestedId }
        });

        const resolvedId = alias?.canonicalId ? String(alias.canonicalId).trim() : requestedId;

        // 2) Cache: se existe e não é refresh, retorna
        const cachedMedia = await hydrateMediaById(resolvedId);

        // Promoção sem refresh: se for álbum e já tivermos releaseGroupMbid no cache, garantimos id canônico
        if (cachedMedia && !forceRefresh) {
            const isAlbum = cachedMedia.type === 'album' && String(cachedMedia.id || '').startsWith('lastfm_');
            const rg = cachedMedia.externalIds?.releaseGroupMbid;

            if (isAlbum && looksLikeMbid(rg)) {
                const canonicalId = `lastfm_rg_${rg}`;
                if (canonicalId !== cachedMedia.id) {
                    await prisma.$transaction(async (tx) => {
                        // Cria/atualiza o canônico com o snapshot atual para manter consistente sem depender de refresh
                        await tx.mediaReference.upsert({
                            where: { id: canonicalId },
                            create: {
                                id: canonicalId,
                                type: cachedMedia.type,
                                titles: cachedMedia.titles,
                                synopses: cachedMedia.synopses,
                                posterUrl: cachedMedia.posterUrl,
                                backdropUrl: cachedMedia.backdropUrl,
                                releaseYear: cachedMedia.releaseYear,
                                tags: cachedMedia.tags || [],
                                externalIds: cachedMedia.externalIds || {},

                                runtime: cachedMedia.runtime,
                                director: cachedMedia.director,
                                genres: cachedMedia.genres,
                                countries: cachedMedia.countries,
                                details: cachedMedia.details
                            },
                            update: {
                                type: cachedMedia.type,
                                titles: cachedMedia.titles,
                                synopses: cachedMedia.synopses,
                                posterUrl: cachedMedia.posterUrl,
                                backdropUrl: cachedMedia.backdropUrl,
                                releaseYear: cachedMedia.releaseYear,
                                tags: cachedMedia.tags || [],
                                externalIds: cachedMedia.externalIds || {},

                                runtime: cachedMedia.runtime,
                                director: cachedMedia.director,
                                genres: cachedMedia.genres,
                                countries: cachedMedia.countries,
                                details: cachedMedia.details
                            }
                        });

                        // requestedId e resolvedId devem apontar para o canônico
                        await ensureAlias(tx, requestedId, canonicalId);
                        if (resolvedId !== requestedId) await ensureAlias(tx, resolvedId, canonicalId);

                        // migra a mídia antiga para o canônico (reviews/favoritos) e remove duplicata
                        await migrateMediaToCanonical(tx, cachedMedia.id, canonicalId);
                    });

                    const hydrated = await hydrateMediaById(canonicalId);
                    return res.json(hydrated || cachedMedia);
                }
            }

            // Garante que o alias de entrada exista quando o resolvedId é diferente
            if (resolvedId !== requestedId) {
                await prisma.mediaAlias.upsert({
                    where: { aliasId: requestedId },
                    create: { aliasId: requestedId, canonicalId: resolvedId },
                    update: { canonicalId: resolvedId }
                });
            }

            return res.json(cachedMedia);
        }

        // 3) Busca externa
        const [prefix, ...rest] = resolvedId.split('_');
        const externalId = rest.join('_');

        let externalData = null;

        if (prefix === 'tmdb') {
            externalData = await tmdb.getMovieData(externalId);
        } else if (prefix === 'rawg') {
            externalData = await rawg.getGameData(externalId);
        } else if (prefix === 'google' || prefix === 'ol') {
            externalData = await books.getBookData(resolvedId);
        } else if (prefix === 'lastfm') {
            externalData = await lastfm.getAlbumData(externalId);
        } else {
            return res.status(400).json({ error: 'Fonte de mídia desconhecida.' });
        }

        if (!externalData) {
            return res.status(404).json({ error: 'Mídia não encontrada na fonte externa.' });
        }

        const canonicalId = String(externalData.id || '').trim();
        if (!canonicalId) {
            return res.status(500).json({ error: 'Resposta inválida da fonte externa.' });
        }

        // 4) Persistência + alias + merge (transação)
        await prisma.$transaction(async (tx) => {
            // Salva/atualiza sempre no ID canônico retornado pelo adapter
            await tx.mediaReference.upsert({
                where: { id: canonicalId },
                create: {
                    id: canonicalId,
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

            // requestedId e resolvedId podem ser aliases do canônico
            await ensureAlias(tx, requestedId, canonicalId);
            if (resolvedId !== requestedId) await ensureAlias(tx, resolvedId, canonicalId);

            // Se já existia um MediaReference sob requestedId/resolvedId, migra e remove duplicata
            await migrateMediaToCanonical(tx, requestedId, canonicalId);
            if (resolvedId !== requestedId) await migrateMediaToCanonical(tx, resolvedId, canonicalId);
        });

            const hydrated = await hydrateMediaById(canonicalId);
            return res.json(hydrated);
    } catch (error) {
        console.error('Erro ao buscar detalhes da mídia:', error);
        return res.status(500).json({ error: 'Erro interno ao processar mídia.' });
    }
};
