# Mazarbul

Mazarbul é uma aplicação web focada no registro e partilha de atividades culturais. A plataforma permite que os utilizadores cataloguem, avaliem e organizem mídias como filmes, livros, jogos e álbuns, funcionando como um diário pessoal de consumo cultural que pode ser partilhado publicamente.

## Stack Técnica

-   **Framework:** React
-   **Build Tool:** Vite
-   **Estilização:** Tailwind CSS
-   **Roteamento:** React Router DOM
-   **Ícones:** Lucide React

## Estrutura e Funcionalidades do Projeto

### Funcionalidades Implementadas (UI)

-   **`HomePage.jsx`** (Rota: `/`)
    A página inicial do Mazarbul. A sua estrutura existe, mas o conteúdo dinâmico (destaques, atividade de amigos) ainda não foi implementado.

-   **`DashboardPage.jsx`** (Rota: `/dashboard`)
    O perfil privado do utilizador autenticado, exibindo seus favoritos, reviews, listas e conquistas.

-   **`ProfilePage.jsx`** (Rota: `/profile/:handle`)
    A página de perfil público de outro utilizador, com um layout idêntico ao do Dashboard.

-   **`MediaDetailsPage.jsx`** (Rota: `/media/:mediaId`)
    A página de detalhes de um item (filme, livro, etc.), mostrando sinopse, ficha técnica e o editor para o utilizador submeter a sua própria review.

-   **`LoginPage.jsx`** (Rota: `/login`)
    Permite que um utilizador existente faça login com e-mail e palavra-passe.

-   **`RegisterPage.jsx`** (Rota: `/register`)
    Permite que um novo utilizador se registe com nome, e-mail, @username e palavra-passe.

-   **`ForgotPasswordPage.jsx`** (Rota: `/forgot-password`)
    Formulário para o utilizador inserir o e-mail para iniciar a recuperação de palavra-passe.

-   **`ResetPasswordPage.jsx`** (Rota: `/reset-password`)
    Página acedida via e-mail onde o utilizador define uma nova palavra-passe.

-   **`SettingsPage.jsx`** (Rota: `/settings`)
    Página de configurações com seções para Perfil, Conta e Preferências.

-   **Busca Instantânea no HeaderBar**
    Funcionalidade de autocomplete focada na descoberta de mídias. Sugere resultados em tempo real enquanto o utilizador digita, com suporte multilíngue e para aliases.

### Funcionalidades Planeadas (Roadmap)

-   **Páginas de Expansão do Perfil ("Ver Mais")**
    -   `FavoritesPage.jsx` (ex: `/profile/alexl/favorites`): Grelha com todos os favoritos do utilizador.
    -   `ReviewsPage.jsx` (ex: `/profile/alexl/reviews`): Lista paginada de todas as reviews do utilizador.
    -   `AchievementsPage.jsx` (ex: `/profile/alexl/achievements`): Página mostrando todas as conquistas do utilizador.

-   **Páginas de Listas (Collections)**
    -   `ListDetailsPage.jsx` (ex: `/profile/alexl/list/classicos`): Mostra o conteúdo completo de uma lista específica.
    -   `ListEditorPage.jsx` (ex: `/list/new`): Um editor para o utilizador criar e modificar listas, adicionando mídias a elas.

-   **Páginas de Clubes**
    -   `ClubsDiscoveryPage.jsx` (ex: `/clubs`): Página para explorar e procurar todos os clubes existentes através de uma busca contextual.
    -   `ClubDetailsPage.jsx` (ex: `/club/guerra-nas-estrelas`): Página de um clube, mostrando membros e discussões.

## Como Executar Localmente

1.  **Clonar o repositório:**
    ```bash
    git clone [[https://github.com/0zzmandias/Mazarbul.git]](https://github.com/0zzmandias/Mazarbul.git)
    ```

2.  **Aceder ao diretório do projeto:**
    ```bash
    cd Mazarbul
    ```

3.  **Instalar as dependências:**
    ```bash
    npm install
    ```

4.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
