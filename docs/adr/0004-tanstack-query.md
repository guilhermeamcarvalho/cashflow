# 0004 — TanStack Query para estado de servidor

**Status:** aceita

## Contexto

Quase todo o estado do front-end é cópia de dados da API (lançamentos,
orçamentos, resumo). Gerenciá-lo com `useEffect` + `useState` ou com uma store
global (Redux/Zustand) exigiria implementar cache, deduplicação, refetch e
invalidação manualmente.

## Decisão

Usar **TanStack Query** para todo dado vindo da API, com chaves centralizadas
em `lib/queryKeys.ts`. Estado puramente de interface (sessão, tema, mês
selecionado) fica em Context API.

## Consequências

- Cache, refetch ao focar a janela, `keepPreviousData` ao trocar de mês e
  retentativas em falhas de rede sem código extra.
- Mutations invalidam as visões afetadas por prefixo de chave — adicionar uma
  tela nova que lê lançamentos passa a ser atualizada automaticamente.
- Sem store global adicional; se surgir estado de cliente complexo, avaliar
  Zustand pontualmente.
