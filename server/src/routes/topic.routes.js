import { Router } from 'express';
import {
    createTopic,
    listTopics,
    getTopicDetails,
    replyToTopic,
    togglePinTopic,   // <--- NOVO
    toggleLockTopic   // <--- NOVO
} from '../controllers/topic.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Criar tópico
router.post('/', authenticateToken, createTopic);

// Listar tópicos (geralmente filtrado por ?clubId=...)
router.get('/', listTopics);

// Ler detalhes de um tópico específico
router.get('/:id', getTopicDetails);

// Responder a um tópico
router.post('/:id/reply', authenticateToken, replyToTopic);

// Rotas de Moderação (Novas)
router.patch('/:id/pin', authenticateToken, togglePinTopic);
router.patch('/:id/lock', authenticateToken, toggleLockTopic);

export default router;
