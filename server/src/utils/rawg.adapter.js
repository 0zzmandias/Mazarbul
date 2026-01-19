import axios from 'axios';

/**
 * RAWG ADAPTER
 * Responsável pelo enriquecimento de dados de jogos.
 * Segundo o planejamento:
 * 1. Títulos, Sinopses e GÊNEROS são extraídos do RAWG.
 * 2. Gêneros não são traduzidos (mantêm o original/EN do RAWG).
 */

const RAWG_API_URL = 'https://api.rawg.io/api';

const rawgClient = axios.create({
    baseURL: RAWG_API_URL,
    timeout: 10000
});

/**
 * Busca dados detalhados de um jogo pelo ID do RAWG.
 * @param {string|number} rawgId - O ID numérico da API RAWG.
 */
export const getGameData = async (rawgId) => {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) throw new Error("RAWG_API_KEY não configurada no ambiente.");

    try {
        const response = await rawgClient.get(`/games/${rawgId}`, {
            params: { key: apiKey }
        });

        const data = response.data;

        // Título e Sinopse: Mantemos o valor original (geralmente EN).
        const mainTitle = data.name;
        const mainSynopsis = data.description_raw || data.description || "";

        // GÊNEROS: Extraídos diretamente do RAWG conforme solicitado.
        const genreNames = data.genres ? data.genres.map(g => g.name) : [];

        // Desenvolvedora (Mapeado para 'director' no nosso schema centralizado)
        const developer = data.developers && data.developers.length > 0 ? data.developers[0].name : null;

        // Ano de lançamento
        const releaseYear = data.released ? new Date(data.released).getFullYear() : null;

        return {
            id: `rawg_${data.id}`,
            type: 'jogo',

            titles: {
                PT: mainTitle,
                EN: mainTitle,
                ES: mainTitle,
                DEFAULT: mainTitle
            },

            synopses: {
                PT: mainSynopsis,
                EN: mainSynopsis,
                ES: mainSynopsis,
                DEFAULT: mainSynopsis
            },

            // Imagens
            posterUrl: data.background_image,
            backdropUrl: data.background_image_additional || data.background_image,

            // Dados Técnicos
            releaseYear,
            director: developer,

            // GÊNEROS DO RAWG: Respeita a regra de não tradução para jogos
            genres: {
                PT: genreNames,
                EN: genreNames,
                ES: genreNames,
                DEFAULT: genreNames
            },

            details: {
                technical: {
                    platforms: data.platforms ? data.platforms.map(p => p.platform.name) : [],
                    metacritic: data.metacritic,
                    playtime: data.playtime,
                    website: data.website
                }
            },

            externalIds: {
                rawg: String(data.id)
            }
        };

    } catch (error) {
        console.error("[RAWG Adapter] Erro ao buscar detalhes do jogo:", error.message);
        return null;
    }
};

/**
 * Busca simplificada para resultados de pesquisa.
 */
export const searchGames = async (query) => {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) return [];

    try {
        const response = await rawgClient.get('/games', {
            params: {
                key: apiKey,
                search: query,
                page_size: 15
            }
        });

        return (response.data.results || []).map(game => ({
            id: `rawg_${game.id}`,
            title: game.name,
            year: game.released ? game.released.split('-')[0] : null,
                                                          poster: game.background_image,
                                                          type: 'jogo'
        }));
    } catch (error) {
        console.error("[RAWG Adapter] Erro na busca:", error.message);
        return [];
    }
};
