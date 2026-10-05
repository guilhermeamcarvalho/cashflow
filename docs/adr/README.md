# Architecture Decision Records

Registros curtos das decisões que moldam o projeto. Formato: contexto →
decisão → consequências. Para uma nova decisão, copie um ADR existente e
incremente o número.

| # | Decisão | Status |
|---|---|---|
| [0001](0001-package-by-feature.md) | Pacote por funcionalidade com camadas internas | Aceita |
| 0002 | JWT HS256 emitido e validado pela própria API | Substituída pela 0005 (removida junto com o back-end) |
| 0003 | Schema versionado com Flyway; Hibernate apenas valida | Substituída pela 0005 (removida junto com o back-end) |
| [0004](0004-tanstack-query.md) | TanStack Query como cache dos dados nas telas | Aceita |
| [0005](0005-dados-locais.md) | Dados no navegador (IndexedDB), sem back-end | Aceita |
