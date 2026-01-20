# Mazarbul

Mazarbul é uma aplicação web para registro, avaliação e organização de consumo cultural. O sistema permite catalogar e publicar avaliações de filmes, livros, jogos e álbuns, com foco em busca unificada e páginas canônicas de mídia.

Helton Alves Sá - 2019014022

## Tecnologias utilizadas (versões específicas)

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
- Node.js 20.19.0+ (ou Node.js 22.12.0+) 
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

## Pré-requisitos para executar o projeto

- Git
- Node.js 20.19.0+ (ou Node.js 22.12.0+)
- npm (incluído com Node)
- PostgreSQL em execução e uma database criada
- Opcional (para hidratação completa de metadados): chaves de API para TMDB, RAWG e Last.fm

## Instruções de instalação passo a passo

1) Clonar o repositório

```bash
git clone https://github.com/0zzmandias/Mazarbul.git
cd Mazarbul
```

2) Configurar o backend

```bash
cd server
npm install
```

Crie um arquivo server/.env com as variáveis necessárias (exemplos abaixo). Ajuste usuário, senha, host, porta e nome da base.

```bash
# obrigatória
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/mazarbul?schema=public"

# opcional (se não definir, o backend usa um valor padrão)
JWT_SECRET="defina-uma-chave-forte-aqui"

# opcionais, mas recomendadas para enriquecer dados na hidratação
TMDB_API_KEY="sua-chave-tmdb"
RAWG_API_KEY="sua-chave-rawg"
LASTFM_API_KEY="sua-chave-lastfm"

# opcionais
GOOGLE_BOOKS_API_KEY="sua-chave-google-books"
MUSICBRAINZ_USER_AGENT="Mazarbul/1.0.0 (https://github.com/0zzmandias/Mazarbul)"

# opcional
PORT=3000
```

Aplicar migrations e gerar o Prisma Client

```bash
npx prisma generate
npx prisma migrate dev
```

Opcional: popular o banco com dados de seed

```bash
npx prisma db seed
```

3) Configurar o frontend

```bash
cd ../client
npm install
```

## Instruções de execução (como rodar o servidor)

1) Em um terminal, iniciar o backend

```bash
cd server
npm run dev
```

2) Em outro terminal, iniciar o frontend

```bash
cd client
npm run dev
```

3) Acessar no navegador

- Frontend: http://localhost:5173
- Backend (base): http://localhost:3000

## Estrutura do projeto (descrição das pastas principais)

Visão geral do monorepo

```text
.
├── client
│   └── src
│       ├── components   Componentes reutilizáveis de UI
│       ├── pages        Páginas (rotas) do React Router
│       ├── contexts     Contextos (Auth, UserDatabase)
│       ├── hooks        Hooks (ex: useUserProfileData)
│       ├── services     Clientes HTTP e serviços para API
│       └── utils        Helpers e formatadores
└── server
    ├── prisma           Schema, migrations e seed
    └── src
        ├── routes       Definição das rotas HTTP
        ├── controllers  Camada HTTP (req/res)
        ├── services     Regras de negócio (auth, reviews, busca, hidratação)
        ├── utils        Adaptadores para APIs externas (Wikidata, TMDB, RAWG, etc)
        ├── middlewares  Autenticação por JWT
        └── lib          Instância do Prisma
```

## Funcionalidades implementadas (lista das funcionalidades entregues)

Backend (server)
- Autenticação
  - Registro e login com hash de senha (bcrypt) e emissão de JWT
  - Endpoint /me para recuperar o usuário autenticado

- Busca e detalhes de mídia
  - Busca unificada por query e tipo
  - Página de detalhes por ID (inclui lógica de hidratação/enriquecimento)
  - Integração com Wikidata (fonte principal de identidade) e adaptadores de enriquecimento

- Reviews
  - Criar/atualizar review
  - Listar reviews por mídia
  - Deletar review

- Perfil de usuário
  - Buscar perfil público por handle (inclui favoritos, coleções e contagens)
  - Atualizar perfil do usuário autenticado (nome, bio, avatar)

- Gamificação
  - Listar conquistas do usuário
  - Serviço de gamificação acoplado ao fluxo de reviews

- Clubes e tópicos
  - CRUD básico de clubes e associação de membros
  - Criação e listagem de tópicos e respostas
  - Ações de moderação (pin/lock) no backend

Frontend (client)
- Autenticação e sessão
  - Páginas de login e registro
  - Persistência de token e interceptor de requisições

- Páginas principais
  - Dashboard (perfil privado) consumindo dados reais do backend
  - Profile (perfil público) consumindo dados reais do backend
  - MediaDetails (detalhes de mídia + editor de review)

- Busca instantânea
  - Autocomplete no HeaderBar com chamadas ao endpoint de busca

- Clubes e tópicos
  - Páginas de descoberta e detalhes de clubes
  - Página de tópico com respostas

## Funcionalidades não implementadas (o que ficou de fora desta entrega)

Dados mocados ainda presentes no frontend
- HomePage
  - Destaques (highlights), reviews da comunidade e atividade de amigos são dados estáticos (staticHomeDatabase)

