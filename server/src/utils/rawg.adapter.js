import axios from 'axios';

const RAWG_API_URL = 'https://api.rawg.io/api';

const rawgClient = axios.create({
    baseURL: RAWG_API_URL
});

export const getGameData = async (rawgId) => {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) throw new Error("RAWG_API_KEY não configurada");

    try {
        const response = await rawgClient.get(`/games/${rawgId}`, {
            params: { key: apiKey }
        });

        const data = response.data;
        const releaseYear = data.released ? new Date(data.released).getFullYear() : null;

        // === TAGS INTERNAS (Gamificação) ===
        // Juntamos tags e gêneros para o sistema de troféus
        const tags = data.tags ? data.tags.map(t => `tag.${t.slug}`) : [];
        if (data.genres) {
            data.genres.forEach(g => tags.push(`tag.${g.slug}`));
        }

        // === DADOS TÉCNICOS ===
        // Desenvolvedora Principal (equivale a Diretor em filmes)
        const developer = data.developers && data.developers.length > 0 ? data.developers[0].name : null;

        // Gêneros para exibição (RAWG retorna em inglês)
        const genreNames = data.genres ? data.genres.map(g => g.name) : [];

        // Plataformas (Ex: ["PC", "PlayStation 5", "Xbox Series S/X"])
        const platforms = data.platforms ? data.platforms.map(p => p.platform.name) : [];

        // Duração: RAWG manda em horas, convertemos para minutos
        const runtimeMinutes = data.playtime ? data.playtime * 60 : null;

        return {
            id: `rawg_${data.id}`,
            type: 'jogo',

            titles: {
                EN: data.name,
                PT: data.name // RAWG raramente traduz títulos, usamos o original
            },
            synopses: {
                EN: data.description_raw || data.description,
                PT: data.description_raw || data.description // Fallback para EN
            },

            posterUrl: data.background_image,
            // Jogos usam a mesma imagem para backdrop ou uma adicional se existir
            backdropUrl: data.background_image_additional || data.background_image,

            releaseYear,
            runtime: runtimeMinutes,
            director: developer, // Mapeado para Developer

            // === NOVOS CAMPOS ===
            genres: {
                EN: genreNames,
                PT: genreNames // Usamos EN como fallback visual para não quebrar a tela
            },

            countries: null, // Jogos raramente têm "país de origem" claro na API básica

            // Campo flexível para dados específicos de jogos
            details: {
                "Plataformas": platforms,
                "Metacritic": data.metacritic
            },

            tags,
            externalIds: {
                rawg: data.id.toString(),
                website: data.website
            }
        };

    } catch (error) {
        console.error("Erro no RAWG Adapter:", error.message);
        throw new Error("Falha ao buscar jogo.");
    }
};

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
