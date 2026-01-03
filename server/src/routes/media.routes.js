import { Router } from 'express';
import { searchMedia, getMediaDetails } from '../controllers/media.controller.js';

const router = Router();

// 1. A Rota de Busca DEVE vir antes da rota de ID
// GET /api/media/search?q=Avatar&type=filme
router.get('/search', searchMedia);

// 2. Rota de Detalhes
// GET /api/media/tmdb_550
router.get('/:id', getMediaDetails);

export default router;
