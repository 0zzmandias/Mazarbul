import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReviewService {
    /**
     * Cria ou atualiza uma avaliação baseada no userId e mediaId.
     * Retorna o objeto com os dados da mídia incluídos.
     */
    async upsertReview(data) {
        const { userId, mediaId, rating, content, tags, containsSpoilers } = data;

        const existingReview = await prisma.review.findFirst({
            where: {
                userId: userId,
                mediaId: mediaId
            }
        });

        if (existingReview) {
            return await prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating,
                    content,
                    tags,
                    containsSpoilers
                },
                include: {
                    media: true
                }
            });
        }

        return await prisma.review.create({
            data: {
                userId,
                mediaId,
                rating,
                content,
                tags,
                containsSpoilers
            },
            include: {
                media: true
            }
        });
    }

    /**
     * Busca todas as reviews de uma mídia específica.
     * Inclui dados básicos do usuário que fez a avaliação.
     */
    async getReviewsByMedia(mediaId) {
        return await prisma.review.findMany({
            where: { mediaId },
            include: {
                user: {
                    select: {
                        name: true,
                        handle: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Busca todas as reviews de um usuário específico.
     * Agora inclui os dados da mídia (MediaReference) para exibição no Perfil/Dashboard.
     */
    async getUserReviews(userId) {
        return await prisma.review.findMany({
            where: { userId },
            include: {
                media: true // Essencial para mostrar Título/Poster no Perfil
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Deleta uma review garantindo que pertença ao usuário.
     */
    async deleteReview(reviewId, userId) {
        return await prisma.review.deleteMany({
            where: {
                id: reviewId,
                userId: userId
            }
        });
    }
}

export default new ReviewService();
