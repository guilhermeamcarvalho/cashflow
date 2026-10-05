# 0004 — TanStack Query como cache dos dados nas telas

**Status:** aceita (continua valendo com os dados locais da ADR 0005)

## Contexto

Quase todo o estado das telas é cópia de dados calculados pela camada de dados
(lançamentos, orçamentos, resumo). Gerenciá-lo com `useEffect` + `useState` ou
com uma store global (Redux/Zustand) exigiria implementar cache, deduplicação,
recarga e invalidação manualmente.

## Decisão

Usar **TanStack Query** para todo dado vindo de `src/data`, com chaves
centralizadas em `lib/queryKeys.ts`. Estado puramente de interface (tema, mês
selecionado) fica em Context API.

## Consequências

- Cache, recarga ao focar a janela e `keepPreviousData` ao trocar de mês sem
  código extra. A camada de dados é assíncrona como era a API, então trocar
  uma pela outra não mudou os hooks.
- Mutations invalidam as visões afetadas por prefixo de chave — adicionar uma
  tela nova que lê lançamentos passa a ser atualizada automaticamente.
- Sem store global adicional; se surgir estado de cliente complexo, avaliar
  Zustand pontualmente.
