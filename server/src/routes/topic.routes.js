import { Router } from 'express';
import {
    createTopic,
    listTopics,
    getTopicDetails,
    replyToTopic
} from '../controllers/topic.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // <--- CORRIGIDO O NOME

const router = Router();

// Listar tópicos (ex: /api/topics?clubId=...)
router.get('/', listTopics);

// Detalhes do tópico (ex: /api/topics/:id)
router.get('/:id', getTopicDetails);

// Criar tópico (requer login)
router.post('/', authenticateToken, createTopic); // <--- CORRIGIDO USO

// Responder tópico (requer login)
router.post('/:id/replies', authenticateToken, replyToTopic); // <--- CORRIGIDO USO

export default router;
