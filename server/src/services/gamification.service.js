import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definição das Regras de cada Conquista
// Baseado nos tiers do seu frontend: [Bronze, Prata, Ouro]
const ACHIEVEMENT_RULES = {
    // --- CONTAGEM POR TIPO (Os Anéis de Poder) ---
    'the-one': { type: 'livro', tiers: [12, 25, 52] }, // Livros lidos
    'vilya':   { type: 'filme', tiers: [12, 25, 52] }, // Filmes vistos
    'nenya':   { type: 'jogo',  tiers: [12, 25, 52] }, // Jogos jogados
    'narya':   { type: 'album', tiers: [12, 25, 52] }, // Álbuns ouvidos

    // --- GÊNEROS ESPECÍFICOS ---
    'horror-business': {
        tag: 'tag.horror',
        tiers: [1, 6, 12]
    },
    'life-universe-everything': {
        tag: 'tag.scifi',
        tiers: [1, 6, 12] // 42 seria o ideal, mas mantive sua lista [1, 6, 12]
    },
    'once-upon-time-west': {
        tag: 'tag.western',
        tiers: [1, 6, 12]
    },

    // --- OUTROS (Exemplos baseados na lógica de tags) ---
    'kagemusha': {
        // Como conversamos, usaremos tag de samurai/histórico
        tags: ['tag.samurai', 'tag.feudal', 'tag.japan'],
        tiers: [1, 6, 12]
    }
};

/**
 * Engine Principal: Verifica e desbloqueia troféus para um usuário
 * Deve ser chamado SEMPRE que uma review for criada ou apagada.
 */
export const checkAndUnlockAchievements = async (userId) => {
    console.log(`[GAMIFICATION] Verificando troféus para o user: ${userId}`);

    // 1. Buscar todas as reviews do usuário incluindo os dados da mídia (tags/tipo)
    const userReviews = await prisma.review.findMany({
        where: { userId },
        include: { media: true }
    });

    // 2. Calcular estatísticas atuais
    const stats = {
        livro: 0,
        filme: 0,
        jogo: 0,
        album: 0,
        tags: {} // Ex: { 'tag.horror': 5, 'tag.scifi': 2 }
    };

    userReviews.forEach(review => {
        const media = review.media;

        // Contagem por Tipo
        if (stats[media.type] !== undefined) {
            stats[media.type]++;
        }

        // Contagem por Tags
        if (media.tags && Array.isArray(media.tags)) {
            media.tags.forEach(tag => {
                // Normaliza a tag para garantir
                const cleanTag = tag.toLowerCase();
                stats.tags[cleanTag] = (stats.tags[cleanTag] || 0) + 1;
            });
        }
    });

    // 3. Verificar Regras vs Estatísticas
    const newUnlocks = [];

    for (const [achievementId, rule] of Object.entries(ACHIEVEMENT_RULES)) {
        let currentCount = 0;

        // Lógica A: É troféu de contagem por Tipo? (Ex: Ler 10 livros)
        if (rule.type) {
            currentCount = stats[rule.type] || 0;
        }

        // Lógica B: É troféu de Tag específica? (Ex: Ver filmes de Terror)
        else if (rule.tag) {
            currentCount = stats.tags[rule.tag] || 0;
        }

        // Lógica C: É troféu de Lista de Tags? (Ex: Kagemusha - samurai OU japan)
        else if (rule.tags) {
            // Soma reviews que tenham PELO MENOS UMA das tags da lista
            // (Lógica simplificada: se a review tiver 2 tags da lista, conta 1 vez por review)
            currentCount = userReviews.filter(r =>
            r.media.tags.some(t => rule.tags.includes(t))
            ).length;
        }

        // 4. Salvar/Atualizar Progresso no Banco
        // Sempre atualizamos o "progress" para a barra encher no frontend
        try {
            await prisma.userAchievement.upsert({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId
                    }
                },
                update: {
                    progress: currentCount,
                    // Não atualizamos unlockedAt se já existir, para manter a data original
                },
                create: {
                    userId,
                    achievementId,
                    progress: currentCount,
                    unlockedAt: new Date()
                }
            });

            // Nota: No futuro, podemos disparar notificação aqui se currentCount acabou de bater uma meta (tier)

        } catch (error) {
            console.error(`Erro ao atualizar troféu ${achievementId}:`, error);
        }
    }

    return { success: true, stats };
};
