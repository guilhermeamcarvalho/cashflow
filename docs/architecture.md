# Arquitetura

## Visão geral

O Cashflow é uma **SPA sem servidor**: React + TypeScript servido como site
estático (Vercel). Os dados ficam no navegador do usuário, em **IndexedDB**.
Não há conta, login nem API — cada navegador tem seus próprios dados (ver
[ADR 0005](adr/0005-dados-locais.md)).

```
 Navegador
 ├── telas (features/*)  ── hooks TanStack Query ──┐
 │                                                 ▼
 ├── camada de dados (src/data) ── regras de negócio, validação
 │        │
 │        ▼
 └── IndexedDB  (um documento com todo o estado)  ⇄  backup .json
```

## Camada de dados (`src/data`)

Faz o papel que a API fazia: as telas chamam funções assíncronas
(`listTransactions`, `createCreditCard`, `monthlySummary`…) que devolvem
exatamente os tipos de `src/types/api.ts`. Por isso as telas e os hooks
continuaram iguais quando o back-end foi removido.

| Arquivo | Responsabilidade |
|---|---|
| `store.ts` | Estado em memória + gravação no IndexedDB; fila que serializa leituras e escritas; sincronização entre abas |
| `schema.ts` | Formato dos registros guardados (e do backup); versão e migração |
| `categories.ts`, `transactions.ts`, `creditCards.ts`, `recurring.ts`, `budgets.ts`, `dashboard.ts`, `profile.ts` | Regras de negócio de cada funcionalidade |
| `backup.ts` | Exportar, importar e apagar tudo |
| `mappers.ts` | Registro interno → tipo das telas (centavos → reais, ids → objetos) |
| `validation.ts`, `errors.ts` | Validação por campo e `AppError` (com `status` e `fieldErrors`) |
| `clock.ts`, `money.ts` | "Hoje" (substituível nos testes) e conversão de dinheiro |

### Armazenamento

- Todo o estado é **um único documento** (`Database`) carregado na memória na
  primeira consulta e regravado inteiro no IndexedDB a cada alteração. Para o
  volume de um controle financeiro pessoal (milhares de lançamentos) isso é
  rápido e mantém as consultas como simples filtros em arrays.
- **Escritas são atômicas:** `write(fn)` trabalha numa cópia (`structuredClone`);
  se `fn` lançar um erro de regra, nada é gravado.
- **Fila única:** leituras e escritas passam por uma fila, então nenhuma leitura
  vê uma escrita pela metade.
- **Várias abas:** depois de gravar, a aba avisa as outras por
  `BroadcastChannel`; elas descartam o estado em memória e o TanStack Query
  recarrega as telas.
- Na primeira gravação o app pede `navigator.storage.persist()`, para o
  navegador não apagar os dados quando faltar espaço.

### Modelo de dados

| Coleção | Campos principais | Regras |
|---|---|---|
| `profile` | `name` | `null` até o primeiro acesso (tela de boas-vindas) |
| `categories` | `name`, `type` (`INCOME`/`EXPENSE`), `color`, `icon` | Nome único por tipo; tipo imutável; exclusão bloqueada com lançamentos/fixos (orçamentos da categoria são removidos) |
| `transactions` | `categoryId`, `type`, `description`, `amount`, `date`, `paymentMethod`, `creditCardId`, `invoiceMonth`, parcelas, `recurringId` | `type` copiado da categoria; receitas não têm forma de pagamento |
| `budgets` | `categoryId`, `month`, `amount` | Um por categoria e mês; só categorias de despesa |
| `creditCards` | `name`, `color`, `closingDay`, `dueDay`, `creditLimit` | Nome único; exclusão bloqueada com lançamentos |
| `invoicePayments` | `cardId`, `month`, `paidOn` | Só faturas já fechadas podem ser pagas |
| `recurring` | `categoryId`, `amount`, `dayOfMonth`, `startMonth`, `generatedThrough`, forma de pagamento | Mês inicial imutável depois do 1º lançamento gerado |

- **Dinheiro em centavos inteiros** (nunca ponto flutuante nas somas); a
  conversão para reais acontece só na saída.
- **UUIDs** (`crypto.randomUUID`) como ids.

### Regras de negócio

- **Faturas** são identificadas pelo mês de **vencimento**. Compras antes do
  dia de fechamento entram na fatura que fecha no mês; a partir dele, na
  seguinte. Se o vencimento cai depois do fechamento, vence no mesmo mês; senão,
  no seguinte. Dias inexistentes (31 em abril) viram o último dia do mês. A
  regra fica em `lib/creditCard.ts`, compartilhada com o formulário.
- **Mês de pagamento (regime de caixa):** compras no crédito contam no mês
  em que a fatura **vence**, não no mês da compra. Uma compra de 06/10 num
  cartão que fecha dia 5 e vence dia 12 aparece em novembro (dia 12/11) em
  Lançamentos, Dashboard, séries mensais/diárias e Orçamentos. Os demais
  lançamentos usam a própria data. Cada lançamento expõe `date` (compra) e
  `paymentDate` (pagamento); veja `paymentMonthOf`/`paymentDateOf` em
  `mappers.ts`. Na lista, as compras no cartão ficam agrupadas por fatura.
- **Parcelas:** o total é dividido em partes iguais (centavos que sobram na
  1ª); a parcela *k* é datada *k* meses depois da compra e entra na fatura *k*
  meses depois da primeira.
- **Lançamentos fixos** são gerados de forma preguiçosa: antes de cada leitura
  de dados financeiros, `generateDue()` lança tudo o que venceu até o mês
  corrente (e só grava se houver algo a gerar). Editar um fixo vale para os
  próximos meses; excluir mantém o histórico, desvinculado.
- **Status da fatura:** paga → `PAID`; antes do fechamento → `OPEN`; fechada sem
  compras → `PAID`; depois do vencimento → `OVERDUE`; senão `CLOSED`.

### Erros

As funções lançam `AppError` com a semântica de status que a API usava, para as
telas tratarem cada caso igual:

| Situação | `status` |
|---|---|
| Validação de campos (`fieldErrors` por campo) | 400 |
| Registro não encontrado | 404 |
| Conflito (nome repetido, exclusão bloqueada) | 409 |
| Regra de negócio | 422 |

### Backup

`Ajustes → Exportar backup` baixa um `.json` com `{ format, version,
exportedAt, data }`, em que `data` é o documento `Database` inteiro. Restaurar
valida o formato e **substitui** todos os dados. Backups de versões futuras do
schema são recusados; de versões anteriores passam por `migrate()`.

### Testes

`src/data/data.test.ts` porta os cenários dos antigos testes de integração da
API (fluxo do mês, filtros e paginação, cartões e parcelas, lançamentos fixos,
validação, backup) usando armazenamento em memória e um relógio fixo.

## Front-end

Detalhado em [frontend.md](frontend.md).

## Limitações conhecidas

| Limitação | Contorno |
|---|---|
| Dados presos a um navegador/aparelho | Exportar backup e restaurar no outro aparelho |
| Limpar os dados do site apaga tudo | Backup periódico; `storage.persist()` reduz o risco de remoção automática |
| Sem sincronização automática entre aparelhos | Exigiria voltar a ter um servidor (ou um serviço de sync) |
