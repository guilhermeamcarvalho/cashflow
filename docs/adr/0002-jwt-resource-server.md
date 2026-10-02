# 0002 — JWT HS256 emitido e validado pela própria API

**Status:** aceita

## Contexto

A API precisa de autenticação stateless (escala horizontal no Render, front-end
em outro domínio). Opções: filtro JWT escrito à mão com uma biblioteca externa,
provedor de identidade externo (Supabase Auth, Auth0) ou o suporte nativo do
Spring Security.

## Decisão

Usar o **OAuth2 Resource Server** do Spring Security com uma chave simétrica
(HS256): `NimbusJwtEncoder` emite o token no login/cadastro e `NimbusJwtDecoder`
o valida (assinatura, expiração e `iss`). O id do usuário vai no `sub` e é
injetado nos controllers via `@CurrentUserId`.

## Consequências

- Nenhum filtro de segurança customizado: menos código e menos risco.
- Um único segredo (`JWT_SECRET`) — simples de operar, mas deve ter ≥ 32
  caracteres e ser rotacionado com cuidado (rotação invalida sessões ativas).
- Sem refresh token por enquanto: a sessão expira em `JWT_EXPIRATION` (12 h).
  Evoluir para refresh tokens ou para um provedor externo não muda os
  controllers, apenas `SecurityConfig`/`TokenService`.
