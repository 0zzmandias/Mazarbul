import { Router } from 'express';
import {
    createClub,
    listClubs,
    getClubDetails,
    joinClub,
    leaveClub,
    updateClub // <--- ADICIONADO AQUI
} from '../controllers/club.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rota pública para descobrir clubes
router.get('/', listClubs);

// Rota protegida (precisa estar logado para ver detalhes completos de membro)
router.get('/:id', authenticateToken, getClubDetails);

// Rotas protegidas de ação
router.post('/', authenticateToken, createClub);
router.put('/:id', authenticateToken, updateClub); // <--- NOVA ROTA DE EDIÇÃO ADICIONADA
router.post('/:id/join', authenticateToken, joinClub);
router.post('/:id/leave', authenticateToken, leaveClub);

export default router;
