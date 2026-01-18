import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CollectionService {
    /**
     * Cria uma nova coleção para o usuário.
     */
    async createCollection(userId, data) {
        return await prisma.collection.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic ?? true
            }
        });
    }

    /**
     * Adiciona uma mídia a uma coleção existente.
     */
    async addItem(collectionId, mediaId, userId) {
        // Valida se a coleção pertence ao usuário logado
        const collection = await prisma.collection.findFirst({
            where: { id: collectionId, userId }
        });

        if (!collection) {
            throw new Error("Coleção não encontrada ou acesso negado.");
        }

        return await prisma.collectionItem.create({
            data: {
                collectionId,
                mediaId
            }
        });
    }

    /**
     * Remove uma mídia de uma coleção.
     */
    async removeItem(collectionId, mediaId, userId) {
        const collection = await prisma.collection.findFirst({
            where: { id: collectionId, userId }
        });

        if (!collection) {
            throw new Error("Coleção não encontrada ou acesso negado.");
        }

        return await prisma.collectionItem.deleteMany({
            where: {
                collectionId,
                mediaId
            }
        });
    }

    /**
     * Retorna todas as coleções do usuário logado.
     */
    async getUserCollections(userId) {
        return await prisma.collection.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
}

export default new CollectionService();
