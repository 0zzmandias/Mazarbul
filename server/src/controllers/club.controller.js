import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar Clube
export const createClub = async (req, res) => {
    try {
        // Agora recebemos 'slug' (o handle) do frontend
        const { name, description, coverUrl, isPublic, slug } = req.body;
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        // Se não vier slug, geramos um provisório baseado no nome para não quebrar
        // Ex: "Clube do Livro" -> "clube-do-livro"
        const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        const newClub = await prisma.club.create({
            data: {
                name,
                slug: finalSlug, // <--- Salvando o handle no banco
                description,
                coverUrl,
                isPublic: isPublic !== undefined ? isPublic : true,
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

        // Tratamento para handle duplicado (Erro P2002 do Prisma)
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Este identificador (handle) já está em uso. Tente outro." });
        }

        res.status(500).json({ error: "Não foi possível criar o clube." });
    }
};

// Listar Clubes
export const listClubs = async (req, res) => {
    try {
        const clubs = await prisma.club.findMany({
            where: { isPublic: true },
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

        // 1. Busca os dados do clube e a lista pública de membros
        const club = await prisma.club.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { members: true, topics: true }
                },
                // Traz os membros com os dados do usuário (nome, avatar) para o card aparecer corretamente
                members: {
                    take: 50, // Limita a 50 membros iniciais para não pesar
                    orderBy: { joinedAt: 'asc' }, // Membros mais antigos primeiro (Fundador no topo)
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
                    orderBy: { createdAt: 'desc' },
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

        // 2. Verifica SEPARADAMENTE qual o papel do usuário atual neste clube
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
            currentUserRole, // OWNER, ADMIN, MEMBER ou null
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
