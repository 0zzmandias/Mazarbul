import { getUserAchievements } from '../services/gamification.service.js';

/**
 * Obtém a lista de conquistas de um usuário.
 * Pode ser o próprio usuário logado ou outro perfil.
 */
export const fetchUserAchievements = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: "O ID do usuário é obrigatório." });
        }

        const achievements = await getUserAchievements(userId);
        res.json(achievements);
    } catch (error) {
        console.error("Erro ao buscar conquistas do usuário:", error);
        res.status(500).json({ error: "Erro interno ao buscar conquistas." });
    }
};
