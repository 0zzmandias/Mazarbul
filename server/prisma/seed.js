import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando semeadura do banco de dados...');

    // 1. LIMPEZA (Ordem correta para evitar erros de Foreign Key)
    await prisma.userAchievement.deleteMany();
    await prisma.review.deleteMany();
    await prisma.collectionItem.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.mediaAlias.deleteMany();
    await prisma.mediaGenre.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany();
    await prisma.mediaReference.deleteMany();

    console.log('🧹 Banco limpo com sucesso.');

    // 2. CRIAR MÍDIAS (Usando o formato JSON para os títulos conforme o schema)
    const m1 = await prisma.mediaReference.create({
        data: {
            id: 'movie_dune_2021',
            type: 'filme',
            titles: { PT: 'Duna', EN: 'Dune', DEFAULT: 'Duna' },
            releaseYear: 2021,
            posterUrl: 'https://image.tmdb.org/t/p/w500/mSj9Ybd76oAn7S7Y870E8fGR86X.jpg',
            genres: ['Ficção Científica', 'Aventura']
        },
    });

    const m2 = await prisma.mediaReference.create({
        data: {
            id: 'game_elden_ring',
            type: 'jogo',
            titles: { DEFAULT: 'Elden Ring' },
            releaseYear: 2022,
            posterUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4ni8.png',
            genres: ['RPG', 'Action']
        },
    });

    console.log('🎬 Mídias de referência criadas.');

    // 3. GERAR HASH DA SENHA PARA O LOGIN FUNCIONAR
    // Definindo uma senha simples para o teste: 123456
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 4. CRIAR USUÁRIO E JÁ ADICIONAR FAVORITOS
    const user = await prisma.user.create({
        data: {
            name: 'Alex L.',
            handle: 'alexl',
            email: 'alex@mazarbul.com',
            password: hashedPassword, // Agora o banco tem o hash correto
            bio: 'Engenheiro de Computação e Crítico de Mídias.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            favorites: {
                connect: [{ id: m1.id }, { id: m2.id }]
            }
        },
    });

    console.log(`👤 Usuário @${user.handle} criado com favoritos e senha criptografada.`);

    // 5. CRIAR REVIEWS
    await prisma.review.create({
        data: {
            userId: user.id,
            mediaId: m1.id,
            rating: 9.5,
            content: 'Uma obra-prima visual. A trilha sonora é de outro mundo!',
        },
    });

    // 6. CRIAR CONQUISTAS (Achievements)
    await prisma.userAchievement.create({
        data: {
            userId: user.id,
            achievementId: 'the-scholar',
            progress: 5,
        },
    });

    // 7. COLEÇÃO
    const col = await prisma.collection.create({
        data: {
            userId: user.id,
            name: 'Favoritos de 2024',
            description: 'O que mais gostei de jogar e ver.',
            isPublic: true
        }
    });

    await prisma.collectionItem.create({
        data: {
            collectionId: col.id,
            mediaId: m2.id
        }
    });

    console.log('🏆 Dados de engajamento (Reviews, Coleções, Badges) semeados.');
    console.log('✅ Semeadura finalizada com sucesso!');
}

main()
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});
