import { registerUser, loginUser } from '../services/auth.service.js';

export const register = async (req, res) => {
    try {
        // Pegamos os dados que vieram no corpo da requisição
        const result = await registerUser(req.body);

        // Devolvemos 201 (Created) e o usuário criado
        res.status(201).json(result);
    } catch (error) {
        // Se der erro (ex: email duplicado), devolvemos 400 (Bad Request)
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);

        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
