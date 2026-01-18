import prisma from '../lib/prisma.js';

class UserService {
    /**
     * Busca um usuário pelo handle, incluindo favoritos e coleções.
     */
    async getUserByHandle(handle) {
        return await prisma.user.findUnique({
            where: { handle },
            select: {
                id: true,
                name: true,
                handle: true,
                bio: true,
                avatarUrl: true,
                createdAt: true,
                favorites: {
                    select: {
                        id: true,
                        type: true,
                        titles: true,
                        posterUrl: true,
                        releaseYear: true,
                        tags: true
                    }
                },
                collections: {
                    include: {
                        _count: {
                            select: { items: true }
                        }
                    }
                },
                _count: {
                    select: {
                        reviews: true,
                        favorites: true,
                        achievements: true
                    }
                }
            }
        });
    }

    /**
     * Atualiza os dados de perfil do usuário.
     */
    async updateProfile(userId, data) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                bio: data.bio,
                avatarUrl: data.avatarUrl
            },
            select: {
                id: true,
                name: true,
                handle: true,
                bio: true,
                avatarUrl: true,
                email: true
            }
        });
    }
}

export default new UserService();
