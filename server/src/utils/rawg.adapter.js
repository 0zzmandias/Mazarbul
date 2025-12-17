import axios from 'axios';

const RAWG_API_URL = 'https://api.rawg.io/api';

const rawgClient = axios.create({
    baseURL: RAWG_API_URL
});

/**
 * Busca detalhes de um jogo na RAWG
 */
export const getGameData = async (rawgId) => {
    const apiKey = process.env.RAWG_API_KEY; // Lendo chave agora
    if (!apiKey) throw new Error("RAWG_API_KEY não configurada no .env");

    try {
        const response = await rawgClient.get(`/games/${rawgId}`, {
            params: { key: apiKey }
        });
        const data = response.data;

        const releaseYear = data.released ? new Date(data.released).getFullYear() : null;

        const genres = data.genres || [];
        const rawgTags = data.tags || [];

        const allTags = [...genres, ...rawgTags].map(t =>
        `tag.${t.slug.toLowerCase().replace(/-/g, '')}`
        );

        const synopsis = data.description_raw || data.description || "";

        return {
            id: `rawg_${data.id}`,
            type: 'jogo',
            titles: { DEFAULT: data.name },
            synopses: { EN: synopsis },
            posterUrl: data.background_image,
            backdropUrl: data.background_image_additional || data.background_image,
            releaseYear: releaseYear,
            tags: [...new Set(allTags)],
            externalIds: {
                rawg: data.id.toString(),
                slug: data.slug,
                metacritic: data.metacritic
            }
        };

    } catch (error) {
        console.error("Erro no RAWG Adapter:", error.message);
        throw new Error("Falha ao buscar dados do jogo.");
    }
};

/**
 * Busca jogos pelo nome
 */
export const searchGames = async (query) => {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) throw new Error("RAWG_API_KEY não configurada");

    const response = await rawgClient.get('/games', {
        params: {
            key: apiKey,
            search: query,
            page_size: 10
        }
    });

    return response.data.results.map(game => ({
        id: `rawg_${game.id}`,
        title: game.name,
        year: game.released ? game.released.split('-')[0] : '?',
                                              poster: game.background_image,
                                              type: 'jogo'
    }));
};
