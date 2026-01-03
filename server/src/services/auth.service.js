import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-super-segura-do-mazarbul';

// Função auxiliar para gerar o Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const registerUser = async (data) => {
    const { name, email, handle, password } = data;

    // 1. Verificar se usuário já existe
    const userExists = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { handle }]
        }
    });

    if (userExists) {
        throw new Error('Email ou Handle já estão em uso.');
    }

    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Criar usuário no Banco
    const user = await prisma.user.create({
        data: {
            name,
            email,
            handle,
            password: hashedPassword,
        },
    });

    // 4. Retornar dados ESTRUTURADOS (user + token separados)
    return {
        user: {
            id: user.id,
            name: user.name,
            handle: user.handle,
            email: user.email,
            avatarUrl: user.avatarUrl || null, // Garante que o campo vá, mesmo vazio
        },
        token: generateToken(user.id),
    };
};

export const loginUser = async (email, password) => {
    // 1. Buscar usuário pelo email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Credenciais inválidas.');
    }

    // 2. Verificar se a senha bate
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Credenciais inválidas.');
    }

    // 3. Retornar dados ESTRUTURADOS
    return {
        user: {
            id: user.id,
            name: user.name,
            handle: user.handle,
            email: user.email,
            avatarUrl: user.avatarUrl || null,
        },
        token: generateToken(user.id),
    };
};
