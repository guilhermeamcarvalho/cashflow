# 0001 — Pacote por funcionalidade com camadas internas

**Status:** aceita (escrita para o antigo back-end; segue valendo no front-end)

## Contexto

Organizar o código só por camada (`pages/`, `hooks/`, `services/`) espalha
cada funcionalidade por vários diretórios e cresce mal: uma mudança em
orçamentos toca várias pastas que também contêm todo o resto.

## Decisão

Organizar por funcionalidade: telas e hooks em `src/features/*` e as regras de
negócio em `src/data/<funcionalidade>.ts`. Código transversal fica em
`components/`, `lib/` e `app/`.

## Consequências

- Funcionalidades novas entram como pastas/arquivos novos, sem editar os
  existentes.
- Dependências entre funcionalidades ficam visíveis nos imports; uma regra de
  `data/` pode usar a de outra funcionalidade (ex.: lançamentos usam
  `resolvePayment` dos cartões), nunca uma tela.
