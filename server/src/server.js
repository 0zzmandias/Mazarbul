import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Rotas da API
// Tudo que for de auth vai começar com /api/auth
app.use('/api/auth', authRoutes);

// Rota de Health Check
app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Mazarbul API v1' });
});

// Iniciar
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
