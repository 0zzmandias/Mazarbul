// src/constants/genres.js
//
// FACHADA (Facade) para gêneros.
// Motivo:
// - manter compatibilidade com imports existentes no projeto
// - separar implementação por domínio:
//   - jogos: ./game.genres.js
//   - livros: ./books.genres.js

export { GENRE_TRANSLATIONS, translateGenre } from "./game.genres";

export {
    BOOK_GENRE_TRANSLATIONS,
    classifyBookGenres,
    translateBookGenreKey,
    getBookGenresTop3
} from "./books.genres";
