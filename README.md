# Mazarbul

Helton Alves Sá  - 2019014022

## Descrição detalhada do projeto

Mazarbul é uma aplicação web para registro, avaliação e organização de consumo cultural. O sistema suporta quatro tipos de mídia (filmes, jogos, livros e álbuns) e oferece busca unificada, páginas de detalhes e publicação de reviews. Um objetivo central do projeto é garantir uma única página canônica por obra, reduzindo duplicatas e inconsistências causadas por ruído e variações em fontes externas.

Principais entregas do domínio:
- Catálogo unificado por tipo de mídia (filme, jogo, livro, álbum)
- Página de detalhes por mídia (com ficha técnica e metadados)
- Reviews por usuário (nota, texto, tags e spoilers)
- Perfil público/privado com agregações e tags por gênero
- Sistema de clubes com tópicos e respostas (discussões)
- Troféus/conquistas vinculados à atividade do usuário

## Tecnologias utilizadas (com versões)

Frontend (client)
- React 18.3.1
- React DOM 18.3.1
- React Router DOM 7.12.0
- Vite 7.3.1
- Tailwind CSS 3.4.18
- Axios 1.13.2
- Framer Motion 11.18.2
- Lucide React 0.395.0
- PostCSS 8.5.6
- Autoprefixer 10.4.21

Backend (server)
- Node.js (runtime; recomendado 20+)
- Express 4.22.1
- Prisma 5.22.0
- @prisma/client 5.22.0
- Axios 1.13.2
- bcryptjs 3.0.3
- cors 2.8.5
- dotenv 16.6.1
- jsonwebtoken 9.0.3
- zod 3.25.76

Banco de dados
- PostgreSQL (datasource provider = postgresql no Prisma)

## Pré-requisitos detalhados

Obrigatórios
- Git
- Node.js 20+ e npm
- PostgreSQL em execução e uma database criada

Opcionais (para enriquecer metadados na hidratação)
- Chaves de API (TMDB, RAWG, Last.fm, Google Books)
- User-Agent para MusicBrainz

## Instruções de instalação passo a passo

1) Clonar o repositório

```bash
git clone https://github.com/0zzmandias/Mazarbul.git
cd Mazarbul
```

2) Instalar dependências do backend

```bash
cd server
npm install
```

3) Instalar dependências do frontend

```bash
cd ../client
npm install
```

## Instruções de configuração (variáveis de ambiente, banco de dados)

1) Configurar o banco e o Prisma

No diretório server, crie um arquivo server/.env e configure o DATABASE_URL. Exemplo:

```bash
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/mazarbul?schema=public"
JWT_SECRET="defina-uma-chave-forte-aqui"
PORT=3000

TMDB_API_KEY="sua-chave-tmdb"
RAWG_API_KEY="sua-chave-rawg"
LASTFM_API_KEY="sua-chave-lastfm"
GOOGLE_BOOKS_API_KEY="sua-chave-google-books"
MUSICBRAINZ_USER_AGENT="Mazarbul/1.0.0 (https://github.com/0zzmandias/Mazarbul)"
```

Notas:
- DATABASE_URL é obrigatório.
- As chaves de API são opcionais. Sem elas o sistema ainda roda, mas com metadados menos completos.

2) Aplicar migrations e gerar o Prisma Client

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

3) Opcional: popular banco com seed

```bash
npx prisma db seed
```

## Instruções de execução

1) Iniciar o backend

```bash
cd server
npm run dev
```

2) Iniciar o frontend (em outro terminal)

```bash
cd client
npm run dev
```

3) Acessos
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Estrutura do projeto detalhada

Visão geral

```text
.
├── client
│   ├── src
│   │   ├── components   Componentes reutilizáveis (UI, media, club, dashboard)
│   │   ├── pages        Páginas principais (rotas do React Router)
│   │   ├── contexts     Contextos (AuthContext, UserDatabaseContext)
│   │   ├── hooks        Hooks (ex: useUserProfileData)
│   │   ├── services     Cliente HTTP e serviços para API
│   │   ├── constants    Dicionários (ex: gêneros)
│   │   └── utils        Helpers e formatadores
│   └── vite.config.js
└── server
    ├── prisma
    │   ├── schema.prisma  Modelo de dados
    │   ├── migrations     Histórico de migrations
    │   └── seed.js        Dados iniciais
    └── src
        ├── server.js      Entrypoint do Express
        ├── routes         Rotas HTTP
        ├── controllers    Camada HTTP (req/res)
        ├── services       Regras de negócio (auth, reviews, busca, hidratação)
        ├── utils          Adaptadores (Wikidata, TMDB, RAWG, livros, música)
        ├── middlewares    Autenticação por JWT
        └── lib            Prisma (instância compartilhada)
```

