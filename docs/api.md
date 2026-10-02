# Referência da API

- **Base:** `/api/v1`
- **Formato:** JSON (UTF-8)
- **Autenticação:** `Authorization: Bearer <token>` em todas as rotas, exceto
  `/auth/*`
- **Documentação interativa:** `/swagger-ui.html` (OpenAPI em `/v3/api-docs`)

Convenções:

| Tipo | Formato | Exemplo |
|---|---|---|
| Dinheiro | número decimal, 2 casas | `1234.56` |
| Data | `YYYY-MM-DD` | `2026-10-05` |
| Mês de referência | `YYYY-MM` | `2026-10` |
| Ids | UUID | `3f2c…` |
| Tipo de lançamento | `INCOME` \| `EXPENSE` | |

Quando o parâmetro `month` é omitido, a API usa o **mês corrente**.

---

## Autenticação

### `POST /auth/register` → `201`

```json
{ "name": "Ana Souza", "email": "ana@email.com", "password": "minimo8chars" }
```

Cria a conta com as categorias padrão e já retorna o token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9…",
  "expiresAt": "2026-10-02T06:00:00Z",
  "user": { "id": "…", "name": "Ana Souza", "email": "ana@email.com", "createdAt": "…" }
}
```

Erros: `400` validação · `409` e-mail já cadastrado.

### `POST /auth/login` → `200`

```json
{ "email": "ana@email.com", "password": "minimo8chars" }
```

Mesma resposta do cadastro. Erros: `401` credenciais inválidas.

---

## Usuário

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/users/me` | Perfil do usuário autenticado |
| `PUT` | `/users/me` | Atualiza o nome — `{ "name": "…" }` |
| `PUT` | `/users/me/password` | `{ "currentPassword": "…", "newPassword": "…" }` → `204`; `422` se a senha atual estiver errada |

---

## Categorias

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/categories?type=EXPENSE` | Lista (filtro de tipo opcional), ordenada por nome |
| `POST` | `/categories` | Cria → `201` |
| `PUT` | `/categories/{id}` | Atualiza nome, cor e ícone (tipo é imutável) |
| `DELETE` | `/categories/{id}` | Exclui → `204`; `409` se houver lançamentos |

```json
{ "name": "Pets", "type": "EXPENSE", "color": "#F59E0B", "icon": "paw-print" }
```

`color` no formato `#RRGGBB`; `icon` é um nome do conjunto Lucide suportado pelo
front-end (ver `CATEGORY_ICONS` em `frontend/src/components/ui/CategoryIcon.tsx`).

---

## Lançamentos

### `GET /transactions`

| Parâmetro | Obrigatório | Descrição |
|---|---|---|
| `month` | não | `YYYY-MM` (padrão: mês atual) |
| `type` | não | `INCOME` ou `EXPENSE` |
| `categoryId` | não | Filtra por categoria |
| `search` | não | Trecho da descrição (sem diferenciar maiúsculas) |
| `page` | não | Página, base 0 (padrão `0`) |
| `size` | não | Itens por página, 1–100 (padrão `50`) |

Ordenação: data decrescente, depois criação decrescente.

```json
{
  "content": [
    {
      "id": "…",
      "type": "EXPENSE",
      "description": "Mercado",
      "amount": 150.00,
      "date": "2026-10-05",
      "notes": null,
      "category": { "id": "…", "name": "Alimentação", "type": "EXPENSE", "color": "#F97316", "icon": "utensils" },
      "createdAt": "2026-10-05T14:03:11Z"
    }
  ],
  "page": 0, "size": 50, "totalElements": 1, "totalPages": 1
}
```

### Demais operações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/transactions/{id}` | Detalhe |
| `POST` | `/transactions` | Cria → `201` |
| `PUT` | `/transactions/{id}` | Atualiza |
| `DELETE` | `/transactions/{id}` | Exclui → `204` |

```json
{ "categoryId": "…", "description": "Mercado", "amount": 150.00, "date": "2026-10-05", "notes": "opcional" }
```

O **tipo** do lançamento é o tipo da categoria escolhida.

---

## Orçamentos

### `GET /budgets?month=2026-10`

