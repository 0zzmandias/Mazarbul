import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar um novo tópico em um clube
export const createTopic = async (req, res) => {
    try {
        const { title, content, clubId } = req.body;
        const userId = req.userId || req.user?.id;

        console.log("--- TENTATIVA DE CRIAR TÓPICO ---");
        console.log("User ID:", userId);
        console.log("Club ID recebido:", clubId);
        console.log("Dados:", { title, content });

        if (!userId) {
            console.log("ERRO: Usuário não autenticado no controller.");
            return res.status(401).json({ error: "Login necessário." });
        }

        if (!clubId) {
            console.log("ERRO: clubId não foi fornecido.");
            return res.status(400).json({ error: "ID do clube é obrigatório." });
        }

        // Verifica se o usuário é membro do clube antes de postar
        console.log("Verificando membresia...");
        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: clubId,
                    userId: userId
                }
            }
        });

        if (!membership) {
            console.log("ERRO: Usuário não é membro deste clube.");
            return res.status(403).json({ error: "Você precisa ser membro do clube para criar tópicos." });
        }

        console.log("Membresia confirmada. Criando tópico...");
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

        console.log("Tópico criado com sucesso! ID:", topic.id);
        res.status(201).json(topic);

    } catch (error) {
        console.error("ERRO FATAL ao criar tópico:", error);
        res.status(500).json({ error: "Erro interno ao criar tópico." });
    }
};

// Listar tópicos
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

// Ler detalhes
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
                    select: { id: true, name: true }
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

// Responder
export const replyToTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ error: "Login necessário." });

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) return res.status(404).json({ error: "Tópico não encontrado." });

        if (topic.isLocked) {
            return res.status(403).json({ error: "Este tópico está trancado." });
        }

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
