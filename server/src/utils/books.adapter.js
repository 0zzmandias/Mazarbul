import axios from 'axios';

/**
 * BOOKS ADAPTER
 * * Este adaptador é responsável por extrair conteúdo do Google Books.
 * SEGUINDO O PLANO:
 * 1. A Identidade e os Dados Técnicos (Autor, Ano, País) vêm da WIKIDATA.
 * 2. O Google Books é usado apenas para buscar Sinopses (PT, EN, ES) e Capas.
 * 3. A busca é feita cruzando o Título e o Autor fornecidos pela Wikidata.
 */

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

const getGoogleBooksKey = () => process.env.GOOGLE_BOOKS_API_KEY || null;

/**
 * Tenta obter uma versão de maior resolução para a capa do livro.
 * Remove parâmetros restritivos e força o zoom de alta qualidade.
 */
const upgradeGoogleCoverUrl = (url) => {
    if (!url) return null;

    // Converte para HTTPS e remove parâmetros que bloqueiam o redimensionamento dinâmico
    let u = String(url).replace('http:', 'https:').split('&edge=curl')[0];

    // O Google Books oferece resoluções melhores no zoom=1 do que no zoom=5 (padrão).
    // Forçamos o zoom=1 sempre que detectarmos miniaturas (zoom 5 ou 0).
    if (u.includes('zoom=5') || u.includes('zoom=0')) {
        u = u.replace(/zoom=\d/, 'zoom=1');
    }

    return u;
};

/**
 * Helper para chamadas à API do Google Books com suporte a chave de API.
 */
const googleRequest = async (params) => {
    const key = getGoogleBooksKey();
    const finalParams = key ? { ...params, key } : params;
    try {
        const res = await axios.get(GOOGLE_BOOKS_URL, { params: finalParams });
        return res.data || {};
    } catch (error) {
        console.error('[GoogleBooks] Erro na requisição:', error.message);
        return {};
    }
};

/**
 * Busca uma sinopse válida em um idioma específico.
 * Filtra resultados para garantir que a descrição seja substancial e relevante.
 */
const fetchSynopsisInLanguage = async (title, author, lang) => {
    if (!title) return null;

    try {
        // Busca refinada usando operadores de título e autor para evitar falsos positivos
        const q = author ? `intitle:"${title}" inauthor:"${author}"` : `intitle:"${title}"`;

        const data = await googleRequest({
            q,
            langRestrict: lang,
            maxResults: 3,
            printType: 'books',
            orderBy: 'relevance'
        });

        const items = data.items || [];
        for (const item of items) {
            const info = item.volumeInfo || {};
            const desc = info.description;

            // Filtro de qualidade: aceita apenas descrições com tamanho mínimo
            if (desc && desc.length > 50) {
                // Captura a melhor imagem disponível seguindo a hierarquia do Google
                const thumbnail = info.imageLinks?.extraLarge ||
                info.imageLinks?.large ||
                info.imageLinks?.medium ||
                info.imageLinks?.thumbnail ||
                info.imageLinks?.smallThumbnail || null;

                return {
                    description: desc,
                    thumbnail: thumbnail,
                    id: item.id
                };
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * MOTOR DE ENRIQUECIMENTO TRILINGUE
 * Este é o método principal chamado pelo hydration.service.
 * @param {Object} titles - Objeto de títulos {PT, EN, ES} da Wikidata.
 * @param {string} author - Nome do autor vindo da Wikidata.
 */
export const getBookEnrichment = async ({ titles, author }) => {
    try {
        // Execução paralela para obter sinopses e metadados nos 3 idiomas.
        // CORREÇÃO: Usa títulos específicos por língua para garantir resultados locais.
        const [ptRes, enRes, esRes] = await Promise.all([
            fetchSynopsisInLanguage(titles.PT, author, 'pt'),
                                                        fetchSynopsisInLanguage(titles.EN, author, 'en'),
                                                        fetchSynopsisInLanguage(titles.ES, author, 'es')
        ]);

        const synopses = {
            PT: ptRes?.description || null,
            EN: enRes?.description || null,
            ES: esRes?.description || null,
            DEFAULT: enRes?.description || ptRes?.description || esRes?.description || null
        };

        // LÓGICA DE CAPA RESILIENTE:
        // 1. Prioriza a capa do resultado em Português (fidelidade à edição local).
        // 2. Fallback para Inglês (maior probabilidade de alta resolução).
        // 3. Fallback para Espanhol.
        const rawPoster = ptRes?.thumbnail || enRes?.thumbnail || esRes?.thumbnail || null;
        const posterUrl = upgradeGoogleCoverUrl(rawPoster);

        return {
            synopses,
            posterUrl,
            externalIds: {
                googleBooks: {
                    PT: ptRes?.id || null,
                    EN: enRes?.id || null,
                    ES: esRes?.id || null
                }
            }
        };
    } catch (error) {
        console.error('[BooksAdapter] Erro no enriquecimento trilingue:', error.message);
        return {
            synopses: { PT: null, EN: null, ES: null, DEFAULT: null },
            posterUrl: null
        };
    }
};

/**
 * Busca dados básicos por ID direto do Google Books.
 * Mantido para redundância e casos onde o ID já é conhecido.
 */
export const getBookData = async (googleId) => {
    try {
        const key = getGoogleBooksKey();
        const res = await axios.get(`${GOOGLE_BOOKS_URL}/${googleId}`, {
            params: key ? { key } : {}
        });

        const info = res.data?.volumeInfo || {};
        const desc = info.description || null;

        const rawImg = info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail || null;

        return {
            synopses: {
                PT: desc,
                EN: desc,
                ES: desc,
                DEFAULT: desc
            },
            posterUrl: upgradeGoogleCoverUrl(rawImg)
        };
    } catch (e) {
        console.error('[BooksAdapter] Erro ao buscar por ID:', e.message);
        return null;
    }
};