## Funcionalidades implementadas (lista completa)

Backend
- Autenticação
  - Registro e login
  - Emissão e validação de JWT
  - Endpoint de usuário autenticado

- Mídia e catálogo
  - Busca unificada por tipo (filme, jogo, livro, álbum)
  - Página de detalhes por ID de mídia
  - Cache em banco (MediaReference e MediaAlias)
  - Integração de hidratação/enriquecimento via adaptadores externos

- Reviews
  - Criar/atualizar review (autenticado)
  - Listar reviews por mídia
  - Deletar review (autenticado)

- Usuário
  - Perfil público por handle
  - Atualização do perfil autenticado (inclui avatarUrl)

- Clubes e fórum
  - Listagem e detalhes de clubes
  - Criar/editar clube (autenticado)
  - Join/leave de clube (autenticado)
  - Tópicos e respostas (autenticado)
  - Moderação de tópico (pin/lock)

- Troféus/conquistas
  - Serviço de gamificação acoplado ao fluxo de reviews
  - Endpoint de consulta de conquistas do usuário

Frontend
- Sessão do usuário
  - Login e registro
  - Persistência de token e interceptor de requisições

- Busca e navegação
  - Busca instantânea no HeaderBar consumindo o endpoint de busca
  - Página de detalhes de mídia com ficha técnica e reviews

- Reviews
  - Editor de review por mídia

- Perfil
  - Dashboard (perfil privado do usuário)
  - Profile (perfil público por handle)
  - Exibição de tags no perfil com base em gêneros das mídias avaliadas

- Clubes
  - Descoberta e detalhes de clubes
  - Tópicos e respostas

Limitações conhecidas nesta entrega
- HomePage ainda utiliza dados mocados para destaques e feed.
- ForgotPassword e ResetPassword estão simulados, sem fluxo real no backend.
- Existem arquivos de rotas de favoritos e coleções no backend, mas não estão montadas no server/src/server.js nesta entrega.

## Modelo de dados (descrição e diagrama)

Descrição resumida
- User: usuário do sistema (autenticação e perfil)
- MediaReference: item canônico de mídia (id, type, titles por idioma, sinopses, detalhes)
- MediaAlias: aliases normalizados para busca rápida (por idioma e tipo)
- Review: avaliação (rating, conteúdo, tags) ligada a User e MediaReference
- Collection e CollectionItem: listas do usuário e itens adicionados
- Club, ClubMember e ClubWork: clubes, membros e obras associadas a clubes
- Topic e Reply: fórum por clube
- UserAchievement: conquistas desbloqueadas por usuário
- Genre e MediaGenre: gêneros canônicos e associação com mídia

Diagrama ER (Mermaid)

```mermaid
erDiagram
  User ||--o{ Review : writes
  MediaReference ||--o{ Review : receives

  User ||--o{ Collection : owns
  Collection ||--o{ CollectionItem : contains
  MediaReference ||--o{ CollectionItem : is_in

  MediaReference ||--o{ MediaAlias : has

  Genre ||--o{ MediaGenre : links
  MediaReference ||--o{ MediaGenre : links

  Club ||--o{ ClubMember : has
  User ||--o{ ClubMember : joins

  Club ||--o{ Topic : hosts
  User ||--o{ Topic : authors
  Topic ||--o{ Reply : has
  User ||--o{ Reply : authors

  Club ||--o{ ClubWork : tracks
  MediaReference ||--o{ ClubWork : relates
```

## Rotas/Endpoints da API (documentação completa)

Base URL: http://localhost:3000

Health
- GET /
  - Retorna status do servidor.

Auth
- POST /api/auth/register
  - Body: email, handle, password, name (opcional)
  - Cria usuário e retorna token.

- POST /api/auth/login
  - Body: email, password
  - Retorna token.

- GET /api/auth/me
  - Auth: Bearer token
  - Retorna o usuário autenticado.

Media
- GET /api/media/search
  - Query params: q, type, lang
  - Retorna resultados de busca unificada.

- GET /api/media/:id
  - Query params: type (opcional), refresh (opcional)
  - Retorna detalhes da mídia (pode hidratar/enriquecer se necessário).

