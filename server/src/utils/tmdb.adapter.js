import axios from 'axios';

const TMDB_API_URL = 'https://api.themoviedb.org/3';

// Criamos o cliente sem a chave por enquanto
const tmdbClient = axios.create({
    baseURL: TMDB_API_URL
});

/**
 * Busca detalhes completos de um filme em múltiplos idiomas
 */
export const getMovieData = async (tmdbId) => {
    // LER A CHAVE AGORA (RUNTIME) - Garante que o .env já carregou
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("TMDB_API_KEY não configurada no .env");

    try {
        // Adicionamos a api_key em cada requisição explicitamente
        const params = { api_key: apiKey };

        const [ptRes, enRes, esRes] = await Promise.all([
            tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'pt-BR' } }),
                                                        tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'en-US' } }),
                                                        tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'es-ES' } })
        ]);

        const ptData = ptRes.data;
        const enData = enRes.data;
        const esData = esRes.data;

        const releaseYear = ptData.release_date ? new Date(ptData.release_date).getFullYear() : null;
        const tags = enData.genres.map(g => `tag.${g.name.toLowerCase().replace(/\s+/g, '-')}`);

        return {
            id: `tmdb_${tmdbId}`,
            type: 'filme',
            titles: {
                PT: ptData.title,
                EN: enData.title,
                ES: esData.title
            },
            synopses: {
                PT: ptData.overview,
                EN: enData.overview,
                ES: esData.overview
            },
            posterUrl: `https://image.tmdb.org/t/p/w500${ptData.poster_path}`,
            backdropUrl: `https://image.tmdb.org/t/p/w1280${ptData.backdrop_path}`,
            releaseYear: releaseYear,
            tags: tags,
            externalIds: {
                tmdb: tmdbId.toString(),
                imdb: ptData.imdb_id
            }
        };

    } catch (error) {
        console.error("Erro no TMDB Adapter:", error.message);
        throw new Error("Falha ao buscar dados do filme no TMDB.");
    }
};

/**
 * Busca filmes pelo nome
 */
export const searchMovies = async (query) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("TMDB_API_KEY não configurada");

    const response = await tmdbClient.get('/search/movie', {
        params: {
            api_key: apiKey, // Passando a chave aqui
            query,
            language: 'pt-BR',
            page: 1
        }
    });

    return response.data.results.map(movie => ({
        id: `tmdb_${movie.id}`,
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : '?',
                                               poster: movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null,
                                               type: 'filme'
    }));
};
