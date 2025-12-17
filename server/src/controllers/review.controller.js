import { PrismaClient } from '@prisma/client';
import { checkAndUnlockAchievements } from '../services/gamification.service.js';

const prisma = new PrismaClient();

// Criar ou Editar Review
export const upsertReview = async (req, res) => {
    try {
        const userId = req.userId; // Vem do middleware de auth
        const { mediaId, rating, content, tags, containsSpoilers } = req.body;

        if (!mediaId || rating === undefined) {
            return res.status(400).json({ error: "MediaId e Rating são obrigatórios." });
        }

        // 1. Salvar no Banco
        // Usamos 'upsert' para que, se o usuário já tiver review dessa mídia, ela seja atualizada.
        const review = await prisma.review.upsert({
            where: {
                // Precisamos garantir que o usuário só tenha 1 review por mídia?
                // O Prisma precisa de um campo único composto para isso, mas nosso schema
                // atual usa ID uuid. Vamos buscar primeiro para simplificar a lógica B2.
                // *Nota: Para simplificar MVP, vamos criar sempre uma nova se não mandarem ID,
                // ou você pode restringir no futuro. Aqui vou assumir criação simples.*
                id: req.body.id || "novo-id-inexistente"
            },
            update: {
                rating,
                content,
                tags,
                containsSpoilers
            },
            create: {
                userId,
                mediaId,
                rating,
                content,
                tags,
                containsSpoilers
            }
        });

        // 2. DISPARAR GAMIFICAÇÃO 🏆
        // Não esperamos isso terminar para responder o usuário (fire and forget),
        // ou esperamos se quisermos mostrar o troféu na hora. Vamos esperar por segurança.
        const gamificationResult = await checkAndUnlockAchievements(userId);

        res.status(201).json({
            review,
            achievements: gamificationResult.newUnlocks || [] // Se tiver novos troféus, o front avisa
        });

    } catch (error) {
        console.error("Erro ao salvar review:", error);
        res.status(500).json({ error: "Erro interno ao processar review." });
    }
};

// Listar Reviews de uma Mídia
export const getMediaReviews = async (req, res) => {
    try {
        const { mediaId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { mediaId },
            include: {
                user: {
                    select: { name: true, handle: true, avatarUrl: true } // Só dados públicos
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar reviews." });
    }
};