Reviews
- POST /api/reviews
  - Auth: Bearer token
  - Body: mediaId, rating, content (opcional), tags (opcional), containsSpoilers (opcional)
  - Cria ou atualiza uma review do usuário para a mídia.

- GET /api/reviews/:mediaId
  - Lista reviews de uma mídia.

- GET /api/reviews/user/:userId
  - Lista reviews de um usuário.
  - Observação: nesta entrega há uma limitação de ordem de rotas no Express; ver Melhorias futuras.

- DELETE /api/reviews/:id
  - Auth: Bearer token
  - Remove uma review.

Users
- GET /api/users/profile/:handle
  - Retorna perfil público por handle.

- PUT /api/users/profile
  - Auth: Bearer token
  - Body: campos de perfil (ex: name, bio, avatarUrl)
  - Atualiza o perfil do usuário autenticado.

Achievements
- GET /api/achievements/:userId
  - Retorna conquistas do usuário.

Clubs
- GET /api/clubs
  - Lista clubes.

- GET /api/clubs/:slug
  - Retorna detalhes do clube.

- POST /api/clubs
  - Auth: Bearer token
  - Cria clube.

- PUT /api/clubs/:slug
  - Auth: Bearer token
  - Edita clube.

- POST /api/clubs/:slug/join
  - Auth: Bearer token
  - Entra no clube.

- POST /api/clubs/:slug/leave
  - Auth: Bearer token
  - Sai do clube.

Topics
- GET /api/topics/club/:clubId
  - Lista tópicos de um clube.

- GET /api/topics/:topicId
  - Retorna detalhes do tópico.

- POST /api/topics
  - Auth: Bearer token
  - Cria tópico.

- POST /api/topics/:topicId/reply
  - Auth: Bearer token
  - Cria resposta.

- PATCH /api/topics/:topicId/pin
  - Auth: Bearer token
  - Fixa/desfixa tópico.

- PATCH /api/topics/:topicId/lock
  - Auth: Bearer token
  - Tranca/destranca tópico.

## Screenshots

![Screenshot 01](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2019-20-38%20Mazarbul.png)

![Screenshot 02](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2016-11-48%20Mazarbul.png)

![Screenshot 03](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2019-19-42%20Mazarbul.png)

![Screenshot 04](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-42-22%20Mazarbul.png)

![Screenshot 05](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-41-45%20Mazarbul.png)

![Screenshot 06](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-41-33%20Mazarbul.png)

![Screenshot 07](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-40-44%20Mazarbul.png)

![Screenshot 08](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-40-29%20Mazarbul.png)

![Screenshot 09](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-32-36%20Mazarbul.png)

![Screenshot 10](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-39-35%20Mazarbul.png)

![Screenshot 11](https://github.com/0zzmandias/Mazarbul/raw/main/docs/screenshots/Screenshot%202026-01-19%20at%2022-39-47%20Mazarbul.png)

Para atingir o mínimo de 8, recomenda-se adicionar pelo menos mais 3 screenshots cobrindo:
- Login
- Registro
- Descoberta de Clubes ou Detalhes de Clube

## Decisões técnicas e justificativas

- Wikidata como fonte canônica (QID)
  - Objetivo: garantir uma página única por obra, reduzindo duplicatas geradas por ruído e variações de provedores.
  - Benefício: a navegação se mantém estável mesmo com múltiplas edições (principalmente em livros).

- Cache DB-first com MediaReference e MediaAlias
  - Objetivo: acelerar buscas e evitar chamadas externas repetidas.
  - Benefício: o primeiro acesso pode hidratar, e acessos seguintes tendem a ser mais rápidos.

- Prisma com PostgreSQL
  - Objetivo: modelagem consistente, migrations e query segura via ORM.

- Separação por camadas no backend (routes/controllers/services/utils)
  - Objetivo: manter integrações externas isoladas (adaptadores) e regras de negócio concentradas (services).

## Melhorias futuras (o que poderia ser adicionado)

- Remover dados mocados da Home e substituir por feed real do banco (reviews recentes, destaques, atividade).
- Implementar recuperação de senha real (token, expiração e envio de e-mail).
- Montar rotas de favoritos e coleções no server/src/server.js e concluir o fluxo ponta a ponta no frontend.
- Corrigir a ordem das rotas em reviews para garantir que /api/reviews/user/:userId funcione corretamente.
- Implementar paginação em busca e feeds.
- Padronizar tratamento de erros e respostas HTTP.
- Melhorar estratégia de hidratação (fila, backoff e observabilidade) para lidar melhor com rate limits.
