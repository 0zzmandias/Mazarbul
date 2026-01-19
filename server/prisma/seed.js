import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Importação necessária para gerar o hash correto

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Iniciando seed do banco de dados...");

    // 1. Limpeza das tabelas
    try {
        await prisma.collectionItem.deleteMany();
        await prisma.collection.deleteMany();
        await prisma.userAchievement.deleteMany();
        await prisma.review.deleteMany();

        // Limpar usuários e zerar favoritos antes
        const users = await prisma.user.findMany();
        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { favorites: { set: [] } }
            });
        }
        await prisma.user.deleteMany();
        await prisma.mediaGenre.deleteMany();
        await prisma.mediaAlias.deleteMany();
        await prisma.mediaReference.deleteMany();
        await prisma.genre.deleteMany();

        console.log("🧹 Banco limpo com sucesso.");
    } catch (error) {
        console.warn("⚠️ Aviso na limpeza:", error.message);
    }

    // 2. Criar Mídias
    const mediaData = [
        {
            id: "m1",
            type: "filme",
            titles: { PT: "Duna: Parte Dois", EN: "Dune: Part Two" },
            releaseYear: 2024,
            posterUrl: "https://image.tmdb.org/t/p/w500/1m02V5s5z03iV2lX3a1iV77F22i.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
            tags: ["scifi", "aventura"]
        },
        {
            id: "m5",
            type: "filme",
            titles: { PT: "Oppenheimer", DEFAULT: "Oppenheimer" },
            releaseYear: 2023,
            posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            tags: ["biografia", "drama"]
        },
        {
            id: "g1",
            type: "jogo",
            titles: { PT: "Baldur's Gate 3", DEFAULT: "Baldur's Gate 3" },
            releaseYear: 2023,
            posterUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg",
            tags: ["rpg", "fantasia"]
        },
        {
            id: "g2",
            type: "jogo",
            titles: { PT: "Elden Ring", DEFAULT: "Elden Ring" },
            releaseYear: 2022,
            posterUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
            tags: ["rpg", "souls"]
        },
        {
            id: "b1",
            type: "livro",
            titles: { PT: "1984", DEFAULT: "1984" },
            releaseYear: 1949,
            posterUrl: "https://images-na.ssl-images-amazon.com/images/I/91SZSW8qSsL.jpg",
            tags: ["distopia", "scifi"]
        },
        {
            id: "b2",
            type: "livro",
            titles: { PT: "O Nome do Vento", DEFAULT: "The Name of the Wind" },
            releaseYear: 2007,
            posterUrl: "https://images-na.ssl-images-amazon.com/images/I/91M9xPIf10L.jpg",
            tags: ["fantasia"]
        },
        {
            id: "a1",
            type: "album",
            titles: { PT: "To Pimp a Butterfly", DEFAULT: "To Pimp a Butterfly" },
            releaseYear: 2015,
            posterUrl: "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png",
            tags: ["hiphop"]
        },
        {
            id: "a3",
            type: "album",
            titles: { PT: "Abbey Road", DEFAULT: "Abbey Road" },
            releaseYear: 1969,
            posterUrl: "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
            tags: ["rock"]
        }
    ];

    for (const media of mediaData) {
        await prisma.mediaReference.create({ data: media });
    }
    console.log(`🎬 ${mediaData.length} mídias criadas.`);

    // 3. Criar Usuários com Senha Correta
    // Gera o hash para "123456" na hora
    const passwordHash = await bcrypt.hash("123456", 10);

    const alex = await prisma.user.create({
        data: {
            email: "alex@email.com",
            handle: "alexl",
            name: "Alex Lima",
            password: passwordHash, // Usa o hash gerado agora
            bio: "Engenheiro de Computação, gamer e entusiasta de Sci-Fi.",
            avatarUrl: "https://github.com/shadcn.png",
            favorites: {
                connect: [{ id: "g1" }, { id: "m5" }, { id: "a3" }, { id: "b1" }]
            }
        }
    });

    const maris = await prisma.user.create({
        data: {
            email: "marina@email.com",
            handle: "maris",
            name: "Marina Silva",
            password: passwordHash, // Usa o mesmo hash
            bio: "Cinéfila, devoradora de livros e crítica de plantão.",
            avatarUrl: "https://i.pravatar.cc/150?u=maris",
            favorites: {
                connect: [{ id: "m1" }, { id: "b2" }, { id: "a1" }]
            }
        }
    });

    console.log(`👤 Usuários criados com senha criptografada (123456).`);

    // 4. Criar Reviews
    await prisma.review.create({
        data: {
            userId: alex.id,
            mediaId: "g1",
            rating: 10.0,
            content: "Simplesmente o melhor RPG já feito. A liberdade é absurda.",
            tags: ["rpg", "goty"],
            containsSpoilers: false
        }
    });

    await prisma.review.create({
        data: {
            userId: alex.id,
            mediaId: "m5",
            rating: 9.0,
            content: "Nolan sendo Nolan. O som é ensurdecedor (no bom sentido).",
                               tags: ["cinema", "historia"],
                               containsSpoilers: false
        }
    });

    await prisma.review.create({
        data: {
            userId: maris.id,
            mediaId: "m1",
            rating: 9.5,
            content: "Lisan al Gaib! Visualmente perfeito.",
            tags: ["scifi", "cinema"],
            containsSpoilers: false
        }
    });

    console.log("📝 Reviews criadas.");

    // 5. Criar Conquistas (Badges)
    const achievements = [
        { userId: alex.id, achievementId: "nenya", progress: 85 },
        { userId: alex.id, achievementId: "vilya", progress: 42 },
        { userId: alex.id, achievementId: "the-one", progress: 12 },
        { userId: maris.id, achievementId: "the-one", progress: 60 },
        { userId: maris.id, achievementId: "narya", progress: 30 }
    ];

    for (const ach of achievements) {
        await prisma.userAchievement.create({
            data: {
                userId: ach.userId,
                achievementId: ach.achievementId,
                progress: ach.progress
            }
        });
    }

    console.log("🏆 Conquistas distribuídas.");
    console.log("✅ Seed finalizado com sucesso!");
}

main()
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});
