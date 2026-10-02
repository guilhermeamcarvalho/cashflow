# 0001 — Pacote por funcionalidade com camadas internas

**Status:** aceita

## Contexto

O back-end segue Controller → Service → Repository. Organizar o código só por
camada (`controllers/`, `services/`, `repositories/`) espalha cada
funcionalidade por vários diretórios e cresce mal: uma mudança em orçamentos
toca três pastas que também contêm todo o resto.

## Decisão

Organizar por funcionalidade (`auth`, `user`, `category`, `transaction`,
`budget`, `dashboard`), mantendo as camadas como classes dentro de cada pacote.
Código transversal fica em `common` e `config`. O mesmo princípio vale no
front-end (`src/features/*`).

## Consequências

- Funcionalidades novas entram como pacotes novos, sem editar os existentes.
- Dependências entre funcionalidades ficam visíveis nos imports; a regra é
  depender do **serviço** da outra funcionalidade, nunca do controller.
- `TransactionType` foi movido para `common.domain` para evitar ciclo entre
  `category` e `transaction`.
