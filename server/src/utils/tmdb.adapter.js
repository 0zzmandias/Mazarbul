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

        // Requisições paralelas para pegar dados localizados
        // append_to_response: 'credits' traz o diretor na chamada PT
        const [ptRes, enRes, esRes] = await Promise.all([
            tmdbClient.get(`/movie/${tmdbId}`, {
                params: { ...params, language: 'pt-BR', append_to_response: 'credits' }
            }),
            tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'en-US' } }),
                                                        tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'es-ES' } })
        ]);

        const ptData = ptRes.data;
        const enData = enRes.data;
        const esData = esRes.data;

        const releaseYear = ptData.release_date ? new Date(ptData.release_date).getFullYear() : null;

        // Tags baseadas no Inglês (Padrão do sistema para Gamificação/Troféus)
        // Mantemos isso para lógica interna.
        const tags = enData.genres.map(g => `tag.${g.name.toLowerCase().replace(/\s+/g, '-')}`);

        // Extração do Diretor (da resposta PT)
        const director = ptData.credits?.crew?.find(person => person.job === 'Director')?.name || null;

        // === FUNÇÕES AUXILIARES ===
        const getGenresList = (data) => data.genres?.map(g => g.name) || [];

        // MUDANÇA AQUI: Pegamos o código ISO (ex: "US", "BR") em vez do nome em inglês
        const getCountriesList = (data) => data.production_countries?.map(c => c.iso_3166_1) || [];

        return {
            id: `tmdb_${tmdbId}`,
            type: 'filme',

            // Dados Traduzidos (Títulos e Sinopses)
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

            // === NOVOS DADOS PARA EXIBIÇÃO ===
            genres: {
                PT: getGenresList(ptData),
                EN: getGenresList(enData),
                ES: getGenresList(esData)
            },
            // Salvamos códigos universais para o país
            countries: {
                PT: getCountriesList(ptData),
                EN: getCountriesList(enData),
                ES: getCountriesList(esData)
            },

            posterUrl: `https://image.tmdb.org/t/p/w500${ptData.poster_path}`,
            backdropUrl: `https://image.tmdb.org/t/p/w1280${ptData.backdrop_path}`,

            releaseYear: releaseYear,
            runtime: ptData.runtime, // Duração em minutos
            director: director,      // Nome do Diretor

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
            api_key: apiKey,
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
