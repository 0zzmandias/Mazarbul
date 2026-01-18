import FavoriteService from '../services/favorite.service.js';

export const toggleFavorite = async (req, res) => {
    try {
        const userId = req.userId; // Middleware de auth
        const { mediaId } = req.body;

        if (!mediaId) {
            return res.status(400).json({ error: "O ID da mídia é obrigatório." });
        }

        const updatedUser = await FavoriteService.toggleFavorite(userId, mediaId);

        // Verifica se após a operação a mídia está na lista para retornar o status correto
        const isNowFavorite = updatedUser.favorites.some(f => f.id === mediaId);

        res.json({
            favorited: isNowFavorite,
            message: isNowFavorite ? "Mídia adicionada aos favoritos." : "Mídia removida dos favoritos."
        });
    } catch (error) {
        console.error("Erro ao alternar favorito:", error);
        res.status(500).json({ error: "Erro ao processar favorito. Certifique-se que a mídia existe no catálogo." });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const userId = req.userId;
        const favorites = await FavoriteService.getUserFavorites(userId);
        res.json(favorites);
    } catch (error) {
        console.error("Erro ao buscar favoritos:", error);
        res.status(500).json({ error: "Erro ao buscar lista de favoritos." });
    }
};

export const checkFavoriteStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { mediaId } = req.params;
        const isFavorited = await FavoriteService.isMediaFavorited(userId, mediaId);
        res.json({ favorited: isFavorited });
    } catch (error) {
        res.status(500).json({ error: "Erro ao verificar status de favorito." });
    }
};
