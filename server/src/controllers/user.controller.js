import UserService from '../services/user.service.js';

export const getProfile = async (req, res) => {
    try {
        const { handle } = req.params;

        // Ajuste: Removemos o '@' para bater com o que está no banco (alexl)
        const dbHandle = handle.replace('@', '');

        const user = await UserService.getUserByHandle(dbHandle);

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        res.json(user);
    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ error: "Erro interno ao buscar perfil" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, bio, avatarUrl } = req.body;

        const updatedUser = await UserService.updateProfile(userId, {
            name,
            bio,
            avatarUrl
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
};
