# 0005 — Dados no navegador, sem back-end

**Status:** aceita (substitui a API Spring Boot, o JWT e o PostgreSQL)

## Contexto

O app é de uso pessoal. Manter API (Render) e banco (Supabase) significava
deploy em três plataformas, hibernação do plano gratuito (primeira requisição
lenta) e cadastro/login só para separar os dados de uma pessoa.

## Decisão

Hospedar apenas o front-end como site estático e guardar os dados no
**IndexedDB** do navegador. As regras de negócio da API foram portadas para
TypeScript em `src/data`, expondo funções que devolvem os mesmos tipos que a
API devolvia — telas e hooks do TanStack Query não mudaram.

Detalhes que sustentam a decisão:

- O estado inteiro é um documento em memória, regravado a cada alteração
  (escritas atômicas sobre uma cópia, fila única, aviso às outras abas).
- Dinheiro em centavos inteiros.
- Login substituído por um perfil local (só o nome); backup em JSON para
  levar os dados a outro aparelho.

## Consequências

- Deploy em uma só plataforma, sem variáveis de ambiente; sem a espera do
  servidor hibernado, as telas respondem na hora.
- Os dados ficam presos ao navegador e ao domínio: o usuário precisa exportar
  backups. Não há sincronização entre aparelhos.
- Dados antigos do Supabase não são migrados automaticamente; seria preciso
  convertê-los para o formato de backup (`schema.ts`).
- Voltar a ter servidor é viável: basta trocar a implementação de `src/data`
  por chamadas HTTP, mantendo as mesmas assinaturas.