```json
{
  "month": "2026-10",
  "totalBudgeted": 1300.00,
  "totalSpent": 818.85,
  "items": [
    {
      "id": "…",
      "month": "2026-10",
      "category": { "id": "…", "name": "Alimentação", "…": "…" },
      "amount": 900.00,
      "spent": 618.85,
      "remaining": 281.15,
      "percentUsed": 69
    }
  ]
}
```

`items` vem ordenado do mais consumido para o menos consumido. `percentUsed`
pode passar de 100 e `remaining` pode ser negativo quando o limite estoura.

| Método | Rota | Descrição |
|---|---|---|
| `PUT` | `/budgets` | Cria ou atualiza (upsert) — `{ "categoryId", "month", "amount" }`; `422` se a categoria for de receita |
| `POST` | `/budgets/copy` | `{ "fromMonth": "2026-09", "toMonth": "2026-10" }` — copia sem sobrescrever os existentes |
| `DELETE` | `/budgets/{id}` | Remove → `204` |

---

## Dashboard

### `GET /dashboard/summary?month=2026-10`

```json
{
  "month": "2026-10",
  "current":  { "income": 8700.00, "expenses": 3271.15, "balance": 5428.85 },
  "previous": { "income": 7200.00, "expenses": 2909.00, "balance": 4291.00 },
  "budgeted": 3650.00,
  "budgetSpent": 3002.85,
  "expensesByCategory": [
    { "categoryId": "…", "name": "Moradia", "color": "#6366F1", "icon": "home", "total": 2100.00, "count": 1, "percent": 64 }
  ],
  "recentTransactions": [ "… até 5 lançamentos do mês …" ]
}
```

- `budgetSpent` considera apenas categorias **com orçamento** no mês.
- A visão dia a dia fica em `/dashboard/daily-totals` (abaixo).

### `GET /dashboard/monthly-totals?from=2026-05&to=2026-10&categoryId=…`

Série mês a mês para o gráfico "Gastos por mês".

| Parâmetro | Obrigatório | Descrição |
|---|---|---|
| `from` | não | Mês inicial `YYYY-MM` (padrão: 5 meses antes de `to`) |
| `to` | não | Mês final `YYYY-MM` (padrão: mês atual) |
| `categoryId` | não | Restringe a uma categoria do usuário (`404` se não for dele) |

```json
{
  "from": "2026-05",
  "to": "2026-10",
  "categoryId": null,
  "months": [
    { "month": "2026-05", "income": 7200.00, "expenses": 3020.00, "balance": 4180.00 },
    { "month": "2026-06", "income": 0, "expenses": 0, "balance": 0 }
  ]
}
```

- Todos os meses do intervalo aparecem, inclusive os sem lançamentos (zerados).
- Intervalo máximo de **24 meses**; `from` posterior a `to` ou intervalo maior
  respondem `422`.

### `GET /dashboard/daily-totals?month=2026-10&categoryId=…`

Série dia a dia de um mês (usada quando o filtro do gráfico está em "mês
específico").

```json
{
  "month": "2026-10",
  "categoryId": null,
  "days": [
    { "date": "2026-10-01", "income": 0, "expenses": 0, "balance": 0 },
    { "date": "2026-10-02", "income": 0, "expenses": 40.00, "balance": -40.00 }
  ]
}
```

Todos os dias do mês aparecem (28 a 31), inclusive os sem lançamentos.
`categoryId` de outro usuário responde `404`.

---

## Erros (RFC 9457 — Problem Details)

Todas as respostas de erro seguem o mesmo formato:

```json
{
  "type": "about:blank",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Verifique os campos informados",
  "instance": "/api/v1/transactions",
  "errors": { "amount": "O valor deve ser maior que zero" }
}
```

| Status | Quando |
|---|---|
| `400` | Validação de campos (`errors` por campo) |
| `401` | Token ausente/inválido/expirado ou credenciais inválidas |
| `404` | Recurso inexistente **ou de outro usuário** |
| `409` | Conflito (e-mail ou nome duplicado, categoria em uso) |
| `422` | Regra de negócio violada |
| `500` | Erro inesperado (detalhes apenas no log) |

## Health check

`GET /actuator/health` → `{"status":"UP"}` (público; usado por Docker e Render).
