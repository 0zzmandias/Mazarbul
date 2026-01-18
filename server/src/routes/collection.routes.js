import { Router } from 'express';
import {
    createCollection,
    addToCollection,
    removeFromCollection,
    listMyCollections
} from '../controllers/collection.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas abaixo exigem autenticação
router.use(authenticateToken);

// POST /api/collections
// Cria uma nova coleção
router.post('/', createCollection);

// GET /api/collections/my
// Lista coleções do usuário autenticado
router.get('/my', listMyCollections);

// POST /api/collections/add
// Adiciona uma mídia a uma coleção
router.post('/add', addToCollection);

// POST /api/collections/remove
// Remove uma mídia de uma coleção
router.post('/remove', removeFromCollection);

export default router;
