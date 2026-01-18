import { Router } from 'express';
import { fetchUserAchievements } from '../controllers/achievement.controller.js';

const router = Router();

// GET /api/achievements/:userId
// Retorna o progresso de conquistas de um usuário específico
router.get('/:userId', fetchUserAchievements);

export default router;
