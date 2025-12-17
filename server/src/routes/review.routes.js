import { Router } from 'express';
import { upsertReview, getMediaReviews } from '../controllers/review.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/reviews
// Exige Login (authenticateToken)
router.post('/', authenticateToken, upsertReview);

// GET /api/reviews/:mediaId
// Público (Qualquer um pode ler reviews)
router.get('/:mediaId', getMediaReviews);

export default router;
