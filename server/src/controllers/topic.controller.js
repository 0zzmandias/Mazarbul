import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar um novo tópico em um clube
export const createTopic = async (req, res) => {
    try {
        const { title, content, clubId } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Login necessário." });
        }

        if (!clubId) {
            return res.status(400).json({ error: "ID do clube é obrigatório." });
        }

        // Verifica se o usuário é membro do clube
        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: clubId,
                    userId: userId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: "Você precisa ser membro do clube para criar tópicos." });
        }

        const topic = await prisma.topic.create({
            data: {
                title,
                content,
                clubId,
                authorId: userId,
                isPinned: false,
                isLocked: false
            }
        });

        res.status(201).json(topic);

    } catch (error) {
        console.error("Erro ao criar tópico:", error);
        res.status(500).json({ error: "Erro interno ao criar tópico." });
    }
};

// Listar tópicos (Geralmente chamado via ClubDetails, mas mantemos aqui para uso direto se precisar)
export const listTopics = async (req, res) => {
    try {
        const { clubId } = req.query;

        if (!clubId) {
            return res.status(400).json({ error: "clubId é obrigatório." });
        }

        const topics = await prisma.topic.findMany({
            where: { clubId },
            include: {
                author: {
                    select: { name: true, handle: true, avatarUrl: true }
                },
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json(topics);
    } catch (error) {
        console.error("Erro ao listar tópicos:", error);
        res.status(500).json({ error: "Erro ao buscar tópicos." });
    }
};

// Ler detalhes do tópico
export const getTopicDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await prisma.topic.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, handle: true, avatarUrl: true }
                },
                club: {
                    select: { id: true, name: true, slug: true } // Incluindo slug para navegação
                },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: { id: true, name: true, handle: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        if (!topic) {
            return res.status(404).json({ error: "Tópico não encontrado." });
        }

        res.json(topic);
    } catch (error) {
        console.error("Erro ao ler tópico:", error);
        res.status(500).json({ error: "Erro ao carregar tópico." });
    }
};

// Responder ao tópico
export const replyToTopic = async (req, res) => {
    try {
        const { id } = req.params; // topicId
        const { content } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ error: "Login necessário." });

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) return res.status(404).json({ error: "Tópico não encontrado." });

        if (topic.isLocked) {
            return res.status(403).json({ error: "Este tópico está trancado e não aceita novas respostas." });
        }

        // Verifica membresia
        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: topic.clubId,
                    userId: userId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: "Você precisa ser membro do clube para responder." });
        }

        const reply = await prisma.reply.create({
            data: {
                content,
                topicId: id,
                authorId: userId
            },
            include: {
                author: { select: { name: true, handle: true, avatarUrl: true } }
            }
        });

        res.status(201).json(reply);

    } catch (error) {
        console.error("Erro ao responder:", error);
        res.status(500).json({ error: "Erro ao enviar resposta." });
    }
};

// Alternar Fixado (Pin/Unpin) - NOVO
export const togglePinTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId || req.user?.id;

        // Busca o tópico e o clube para verificar permissão
        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) return res.status(404).json({ error: "Tópico não encontrado." });

        // Verifica se é ADMIN ou OWNER
        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: topic.clubId,
                    userId: userId
                }
            }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return res.status(403).json({ error: "Sem permissão para fixar tópicos." });
        }

        const updatedTopic = await prisma.topic.update({
            where: { id },
            data: { isPinned: !topic.isPinned }
        });

        res.json(updatedTopic);
    } catch (error) {
        console.error("Erro ao fixar tópico:", error);
        res.status(500).json({ error: "Erro ao alterar status de fixação." });
    }
};

// Alternar Trancado (Lock/Unlock) - NOVO
export const toggleLockTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId || req.user?.id;

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) return res.status(404).json({ error: "Tópico não encontrado." });

        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: topic.clubId,
                    userId: userId
                }
            }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return res.status(403).json({ error: "Sem permissão para trancar tópicos." });
        }

        const updatedTopic = await prisma.topic.update({
            where: { id },
            data: { isLocked: !topic.isLocked }
        });

        res.json(updatedTopic);
    } catch (error) {
        console.error("Erro ao trancar tópico:", error);
        res.status(500).json({ error: "Erro ao alterar status de trancamento." });
    }
};
