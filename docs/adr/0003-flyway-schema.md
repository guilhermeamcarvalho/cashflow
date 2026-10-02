# 0003 — Schema versionado com Flyway

**Status:** aceita

## Contexto

`ddl-auto: update` do Hibernate é cômodo, mas não versiona mudanças, não
permite revisão em PR e pode alterar o banco de produção de forma imprevisível.

## Decisão

O schema é definido por migrações SQL do **Flyway**
(`db/migration/V<n>__*.sql`). O Hibernate roda com `ddl-auto: validate`.

## Consequências

- Toda mudança de banco é revisável, repetível e aplicada automaticamente na
  subida da API (local, CI e produção).
- Divergência entre entidades e schema impede a inicialização — falha cedo.
- Os testes usam as mesmas migrações (H2 em modo PostgreSQL), então o SQL deve
  permanecer portável; se surgir algo exclusivo do PostgreSQL, migrar os testes
  para Testcontainers.
