import axios from 'axios';

/**
 * TMDB ADAPTER
 * * Este adaptador é responsável por buscar dados do The Movie Database.
 * Seguindo o plano estabelecido:
 * - A WIKIDATA é a fonte da verdade para Identidade, Títulos Oficiais e Dados Técnicos.
 * - O TMDB é usado EXCLUSIVAMENTE para enriquecer com Sinopses e Imagens.
 * - Dados como Diretor e Ano são ignorados aqui para evitar conflito com a Wikidata.
 * - O dado de Duração (Runtime) foi completamente descartado.
 */

const TMDB_API_URL = 'https://api.themoviedb.org/3';

// Instância base do Axios para o TMDB
const tmdbClient = axios.create({
    baseURL: TMDB_API_URL
});

/**
 * Busca detalhes completos de um filme (Sinopses e Posters) em 3 idiomas.
 * @param {string|number} tmdbId - O ID numérico do filme no TMDB.
 * @returns {Object} Objeto contendo sinopses, imagens e metadados de identificação.
 */
export const getMovieData = async (tmdbId) => {
    // A chave é lida no momento da execução para garantir que o dotenv já carregou
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error("TMDB_API_KEY não configurada no arquivo .env");
    }

    try {
        const params = { api_key: apiKey };

        /**
         * Realizamos requisições paralelas para obter a sinopse oficial
         * nas três línguas suportadas pelo Mazarbul.
         */
        const [ptRes, enRes, esRes] = await Promise.all([
            tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'pt-BR' } }),
                                                        tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'en-US' } }),
                                                        tmdbClient.get(`/movie/${tmdbId}`, { params: { ...params, language: 'es-ES' } })
        ]);

        const ptData = ptRes.data;
        const enData = enRes.data;
        const esData = esRes.data;

        /**
         * Tags baseadas nos gêneros em Inglês.
         * Embora os gêneros oficiais venham da Wikidata, as tags do TMDB
         * podem auxiliar na lógica interna de gamificação/troféus se necessário.
         */
        const tags = enData.genres?.map(g =>
        `tag.${g.name.toLowerCase().replace(/\s+/g, '-')}`
        ) || [];

        /**
         * Códigos ISO de países de produção.
         * Servirão como fallback caso a Wikidata não forneça o país de origem.
         */
        const getCountriesList = (data) =>
        data.production_countries?.map(c => c.iso_3166_1) || [];

        // Montagem do objeto de retorno seguindo as restrições do plano
        return {
            id: `tmdb_${tmdbId}`,
            type: 'filme',

            // --- TÍTULOS (Backup visual, a prioridade é a Wikidata) ---
            titles: {
                PT: ptData.title,
                EN: enData.title,
                ES: esData.title
            },

            // --- CONTEÚDO TEXTUAL (Fonte Primária) ---
            synopses: {
                PT: ptData.overview,
                EN: enData.overview,
                ES: esData.overview
            },

            // --- CONTEÚDO VISUAL (Fonte Primária) ---
            posterUrl: ptData.poster_path
            ? `https://image.tmdb.org/t/p/w500${ptData.poster_path}`
            : null,
            backdropUrl: ptData.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${ptData.backdrop_path}`
            : null,

            // --- DADOS TÉCNICOS DE APOIO (Fallback) ---
            // Nota: Diretor, Ano e Gêneros principais serão injetados via Wikidata no hydration.service
            countries: {
                PT: getCountriesList(ptData),
                EN: getCountriesList(enData),
                ES: getCountriesList(esData)
            },

            tags: tags,
            externalIds: {
                tmdb: tmdbId.toString(),
                imdb: ptData.imdb_id
            }

            /** * OBSERVAÇÃO:
             * Campos como 'runtime' (duração) e 'director' foram removidos
             * para cumprir a regra de que o dado técnico vem da Wikidata
             * ou é descartado (caso da duração).
             */
        };

    } catch (error) {
        console.error("Erro no TMDB Adapter (getMovieData):", error.message);
        throw new Error("Falha ao buscar as sinopses e posters do filme no TMDB.");
    }
};

/**
 * Busca filmes pelo nome para auxiliar na localização de IDs.
 * @param {string} query - Nome do filme.
 * @returns {Array} Lista de resultados básicos.
 */
export const searchMovies = async (query) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("TMDB_API_KEY não configurada");

    try {
        const response = await tmdbClient.get('/search/movie', {
            params: {
                api_key: apiKey,
                query: query,
                language: 'pt-BR',
                page: 1
            }
        });

        return response.data.results.map(movie => ({
            id: `tmdb_${movie.id}`,
            title: movie.title,
            year: movie.release_date ? movie.release_date.split('-')[0] : '?',
                                                   poster: movie.poster_path
                                                   ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                                                   : null,
                                                   type: 'filme'
        }));
    } catch (error) {
        console.error("Erro no TMDB Adapter (searchMovies):", error.message);
        return [];
    }
};
