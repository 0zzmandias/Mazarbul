import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/users/profile/:handle
// Rota pública para visualização de perfis.
// A lógica de busca agora está no user.controller.js -> getProfile
router.get('/profile/:handle', getProfile);

// PUT /api/users/profile
// Rota privada para edição do próprio perfil.
// A lógica de update agora está no user.controller.js -> updateProfile
router.put('/profile', authenticateToken, updateProfile);

export default router;
