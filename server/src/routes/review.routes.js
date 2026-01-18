import { Router } from 'express';
import {
    upsertReview,
    getMediaReviews,
    getUserReviews,
    deleteReview
} from '../controllers/review.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/reviews
// Criar ou Editar (Login obrigatório)
router.post('/', authenticateToken, upsertReview);

// GET /api/reviews/:mediaId
// Listar por mídia (Público)
router.get('/:mediaId', getMediaReviews);

// GET /api/reviews/user/:userId
// Listar por usuário (Público)
router.get('/user/:userId', getUserReviews);

// DELETE /api/reviews/:id
// Deletar (Login obrigatório)
router.delete('/:id', authenticateToken, deleteReview);

export default router;
