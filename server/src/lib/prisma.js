import { PrismaClient } from '@prisma/client';

// Essa lógica evita criar múltiplas conexões com o banco
// toda vez que o servidor reinicia no modo "watch" (dev)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
