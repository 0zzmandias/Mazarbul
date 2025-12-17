import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mediaRoutes from './routes/media.routes.js';
import reviewRoutes from './routes/review.routes.js'; // <--- NOVO IMPORT

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reviews', reviewRoutes); // <--- NOVA ROTA

app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Mazarbul API v1' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
