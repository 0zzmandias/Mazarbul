// src/constants/game.genres.js

export const GENRE_TRANSLATIONS = {
    "action": { pt: "Ação", es: "Acción" },
    "adventure": { pt: "Aventura", es: "Aventura" },
    "indie": { pt: "Indie", es: "Indie" },
    "rpg": { pt: "RPG", es: "RPG" },
    "strategy": { pt: "Estratégia", es: "Estrategia" },
    "shooter": { pt: "Tiro", es: "Shooter" },
    "casual": { pt: "Casual", es: "Casual" },
    "simulation": { pt: "Simulação", es: "Simulación" },
    "puzzle": { pt: "Quebra-Cabeça", es: "Puzles" },
    "arcade": { pt: "Arcade", es: "Arcade" },
    "platformer": { pt: "Plataforma", es: "Plataformas" },
    "racing": { pt: "Corrida", es: "Carreras" },
    "massively multiplayer": { pt: "MMO", es: "MMO" },
    "sports": { pt: "Esportes", es: "Deportes" },
    "fighting": { pt: "Luta", es: "Lucha" },
    "family": { pt: "Família", es: "Familia" },
    "board games": { pt: "Jogos de Tabuleiro", es: "Juegos de Mesa" },
    "educational": { pt: "Educacional", es: "Educativo" },
    "card": { pt: "Cartas", es: "Cartas" },
    "hack and slash": { pt: "Hack and Slash", es: "Hack and Slash" }
};

/**
 * Traduz o gênero de forma robusta.
 * Aceita strings sujas (com espaços), cases variados e retorna o idioma correto.
 */
export const translateGenre = (englishName, langCode = 'PT') => {
    if (!englishName || typeof englishName !== 'string') return "";

    // 1. Limpeza e Normalização
    const cleanString = englishName.replace('tag.', '').replace(/-/g, ' ').trim();
    const lowerKey = cleanString.toLowerCase();

    // 2. Detecção de Idioma
    const lang = langCode ? langCode.toLowerCase().split('-')[0] : 'pt';

    // Se o idioma do site for inglês, retorna o original limpo
    if (lang === 'en') return cleanString;

    // 3. Busca no Dicionário
    const entry = GENRE_TRANSLATIONS[lowerKey];

    // Se não encontrar, retorna o original (Fallback)
    if (!entry) return cleanString;

    // Retorna tradução ou fallback para PT
    return entry[lang] || entry['pt'] || cleanString;
};
