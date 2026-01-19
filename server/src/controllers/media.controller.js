import prisma from '../lib/prisma.js';
import { searchUnifiedMedia } from '../services/mediaSearch.service.js';
import { hydrateMediaReferenceByQid } from '../services/mediaHydration.service.js';
import { isQid } from '../utils/wikidata.adapter.js';

/**
 * MEDIA CONTROLLER
 * Este controlador gerencia as requisições de busca e detalhes de mídia.
 * Seguindo o PLANO DE MÍDIA:
 * 1. A busca é SEMPRE unificada através da Wikidata (Canônica).
 * 2. Não existem buscas diretas em APIs externas (TMDB/RAWG/Books) via Controller.
 * 3. O banco de dados age como cache persistente para evitar consultas repetidas às APIs.
 */

/**
 * Auxiliar para converter parâmetros de query em booleano.
 */
const isTruthy = (value) => {
    const v = String(value ?? '').trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'y';
};

/**
 * Realiza a busca de mídias.
 * Diferente da versão anterior, esta versão removeu o 'switch(type)' que chamava
 * as APIs externas diretamente. Agora, tudo é centralizado no searchUnifiedMedia.
 */
export const searchMedia = async (req, res) => {
    const { q, type, lang, limit } = req.query;

    if (!q) {
        return res.status(400).json({ error: "O termo de busca 'q' é obrigatório." });
    }

    try {
        // Normalização do limite de resultados (mín 1, máx 30)
        const parsedLimit = Number.parseInt(String(limit ?? ''), 10);
        const finalLimit = Number.isFinite(parsedLimit)
        ? Math.max(1, Math.min(parsedLimit, 30))
        : 20;

        /**
         * Executa a busca unificada.
         * Esta função consulta o banco local e, se necessário, a Wikidata.
         */
        const results = await searchUnifiedMedia({
            query: q,
            uiLang: lang || 'PT',
            type: type && type !== 'all' ? type : null,
            limit: finalLimit
        });

        return res.json(results);
    } catch (error) {
        console.error('Erro na rota de busca de mídia:', error);
        return res.status(500).json({ error: 'Falha ao processar a busca de mídia.' });
    }
};

/**
 * Obtém os detalhes completos de uma mídia específica.
 * Prioriza o Banco de Dados (Cache) e realiza a Hidratação se necessário.
 */
export const getMediaDetails = async (req, res) => {
    const { id } = req.params;

    // Parâmetro para forçar a atualização dos dados a partir das APIs
    const refreshParam = String(req.query.refresh || '').toLowerCase();
    const forceRefresh = isTruthy(refreshParam);

    try {
        /**
         * CENÁRIO A: O ID fornecido é um QID da Wikidata (Padrão Canônico)
         */
        if (isQid(id)) {
            // 1. Tenta encontrar a mídia já hidratada no banco
            const cachedMedia = await prisma.mediaReference.findUnique({
                where: { id },
                include: {
                    reviews: {
                        include: { user: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    _count: {
                        select: { favoritedBy: true }
                    }
                }
            });

            // Se a mídia existe, está completa (não é stub) e não pedimos refresh, retorna direto.
            if (cachedMedia && cachedMedia.isStub === false && !forceRefresh) {
                // Atualiza a data de último acesso para fins de manutenção de cache (background)
                prisma.mediaReference.update({
                    where: { id },
                    data: { lastAccessedAt: new Date() }
                }).catch(() => {});

                return res.json(cachedMedia);
            }

            /**
             * 2. HIDRATAÇÃO: Se chegamos aqui, a mídia não existe ou precisa ser atualizada.
             * Chama o serviço que junta Wikidata + APIs específicas.
             */
            await hydrateMediaReferenceByQid(id, { forceRefresh });

            // Busca novamente os dados agora persistidos e hidratados
            const hydrated = await prisma.mediaReference.findUnique({
                where: { id },
                include: {
                    reviews: {
                        include: { user: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    _count: {
                        select: { favoritedBy: true }
                    }
                }
            });

            if (!hydrated) {
                return res.status(404).json({ error: 'Mídia não encontrada após tentativa de hidratação.' });
            }

            return res.json(hydrated);
        }

        /**
         * CENÁRIO B: O ID não é um QID (IDs legados ou de fontes externas diretas)
         * O sistema novo desencoraja isso, mas mantemos uma busca no banco por compatibilidade.
         */
        const legacyMedia = await prisma.mediaReference.findUnique({
            where: { id },
            include: {
                reviews: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: { favoritedBy: true }
                }
            }
        });

        if (legacyMedia && !forceRefresh) {
            await prisma.mediaReference.update({
                where: { id },
                data: { lastAccessedAt: new Date() }
            });

            return res.json(legacyMedia);
        }

        /**
         * Se não for QID e não estiver no banco, o sistema não aceita a requisição.
         * O fluxo correto é buscar pelo nome, obter o QID e então pedir os detalhes.
         */
        return res.status(400).json({
            error: 'Identificador inválido. O sistema utiliza QIDs da Wikidata como padrão canônico.'
        });

    } catch (error) {
        const msg = String(error?.message || '');

        // Tratamento de erros amigáveis baseados nas exceções dos serviços
        if (msg.toLowerCase().includes('não encontrado')) {
            return res.status(404).json({ error: msg });
        }

        if (msg.toLowerCase().includes('qid inválido') || msg.toLowerCase().includes('tipo de mídia não definido')) {
            return res.status(400).json({ error: msg });
        }

        console.error('Erro ao obter detalhes da mídia:', error);
        return res.status(500).json({ error: 'Erro interno ao processar detalhes da mídia.' });
    }
};
