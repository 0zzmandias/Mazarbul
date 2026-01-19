import { Router } from 'express';
import {
    createClub,
    listClubs,
    getClubDetails,
    joinClub,
    leaveClub
} from '../controllers/club.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // <--- CORRIGIDO O NOME

const router = Router();

// Rota pública para descobrir clubes
router.get('/', listClubs);

// Rota protegida (precisa estar logado para ver detalhes completos de membro)
router.get('/:id', authenticateToken, getClubDetails); // <--- CORRIGIDO USO

// Rotas protegidas de ação
router.post('/', authenticateToken, createClub); // <--- CORRIGIDO USO
router.post('/:id/join', authenticateToken, joinClub); // <--- CORRIGIDO USO
router.post('/:id/leave', authenticateToken, leaveClub); // <--- CORRIGIDO USO

export default router;
