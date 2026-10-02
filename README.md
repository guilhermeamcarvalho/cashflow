# Cashflow

Aplicação web para **controle de gastos pessoais mensais**: registre receitas e
despesas, organize por categorias, defina orçamentos por categoria e acompanhe o
mês num dashboard — tudo numa interface **Liquid Glass**, pensada para o celular,
com barra de navegação inferior.

```
┌──────────────────────┐
│      FRONT-END       │   React 19 + TypeScript + Vite + Tailwind CSS v4
│  (Vercel / Nginx)    │   TanStack Query · React Router · Recharts
└──────────┬───────────┘
           │ REST / JSON  (JWT Bearer)
           ▼
┌──────────────────────┐
│       BACK-END       │   Java 21 + Spring Boot 4
│   Controller         │   Spring Security (JWT) · Bean Validation
│   Service            │   Spring Data JPA / Hibernate · Flyway
│   Repository         │   OpenAPI (Swagger UI)
└──────────┬───────────┘
           │ JPA / Hibernate
           ▼
┌──────────────────────┐
│      PostgreSQL      │   Docker (local) · Supabase (produção)
└──────────────────────┘
```

## Funcionalidades

| Área | O que faz |
|---|---|
| **Autenticação** | Cadastro e login com JWT; categorias padrão criadas no cadastro |
| **Dashboard** | Saldo do mês, receitas × despesas com variação vs. mês anterior, consumo do orçamento, gastos por dia, ranking por categoria, **gastos por mês com filtros** (6/12 meses ou ano; despesas, receitas ou comparação; por categoria) e últimos lançamentos |
| **Lançamentos** | CRUD de receitas/despesas, filtro por tipo, busca por descrição, agrupamento por dia, paginação |
| **Orçamentos** | Limite mensal por categoria de despesa, status (dentro/perto/estourado), cópia do mês anterior |
| **Categorias** | CRUD com cor e ícone; exclusão bloqueada se houver lançamentos |
| **Ajustes** | Tema claro/escuro/sistema, editar perfil, alterar senha, sair |

## Início rápido

### Opção 1 — tudo com Docker (recomendado)

```bash
docker compose up --build
```

| Serviço | URL |
|---|---|
| Aplicação | http://localhost:3000 |
| API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| PostgreSQL | `localhost:5432` (usuário/senha/banco: `cashflow`) |

### Opção 2 — desenvolvimento com hot reload

Pré-requisitos: **Java 21**, **Node 22**, **Docker** (só para o banco).

```bash
# 1. Banco
docker compose up -d db

# 2. API (porta 8080) — o Maven Wrapper baixa o Maven automaticamente
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 3. Front-end (porta 5173) — /api é encaminhado para a API pelo Vite
cd frontend
npm install
npm run dev
```

## Testes e qualidade

```bash
cd backend  && ./mvnw verify          # testes unitários + integração (H2 em modo PostgreSQL)
cd frontend && npm run lint && npm test && npm run build
```

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa o mesmo
em cada push/PR.

## Estrutura do repositório

```
cashflow/
├── backend/                 API Spring Boot (ver docs/architecture.md)
│   └── src/main/java/com/cashflow/api/
│       ├── auth/            cadastro e login
│       ├── user/            perfil do usuário
│       ├── category/        categorias
│       ├── transaction/     lançamentos
│       ├── budget/          orçamentos
│       ├── dashboard/       resumo mensal
│       ├── common/          exceções, segurança, utilitários web, entidade base
│       └── config/          segurança, CORS, OpenAPI, propriedades
├── frontend/                SPA React (ver docs/frontend.md)
│   └── src/
│       ├── app/             providers, rotas, tema, mês de referência
│       ├── components/      ui/ (design system) e layout/ (barra inferior...)
│       ├── features/        uma pasta por funcionalidade (api + telas)
│       ├── lib/             cliente HTTP, formatação, utilitários
│       ├── styles/          tokens e componentes Liquid Glass
│       └── types/           contrato da API
├── docs/                    documentação técnica e ADRs
├── docker-compose.yml       ambiente local completo
└── render.yaml              blueprint de deploy da API
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Visão geral, camadas, modelo de dados, segurança, decisões |
| [docs/api.md](docs/api.md) | Referência dos endpoints REST e formato de erros |
| [docs/frontend.md](docs/frontend.md) | Organização do front-end, estado, design system Liquid Glass |
| [docs/deployment.md](docs/deployment.md) | Deploy em Supabase + Render + Vercel e variáveis de ambiente |
| [docs/adr/](docs/adr/) | Registros de decisões de arquitetura |

## Variáveis de ambiente

**API** (`backend`)

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/cashflow` | URL JDBC do PostgreSQL |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | `cashflow` / `cashflow` | Credenciais do banco |
| `DATABASE_POOL_SIZE` | `5` | Tamanho do pool Hikari |
| `JWT_SECRET` | valor de dev | **Obrigatório em produção**, ≥ 32 caracteres |
| `JWT_EXPIRATION` | `PT12H` | Validade do token (ISO-8601) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origens permitidas (aceita `https://*.vercel.app`) |
| `API_DOCS_ENABLED` | `true` | Liga/desliga Swagger UI e `/v3/api-docs` |
| `PORT` | `8080` | Porta HTTP |

**Front-end** (`frontend`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL pública da API (vazio = mesma origem / proxy) |
