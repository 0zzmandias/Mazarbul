import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// POST http://localhost:3000/api/auth/register
router.post('/register', register);

// POST http://localhost:3000/api/auth/login
router.post('/login', login);

export default router;
