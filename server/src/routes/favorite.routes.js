import { Router } from 'express';
import {
    toggleFavorite,
    getFavorites,
    checkFavoriteStatus
} from '../controllers/favorite.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/favorites/toggle
// Inverte o estado de favorito (Login obrigatório)
router.post('/toggle', authenticateToken, toggleFavorite);

// GET /api/favorites
// Lista os favoritos do usuário logado (Login obrigatório)
router.get('/', authenticateToken, getFavorites);

// GET /api/favorites/status/:mediaId
// Verifica se uma mídia específica é favorita (Login obrigatório)
router.get('/status/:mediaId', authenticateToken, checkFavoriteStatus);

export default router;
