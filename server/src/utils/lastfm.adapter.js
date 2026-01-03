import axios from 'axios';

const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';

const lastFmClient = axios.create({
    baseURL: LASTFM_API_URL
});

export const getAlbumData = async (mbid) => {
    // A chave é lida em tempo de execução para evitar erros de inicialização
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) throw new Error("LASTFM_API_KEY não configurada");

    try {
        // Busca detalhes do álbum pelo MBID (MusicBrainz ID)
        // Usamos lang: 'pt' para tentar trazer a bio traduzida se existir
        const response = await lastFmClient.get('', {
            params: {
                method: 'album.getinfo',
                api_key: apiKey,
                mbid: mbid,
                format: 'json',
                    lang: 'pt'
            }
        });

        const album = response.data.album;
        if (!album) throw new Error("Álbum não encontrado no LastFM.");

        // Data de lançamento (LastFM retorna string complexa as vezes, tentamos extrair ano)
        const releaseYear = album.wiki?.published ? new Date(album.wiki.published).getFullYear() : null;

        // Tags (Gêneros)
        const tagsList = album.tags?.tag?.map(t => t.name) || [];
        // Normaliza para gamificação interna
        const tags = tagsList.map(t => `tag.${t.toLowerCase().replace(/\s+/g, '-')}`);

        // Lista de Faixas
        const tracks = album.tracks?.track?.map(t => t.name) || [];

        // Imagem (LastFM retorna array de tamanhos, pegamos a maior)
        const imageObj = album.image?.find(i => i.size === 'extralarge') || album.image?.find(i => i.size === 'large');
        const posterUrl = imageObj ? imageObj['#text'] : null;

        return {
            id: `lastfm_${mbid}`,
            type: 'album',

            titles: {
                PT: album.name, // LastFM geralmente não traduz nomes de álbum, repetimos
                EN: album.name
            },
            synopses: {
                PT: album.wiki?.summary || "Sem descrição disponível.",
                EN: album.wiki?.summary || "No description available."
            },

            posterUrl: posterUrl,
            backdropUrl: null, // LastFM não fornece backdrop (banner horizontal)

            releaseYear,
            runtime: null, // LastFM não soma a duração das faixas automaticamente na API padrão

            // Mapeamento: Artista vai para Director
            director: album.artist,

            genres: {
                PT: tagsList,
                EN: tagsList
            },

            countries: null,

            // Dados Específicos de Música
            details: {
                "Artista": album.artist,
                "Faixas": tracks.length > 0 ? `${tracks.length} músicas` : null,
                "Tracklist": tracks // Podemos usar isso no front se quisermos listar as músicas
            },

            tags,
            externalIds: {
                mbid: mbid,
                lastfm: album.url
            }
        };

    } catch (error) {
        console.error("Erro no LastFM Adapter:", error.message);
        throw new Error("Falha ao buscar álbum.");
    }
};

export const searchAlbums = async (query) => {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) throw new Error("LASTFM_API_KEY não configurada");

    const response = await lastFmClient.get('', {
        params: {
            method: 'album.search',
            api_key: apiKey,
            album: query,
            format: 'json',
                limit: 10
        }
    });

    // Filtramos resultados que não tenham MBID, pois precisamos dele para a página de detalhes
    return response.data.results.albummatches.album
    .filter(album => album.mbid && album.mbid !== "")
    .map(album => ({
        id: `lastfm_${album.mbid}`,
        title: album.name,
        artist: album.artist, // Útil para mostrar "Nome do Album - Artista" na busca
        year: '?', // Search do LastFM infelizmente não retorna ano
        poster: album.image?.find(i => i.size === 'large')?.['#text'],
                   type: 'album'
    }));
};
