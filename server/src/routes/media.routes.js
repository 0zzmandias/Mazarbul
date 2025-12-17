import { Router } from 'express';
import { searchMedia, getMediaDetails } from '../controllers/media.controller.js';

const router = Router();

// GET /api/media/search?q=Duna&type=filme
router.get('/search', searchMedia);

// GET /api/media/tmdb_550
// O ":id" captura qualquer string que venha depois da barra
router.get('/:id', getMediaDetails);

export default router;
