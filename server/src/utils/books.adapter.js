import axios from 'axios';

const OPEN_LIBRARY_URL = 'https://openlibrary.org';
const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

const olClient = axios.create({
    baseURL: OPEN_LIBRARY_URL
});

export const getBookData = async (workId) => {
    const googleKey = process.env.GOOGLE_BOOKS_KEY; // Leitura Runtime

    try {
        // 1. Open Library (Base)
        const workRes = await olClient.get(`/works/${workId}.json`);
        const workData = workRes.data;

        let finalTitle = workData.title;
        let finalDescription = "";
        let finalCover = null;
        let isbnFound = null;
        const releaseYear = workData.first_publish_date ? parseInt(workData.first_publish_date.match(/\d{4}/)[0]) : null;

        if (workData.description) {
            finalDescription = typeof workData.description === 'string'
            ? workData.description
            : workData.description.value || "";
        }

        // 2. Edição e ISBN
        const editionsRes = await olClient.get(`/works/${workId}/editions.json`, {
            params: { limit: 1 }
        });

        if (editionsRes.data.entries && editionsRes.data.entries.length > 0) {
            const edition = editionsRes.data.entries[0];
            if (edition.isbn_13) isbnFound = edition.isbn_13[0];
            else if (edition.isbn_10) isbnFound = edition.isbn_10[0];

            if (edition.covers && edition.covers.length > 0) {
                finalCover = `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`;
            }
        }

        // 3. Google Books (Enriquecimento)
        let googleData = null;
        let googleId = null;

        if (isbnFound && googleKey) {
            try {
                const googleRes = await axios.get(GOOGLE_BOOKS_URL, {
                    params: { q: `isbn:${isbnFound}`, key: googleKey }
                });

                if (googleRes.data.items && googleRes.data.items.length > 0) {
                    googleData = googleRes.data.items[0].volumeInfo;
                    googleId = googleRes.data.items[0].id;

                    if (googleData.imageLinks?.thumbnail) {
                        finalCover = googleData.imageLinks.thumbnail.replace('http:', 'https:').replace('&edge=curl', '');
                    }
                    if (googleData.description) {
                        finalDescription = googleData.description;
                    }
                }
            } catch (err) {
                console.warn("Google Books falhou ou chave inválida, seguindo apenas com OL.");
            }
        }

        const tags = (workData.subjects || [])
        .slice(0, 10)
        .map(s => `tag.${s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`);

        return {
            id: `ol_${workId}`,
            type: 'livro',
            titles: { DEFAULT: finalTitle },
            synopses: { DEFAULT: finalDescription },
            posterUrl: finalCover,
            backdropUrl: null,
            releaseYear: releaseYear,
            tags: tags,
            externalIds: {
                openLibrary: workId,
                isbn: isbnFound,
                googleBooksId: googleId
            }
        };

    } catch (error) {
        console.error("Erro no Books Adapter:", error.message);
        throw new Error("Falha ao buscar dados do livro.");
    }
};

export const searchBooks = async (query) => {
    const response = await olClient.get('/search.json', {
        params: {
            q: query,
            limit: 10,
            fields: 'key,title,author_name,first_publish_year,cover_i'
        }
    });

    return response.data.docs.map(book => ({
        id: `ol_${book.key.replace('/works/', '')}`,
                                           title: book.title,
                                           author: book.author_name ? book.author_name[0] : 'Desconhecido',
                                           year: book.first_publish_year || '?',
                                           poster: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                                           type: 'livro'
    }));
};
