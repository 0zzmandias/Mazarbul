import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar Clube
export const createClub = async (req, res) => {
    try {
        const { name, description, coverUrl, isPublic, slug } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        const newClub = await prisma.club.create({
            data: {
                name,
                slug: finalSlug,
                description,
                coverUrl,
                isPublic: true, // Força sempre público se não vier nada, mas removemos a lógica de esconder
                members: {
                    create: {
                        userId: userId,
                        role: "OWNER"
                    }
                }
            }
        });

        res.status(201).json(newClub);
    } catch (error) {
        console.error("Erro ao criar clube:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Este identificador (handle) já está em uso. Tente outro." });
        }
        res.status(500).json({ error: "Não foi possível criar o clube." });
    }
};

// Atualizar Clube
export const updateClub = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, coverUrl } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ error: "Login necessário." });

        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: {
                    clubId: id,
                    userId: userId
                }
            }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return res.status(403).json({ error: "Sem permissão para editar este clube." });
        }

        const updatedClub = await prisma.club.update({
            where: { id },
            data: {
                name,
                description,
                coverUrl
            }
        });

        res.json(updatedClub);
    } catch (error) {
        console.error("Erro ao atualizar clube:", error);
        res.status(500).json({ error: "Erro ao salvar alterações do clube." });
    }
};

// Listar Clubes (SEM FILTROS DE PRIVACIDADE)
export const listClubs = async (req, res) => {
    try {
        const clubs = await prisma.club.findMany({
            // REMOVIDO: where: { isPublic: true }
            // Agora lista todos os clubes existentes
            include: {
                _count: { select: { members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clubs);
    } catch (error) {
        console.error("Erro ao listar clubes:", error);
        res.status(500).json({ error: "Erro ao buscar clubes." });
    }
};

// Detalhes do Clube
export const getClubDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId || req.user?.id;

        const club = await prisma.club.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { members: true, topics: true }
                },
                members: {
                    take: 50,
                    orderBy: { joinedAt: 'asc' },
                    include: {
                        user: {
                            select: { id: true, name: true, handle: true, avatarUrl: true }
                        }
                    }
                },
                works: {
                    where: { status: "active" },
                    include: { media: true }
                },
                topics: {
                    orderBy: [
                        { isPinned: 'desc' },
                        { createdAt: 'desc' }
                    ],
                    take: 20,
                    include: {
                        author: {
                            select: { name: true, handle: true, avatarUrl: true }
                        },
                        _count: {
                            select: { replies: true }
                        }
                    }
                }
            }
        });

        if (!club) {
            return res.status(404).json({ error: "Clube não encontrado." });
        }

        let currentUserRole = null;
        if (userId) {
            const membership = await prisma.clubMember.findUnique({
                where: {
                    clubId_userId: {
                        clubId: id,
                        userId: userId
                    }
                }
            });
            if (membership) {
                currentUserRole = membership.role;
            }
        }

        res.json({
            ...club,
            currentUserRole,
            isMember: !!currentUserRole
        });

    } catch (error) {
        console.error("Erro ao buscar detalhes do clube:", error);
        res.status(500).json({ error: "Erro interno ao carregar clube." });
    }
};

// Entrar no Clube
export const joinClub = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ error: "Login necessário." });

        const existingMember = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: { clubId: id, userId: userId }
            }
        });

        if (existingMember) {
            return res.status(400).json({ error: "Você já é membro deste clube." });
        }

        await prisma.clubMember.create({
            data: {
                clubId: id,
                userId: userId,
                role: "MEMBER"
            }
        });

        res.json({ message: "Você entrou no clube com sucesso!" });
    } catch (error) {
        console.error("Erro ao entrar no clube:", error);
        res.status(500).json({ error: "Não foi possível entrar no clube." });
    }
};

// Sair do Clube
export const leaveClub = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ error: "Login necessário." });

        const membership = await prisma.clubMember.findUnique({
            where: {
                clubId_userId: { clubId: id, userId: userId }
            }
        });

        if (!membership) {
            return res.status(400).json({ error: "Você não é membro deste clube." });
        }

        if (membership.role === "OWNER") {
            return res.status(403).json({ error: "O dono não pode sair do clube." });
        }

        await prisma.clubMember.delete({
            where: {
                clubId_userId: { clubId: id, userId: userId }
            }
        });

        res.json({ message: "Você saiu do clube." });
    } catch (error) {
        console.error("Erro ao sair do clube:", error);
        res.status(500).json({ error: "Erro ao tentar sair do clube." });
    }
};
