import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-super-segura-do-mazarbul';

export const authenticateToken = (req, res, next) => {
    // O token vem no header: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega só o código depois do 'Bearer'

    if (!token) {
        return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        // Injeta o ID do usuário na requisição para os controllers usarem
        req.userId = user.id;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token inválido ou expirado." });
    }
};
