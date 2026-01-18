import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = Router();

// POST http://localhost:3000/api/auth/register
router.post('/register', register);

// POST http://localhost:3000/api/auth/login
router.post('/login', login);

// Rota para persistência de login (Dashboard)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                handle: true,
                email: true,
                avatarUrl: true
            }
        });

        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        res.json(user);
    } catch (error) {
        console.error("Erro no /me:", error);
        res.status(500).json({ error: "Erro ao buscar sessão" });
    }
});

export default router;
