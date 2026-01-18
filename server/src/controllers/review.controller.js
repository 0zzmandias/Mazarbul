import ReviewService from '../services/review.service.js';
import { checkAndUnlockAchievements } from '../services/gamification.service.js';

// Criar ou Editar Review
export const upsertReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { mediaId, rating, content, tags, containsSpoilers } = req.body;

        if (!mediaId || rating === undefined) {
            return res.status(400).json({ error: "MediaId e Rating são obrigatórios." });
        }

        const review = await ReviewService.upsertReview({
            userId,
            mediaId,
            rating,
            content,
            tags,
            containsSpoilers
        });

        const gamificationResult = await checkAndUnlockAchievements(userId);

        res.status(201).json({
            review,
            achievements: gamificationResult?.newUnlocks || []
        });

    } catch (error) {
        console.error("Erro ao salvar review:", error);
        res.status(500).json({ error: "Erro interno ao processar review." });
    }
};

// Listar Reviews de uma Mídia
export const getMediaReviews = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const reviews = await ReviewService.getReviewsByMedia(mediaId);
        res.json(reviews);
    } catch (error) {
        console.error("Erro ao buscar reviews da mídia:", error);
        res.status(500).json({ error: "Erro ao buscar reviews." });
    }
};

// NOVO: Listar Reviews de um Usuário
export const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await ReviewService.getUserReviews(userId);
        res.json(reviews);
    } catch (error) {
        console.error("Erro ao buscar reviews do usuário:", error);
        res.status(500).json({ error: "Erro ao buscar reviews do usuário." });
    }
};

// Deletar Review
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        await ReviewService.deleteReview(id, userId);
        res.json({ message: "Review removida com sucesso." });
    } catch (error) {
        console.error("Erro ao deletar review:", error);
        res.status(500).json({ error: "Erro ao remover review." });
    }
};
