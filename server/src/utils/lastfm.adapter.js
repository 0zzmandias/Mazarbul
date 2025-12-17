import axios from 'axios';

const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';

const lastfmClient = axios.create({
    baseURL: LASTFM_API_URL
});

/**
 * Busca detalhes de um álbum
 */
export const getAlbumData = async (mbid) => {
    const apiKey = process.env.LASTFM_API_KEY; // Lendo chave agora
    if (!apiKey) throw new Error("LASTFM_API_KEY não configurada no .env");

    try {
        const response = await lastfmClient.get('', {
            params: {
                api_key: apiKey,
                format: 'json',
                    method: 'album.getinfo',
                    mbid: mbid
            }
        });

        const album = response.data.album;
        if (!album) throw new Error("Álbum não encontrado.");

        const tags = (album.toptags?.tag || []).map(t =>
        `tag.${t.name.toLowerCase().replace(/\s+/g, '-')}`
        );

        const images = album.image || [];
        const bestImage = images.length > 0 ? images[images.length - 1]['#text'] : null;

        const wikiContent = album.wiki ? album.wiki.content : "";
        const cleanWiki = wikiContent.replace(/<a href=".*">.*<\/a>/g, '').trim();

        return {
            id: `lastfm_${mbid}`,
            type: 'album',
            titles: { DEFAULT: album.name },
            synopses: { EN: cleanWiki, PT: "" },
            posterUrl: bestImage,
            backdropUrl: null,
            releaseYear: null,
            tags: tags,
            externalIds: {
                mbid: mbid,
                artist: album.artist
            }
        };

    } catch (error) {
        console.error("Erro no Last.fm Adapter:", error.message);
        throw new Error("Falha ao buscar dados do álbum.");
    }
};

/**
 * Busca álbuns pelo nome
 */
export const searchAlbums = async (query) => {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) throw new Error("LASTFM_API_KEY não configurada");

    const response = await lastfmClient.get('', {
        params: {
            api_key: apiKey,
            format: 'json',
                method: 'album.search',
                album: query,
                limit: 10
        }
    });

    const albums = response.data.results?.albummatches?.album || [];

    return albums
    .filter(a => a.mbid && a.mbid !== "")
    .map(album => ({
        id: `lastfm_${album.mbid}`,
        title: album.name,
        artist: album.artist,
        poster: album.image && album.image[2] ? album.image[2]['#text'] : null,
        type: 'album'
    }));
};
