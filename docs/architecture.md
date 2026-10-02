# Arquitetura

## Visão geral

O Cashflow é uma aplicação **cliente-servidor** com **API REST**:

- **Front-end** — SPA em React + TypeScript, servida estaticamente (Vercel em
  produção, Nginx no Docker). Não contém regra de negócio além de validações de
  conveniência; toda regra vive na API.
- **Back-end** — API stateless em Spring Boot. Autentica via JWT, valida,
  aplica regras de negócio e persiste no PostgreSQL via JPA/Hibernate.
- **Banco** — PostgreSQL. O schema é versionado com **Flyway**; o Hibernate
  apenas **valida** o mapeamento (`ddl-auto: validate`).

```
 Navegador ──HTTPS──▶ Vercel (SPA estática)
     │
     └──HTTPS / JSON + Authorization: Bearer <JWT>──▶ Render (Spring Boot)
                                                         │ JDBC (SSL)
                                                         ▼
                                                   Supabase (PostgreSQL)
```

## Back-end

### Organização: pacote por funcionalidade + camadas

Cada funcionalidade é um pacote autocontido; dentro dele, a separação clássica
em camadas:

```
com.cashflow.api
├── auth/          AuthController → AuthService → UserRepository
├── user/          UserController → UserService → UserRepository
├── category/      CategoryController → CategoryService → CategoryRepository
├── transaction/   TransactionController → TransactionService → TransactionRepository
├── budget/        BudgetController → BudgetService → BudgetRepository (+ TransactionRepository)
├── dashboard/     DashboardController → DashboardService → TransactionRepository, BudgetRepository
├── common/
│   ├── domain/        TransactionType (enum compartilhado)
│   ├── exception/     exceções de negócio + GlobalExceptionHandler (RFC 9457)
│   ├── persistence/   AuditableEntity (UUID + created_at/updated_at)
│   ├── security/      TokenService, @CurrentUserId
│   └── web/           PageResponse, MonthRange
└── config/        SecurityConfig, WebConfig, OpenApiConfig, *Properties
```

**Por que pacote por funcionalidade?** Uma mudança em "orçamentos" fica
concentrada num só pacote; novas funcionalidades (ex.: metas, contas recorrentes)
entram como pacotes novos sem tocar nos existentes. As camadas continuam
explícitas dentro de cada pacote.

### Responsabilidade de cada camada

| Camada | Responsabilidade | Não faz |
|---|---|---|
| **Controller** | Mapear HTTP ↔ DTO, validar entrada (`@Valid`), resolver o usuário (`@CurrentUserId`), documentar (OpenAPI) | Regra de negócio, acesso a banco |
| **Service** | Regras de negócio, transações (`@Transactional`), checagem de propriedade dos dados, conversão entidade → DTO | Conhecer HTTP |
| **Repository** | Acesso a dados com Spring Data JPA: consultas derivadas, JPQL agregada, `Specification` para filtros dinâmicos | Regra de negócio |

- **DTOs são `record`s** imutáveis; entidades nunca saem da camada de serviço.
- Serviços de uma funcionalidade podem usar o **serviço** de outra (ex.:
  `TransactionService` usa `CategoryService.getOwned`) — nunca o controller.

### Modelo de dados

```
users 1───* categories 1───* transactions
  │             │
  │             └──────* budgets
  └────────────────────* transactions / budgets
```

| Tabela | Campos principais | Regras |
|---|---|---|
| `users` | `id`, `name`, `email` (único, minúsculo), `password_hash` (BCrypt) | |
| `categories` | `user_id`, `name`, `type` (`INCOME`/`EXPENSE`), `color`, `icon` | Nome único por usuário e tipo; tipo imutável |
| `transactions` | `user_id`, `category_id`, `type`, `description`, `amount` `NUMERIC(14,2)`, `occurred_on` | `amount > 0`; `type` copiado da categoria; FK `RESTRICT` na categoria |
| `budgets` | `user_id`, `category_id`, `reference_month` (dia 1), `amount` | Único por (usuário, categoria, mês); só categorias de despesa |

Decisões relevantes:

- **UUID** como chave: ids não sequenciais não revelam volume nem permitem
  enumeração.
- **`NUMERIC(14,2)` + `BigDecimal`** para dinheiro (nunca ponto flutuante).
- **`type` desnormalizado** em `transactions`: as agregações mensais filtram por
  tipo sem `JOIN`. Como o tipo da categoria é imutável, não há risco de
  divergência.
- Índice `(user_id, occurred_on)` atende a consulta dominante: "lançamentos do
  usuário no mês".

### Isolamento entre usuários (multi-tenant por linha)

Toda consulta de serviço filtra pelo `userId` extraído do JWT
(`findByIdAndUserId`, `Specification` com `user.id = :userId` etc.). Acessar um
recurso de outro usuário resulta em **404** — a API não confirma que o recurso
existe. Há teste de integração cobrindo esse cenário.

### Segurança

- **Spring Security** stateless, CSRF desabilitado (não há cookies de sessão).
- A API **emite** o JWT (`JwtEncoder`, HS256) e o **valida** como OAuth2
  Resource Server (`JwtDecoder` + validação de `iss` e expiração).
- Claims: `sub` = id do usuário, `name`, `email`, `iat`, `exp`, `iss`.
- Senhas com **BCrypt**. Login responde a mesma mensagem para e-mail inexistente
  e senha errada.
- CORS restrito às origens configuradas em `CORS_ALLOWED_ORIGINS`.
- Rotas públicas: `POST /api/v1/auth/**`, `/actuator/health`, documentação.

### Tratamento de erros

`GlobalExceptionHandler` converte exceções em **Problem Details (RFC 9457)**:

| Exceção | Status |
|---|---|
| `MethodArgumentNotValidException` | 400 (+ `errors` por campo) |
| `InvalidCredentialsException` | 401 |
| `ResourceNotFoundException` | 404 |
| `ConflictException`, `DataIntegrityViolationException` | 409 |
| `BusinessRuleException` | 422 |
| Qualquer outra | 500 (logada, sem detalhes ao cliente) |

### Testes

- **Integração** (`CashflowApiIntegrationTest`): sobe o contexto completo com
  MockMvc + H2 em modo PostgreSQL, aplicando as **mesmas migrações Flyway**.
  Cobre cadastro/login, autorização, fluxo mensal completo (lançamentos →
  orçamento → dashboard → cópia de orçamentos), isolamento entre usuários,
  validação e regras de negócio.
- **Unitários**: lógica pura (ex.: `MonthRangeTest`).

## Front-end

Detalhado em [frontend.md](frontend.md). Em resumo: organização por
funcionalidade, TanStack Query como cache de dados do servidor, Context API para
estado de UI global (sessão, tema, mês de referência) e um design system próprio
em CSS + Tailwind.

## Escalabilidade — próximos passos naturais

A estrutura atual comporta evolução sem reescrita:

| Necessidade | Caminho |
|---|---|
| Mais usuários | API é stateless → escalar horizontalmente; ajustar `DATABASE_POOL_SIZE` e usar o pooler do Supabase |
| Lançamentos recorrentes / metas | Novo pacote `recurring/` ou `goal/` + nova migração `V2__...sql` |
| Refresh token / logout global | Tabela de refresh tokens + endpoint `/auth/refresh` |
| Relatórios pesados | Consultas agregadas já isoladas em `TransactionRepository`; podem migrar para views materializadas |
| Testes contra PostgreSQL real | Trocar H2 por Testcontainers nos testes de integração |
| Observabilidade | Actuator já incluso; adicionar Micrometer + Prometheus/OTel |