- FavoritesPage, ReviewsPage e ListManagementPage
  - Usuário logado simulado via constante LOGGED_IN_USER_HANDLE = "alexl" para definir isOwner
  - ListManagementPage usa uma base local em memória para busca/seleção de mídia (não usa a busca unificada do backend)

- ClubDetailsPage
  - Alguns contadores exibidos na UI estão hardcoded (ex: número de tópicos e participantes)

- ForgotPasswordPage e ResetPasswordPage
  - Fluxos de recuperação e redefinição de senha são simulados (sem integração com backend)

Endpoints existentes no código, mas não disponíveis nesta entrega
- Existem rotas e controllers para favoritos e coleções no backend, mas elas não estão registradas no server/src/server.js nesta entrega
  - Consequência: o frontend pode receber 404 ao chamar /api/favorites e /api/collections

Páginas não presentes nesta entrega
- Páginas completas de listas (ex: ListDetailsPage e ListEditorPage) não constam no client/src/pages

## Decisões técnicas

- React + Vite
  - Escolha voltada para produtividade no desenvolvimento e build rápido.

- Tailwind CSS
  - Permite padronizar layout e UI de forma consistente e com baixo custo de manutenção.

- Node.js + Express
  - API leve e direta, compatível com a divisão de camadas routes/controllers/services.

- Prisma + PostgreSQL
  - Prisma facilita a evolução do schema, migrations e queries tipadas.
  - PostgreSQL oferece base relacional estável para usuários, reviews, clubes, relações e cache de mídia.

- Wikidata como fonte canônica
  - O sistema trata o Wikidata como fonte principal de identidade (QID), reduzindo duplicatas e facilitando canonicalização.
  - Dados de terceiros (TMDB, RAWG, Google Books, Last.fm, MusicBrainz) são usados para enriquecer campos específicos.

- Cache local e busca DB-first
  - MediaReference armazena a referência canônica e campos enriquecidos.
  - MediaAlias guarda títulos normalizados para acelerar autocomplete e busca.

- Estratégia de hidratação
  - Itens podem começar como stub e serem enriquecidos sob demanda.
  - Adaptadores isolam integrações externas e permitem trocar provedores sem reescrever a regra de negócio.

## Rotas/Endpoints (lista das rotas da API)

Base: http://localhost:3000

Health
- GET /

Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Media
- GET /api/media/search
  - query params: q, type, lang
- GET /api/media/:id
  - query params: type, refresh

Reviews
- POST /api/reviews
- GET /api/reviews/:mediaId
- GET /api/reviews/user/:userId
- DELETE /api/reviews/:id

Users
- GET /api/users/profile/:handle
- PUT /api/users/profile

Achievements
- GET /api/achievements/:userId

Clubs
- GET /api/clubs
- GET /api/clubs/:slug
- POST /api/clubs
- PUT /api/clubs/:slug
- POST /api/clubs/:slug/join
- POST /api/clubs/:slug/leave

Topics
- GET /api/topics/club/:clubId
- GET /api/topics/:topicId
- POST /api/topics
- POST /api/topics/:topicId/reply
- PATCH /api/topics/:topicId/pin
- PATCH /api/topics/:topicId/lock

Observação
- As rotas /api/favorites e /api/collections possuem arquivos de rota no projeto, mas não estão montadas no server/src/server.js nesta entrega.

## Screenshots das principais telas funcionando 

![Tela 1](docs/screenshots/01.png)
![Tela 2](docs/screenshots/02.png)
![Tela 3](docs/screenshots/03.png)
![Tela 4](docs/screenshots/04.png)
![Tela 5](docs/screenshots/05.png)

## Dificuldades encontradas e como foram resolvidas

- Upload de avatar (payload grande)
  - Solução: aumento do limite do body JSON no backend (50mb) para suportar avatar em base64.

- Canonicalização e enriquecimento multi-fonte
  - Solução: Wikidata como fonte principal de identidade e estrutura de adaptadores para enriquecer com TMDB, RAWG, Google Books, Last.fm e MusicBrainz.

- Multilíngue
  - Solução: armazenamento de títulos e sinopses por idioma em campos JSON (PT, EN, ES) e suporte a aliases por idioma.

- Performance de busca
  - Solução: índice MediaAlias com título normalizado e indexes no schema para consultas rápidas.

- Rate limit em integração externa (MusicBrainz)
  - Solução: fila e intervalo mínimo entre requisições no adaptador para reduzir erros por excesso de chamadas.

## Diagrama de Arquitetura (opcional, recomendado)

Diagrama simples do fluxo de dados

```text
[Browser]
   |
   | HTTP (Axios)
   v
[client (React/Vite)]
   |
   | HTTP REST /api/*
   v
[server (Express)]
   |
   | Prisma
   v
[PostgreSQL]

Integrações de enriquecimento (na hidratação/busca)

[server] -> Wikidata
[server] -> TMDB (filmes)
[server] -> RAWG (jogos)
[server] -> Google Books (sinopses/capas)
[server] -> Last.fm + MusicBrainz (álbuns)
```

Estrutura do monorepo (visão de arquitetura por pastas)

```text
client/  -> UI, rotas e chamadas de API
server/  -> API, regras de negócio, persistência e integrações externas
```
