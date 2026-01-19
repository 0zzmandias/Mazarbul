import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mediaRoutes from './routes/media.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import clubRoutes from './routes/club.routes.js';
import topicRoutes from './routes/topic.routes.js'; // <--- NOVA IMPORTAÇÃO

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de CORS ajustada para permitir comunicação segura com o Frontend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// AUMENTO DO LIMITE: Necessário para receber imagens em Base64 (Avatar)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/topics', topicRoutes); // <--- NOVA ROTA REGISTRADA

app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Mazarbul API v1' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
