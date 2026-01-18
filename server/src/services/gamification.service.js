import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definição das Regras de cada Conquista
// Sincronizado com client/src/hooks/useUserProfileData.js e os tiers [Bronze, Prata, Ouro]
const ACHIEVEMENT_RULES = {
    // --- CONTAGEM POR TIPO (Os Anéis de Poder) ---
    'the-one': { type: 'livro', tiers: [12, 25, 52] },
    'narya':   { type: 'album', tiers: [12, 25, 52] },
    'vilya':   { type: 'filme', tiers: [12, 25, 52] },
    'nenya':   { type: 'jogo',  tiers: [12, 25, 52] },

    // --- GÊNEROS E TEMÁTICAS (Tags) ---
    'life-universe-everything': { tag: 'tag.scifi', tiers: [1, 6, 12] },
    'horror-business':          { tag: 'tag.horror', tiers: [1, 6, 12] },
    'wood-between-worlds':      { tag: 'tag.fantasy', tiers: [1, 6, 12] },
    'once-upon-time-west':      { tag: 'tag.western', tiers: [1, 6, 12] },
    'kagemusha':                { tags: ['tag.samurai', 'tag.feudal', 'tag.japan'], tiers: [1, 6, 12] },
    'help-me-eros':             { tag: 'tag.romance', tiers: [1, 6, 12] },
    'guernica':                 { tag: 'tag.war', tiers: [1, 6, 12] },
    'nighthawks':               { tag: 'tag.noir', tiers: [1, 6, 12] },
    'perche-leggere-classici':  { tag: 'tag.classic', tiers: [1, 6, 12] },
    'khazad-dum':               { tag: 'tag.history', tiers: [1, 6, 12] },
    'manwe':                    { tag: 'tag.highly-rated', tiers: [1, 6, 12] },
    'melkor':                   { tag: 'tag.lowly-rated', tiers: [1, 6, 12] },

    // --- ESPECIAIS E EXPLORAÇÃO ---
    'zeitgeist':                { tag: 'tag.documentary', tiers: [6, 12, 25] },
    'moritarnon':               { tag: 'tag.cult', tiers: [1, 3, 6] },
    'arda':                     { tag: 'tag.mythology', tiers: [1, 3, 6] },
    'rhun':                     { tag: 'tag.foreign', tiers: [1, 3, 6] },
    'trivium':                  { tag: 'tag.philosophy', tiers: [1, 3, 6] },
    'quadrivium':               { tag: 'tag.science', tiers: [1, 3, 6] },
    'dagor-dagorath':           { tag: 'tag.epic', tiers: [1, 3, 6] }
};

/**
 * Engine Principal: Verifica e desbloqueia troféus para um usuário
 * Deve ser chamado SEMPRE que uma review for criada ou apagada.
 */
export const checkAndUnlockAchievements = async (userId) => {
    console.log(`[GAMIFICATION] Verificando troféus para o user: ${userId}`);

    try {
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
                    const cleanTag = tag.toLowerCase();
                    stats.tags[cleanTag] = (stats.tags[cleanTag] || 0) + 1;
                });
            }
        });

        // 3. Verificar Regras vs Estatísticas
        for (const [achievementId, rule] of Object.entries(ACHIEVEMENT_RULES)) {
            let currentCount = 0;

            // Lógica A: Contagem por Tipo
            if (rule.type) {
                currentCount = stats[rule.type] || 0;
            }
            // Lógica B: Tag específica
            else if (rule.tag) {
                currentCount = stats.tags[rule.tag] || 0;
            }
            // Lógica C: Lista de Tags
            else if (rule.tags) {
                currentCount = userReviews.filter(r =>
                r.media.tags.some(t => rule.tags.includes(t))
                ).length;
            }

            // 4. Salvar/Atualizar Progresso no Banco
            await prisma.userAchievement.upsert({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId
                    }
                },
                update: {
                    progress: currentCount,
                },
                create: {
                    userId,
                    achievementId,
                    progress: currentCount,
                    unlockedAt: new Date()
                }
            });
        }

        return { success: true, stats };

    } catch (error) {
        console.error(`[GAMIFICATION] Erro crítico na engine:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Busca os troféus desbloqueados e o progresso de um usuário específico.
 */
export const getUserAchievements = async (userId) => {
    return await prisma.userAchievement.findMany({
        where: { userId }
    });
};
