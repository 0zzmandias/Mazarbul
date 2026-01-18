import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FavoriteService {
    /**
     * Alterna o estado de favorito de uma mídia para o usuário.
     */
    async toggleFavorite(userId, mediaId) {
        // Verifica se a mídia já está nos favoritos do usuário
        const userWithFavorite = await prisma.user.findFirst({
            where: {
                id: userId,
                favorites: {
                    some: { id: mediaId }
                }
            }
        });

        if (userWithFavorite) {
            // Se já for favorito, remove a conexão
            return await prisma.user.update({
                where: { id: userId },
                data: {
                    favorites: {
                        disconnect: { id: mediaId }
                    }
                },
                include: { favorites: true }
            });
        }

        // Se não for favorito, conecta (a mídia deve existir no MediaReference)
        return await prisma.user.update({
            where: { id: userId },
            data: {
                favorites: {
                    connect: { id: mediaId }
                }
            },
            include: { favorites: true }
        });
    }

    /**
     * Retorna a lista de mídias favoritadas pelo usuário.
     */
    async getUserFavorites(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                favorites: {
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });
        return user?.favorites || [];
    }

    /**
     * Verifica se uma mídia específica está favoritada pelo usuário.
     */
    async isMediaFavorited(userId, mediaId) {
        const count = await prisma.user.count({
            where: {
                id: userId,
                favorites: {
                    some: { id: mediaId }
                }
            }
        });
        return count > 0;
    }
}

export default new FavoriteService();
