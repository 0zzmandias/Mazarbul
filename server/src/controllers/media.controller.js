import { PrismaClient } from '@prisma/client';
import { searchMovies, getMovieData } from '../utils/tmdb.adapter.js';
import { searchGames, getGameData } from '../utils/rawg.adapter.js';
import { searchBooks, getBookData } from '../utils/books.adapter.js';
import { searchAlbums, getAlbumData } from '../utils/lastfm.adapter.js';

const prisma = new PrismaClient();

// ==========================================
// 1. BUSCA UNIFICADA (SEARCH)
// ==========================================
export const searchMedia = async (req, res) => {
    try {
        const { q, type } = req.query;

        if (!q) {
            return res.status(400).json({ error: "Termo de busca (q) é obrigatório." });
        }

        let results = [];

        // Decide qual API chamar com base no filtro 'type'
        switch (type) {
            case 'filme':
                results = await searchMovies(q);
                break;
            case 'jogo':
                results = await searchGames(q);
                break;
            case 'livro':
                results = await searchBooks(q);
                break;
            case 'album':
                results = await searchAlbums(q);
                break;
            default:
                // Se não vier tipo (ex: busca global), poderíamos buscar todos,
                // mas por performance/limites de API, vamos pedir que o front especifique.
                return res.status(400).json({ error: "Tipo de mídia inválido ou não informado." });
        }

        res.json(results);

    } catch (error) {
        console.error("Erro na busca:", error);
        res.status(500).json({ error: "Erro ao buscar mídia nas APIs externas." });
    }
};

// ==========================================
// 2. DETALHES + CACHE (GET BY ID)
// ==========================================
export const getMediaDetails = async (req, res) => {
    try {
        const { id } = req.params; // Ex: "tmdb_550", "ol_OL123W"

        // 1. VERIFICAR NO CACHE (BANCO LOCAL)
        // Se já temos essa mídia salva, retornamos ela instantaneamente.
        const existingMedia = await prisma.mediaReference.findUnique({
            where: { id }
        });

        if (existingMedia) {
            console.log(`[CACHE] Retornando do banco: ${id}`);
            return res.json(existingMedia);
        }

        // 2. BUSCAR NA API EXTERNA (Se não estiver no cache)
        console.log(`[API] Buscando externamente: ${id}`);

        let mediaData = null;

        // Identifica o prefixo do ID para saber qual adapter usar
        if (id.startsWith('tmdb_')) {
            const tmdbId = id.replace('tmdb_', '');
            mediaData = await getMovieData(tmdbId);
        }
        else if (id.startsWith('rawg_')) {
            const rawgId = id.replace('rawg_', '');
            mediaData = await getGameData(rawgId);
        }
        else if (id.startsWith('ol_')) {
            const workId = id.replace('ol_', '');
            mediaData = await getBookData(workId);
        }
        else if (id.startsWith('lastfm_')) {
            const mbid = id.replace('lastfm_', '');
            mediaData = await getAlbumData(mbid);
        }
        else {
            return res.status(400).json({ error: "ID de mídia inválido ou desconhecido." });
        }

        // 3. SALVAR NO BANCO (CACHE)
        // Salvamos agora para que a próxima leitura seja rápida e para permitir relações (reviews)
        const savedMedia = await prisma.mediaReference.create({
            data: mediaData
        });

        res.json(savedMedia);

    } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
        res.status(500).json({ error: "Não foi possível carregar os detalhes da mídia." });
    }
};
