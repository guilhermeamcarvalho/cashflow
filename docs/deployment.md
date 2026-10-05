# Deploy

O Cashflow é um site estático: só o front-end é hospedado. Não há banco,
API nem variáveis de ambiente.

## Vercel

1. *Add New → Project*, selecione o repositório.
2. **Root Directory:** `frontend`. O preset Vite é detectado; o
   [`vercel.json`](../frontend/vercel.json) já define build, saída, rewrite da
   SPA e cache dos assets.
3. Faça o deploy.

Qualquer outro host estático serve: publique `frontend/dist` (gerado por
`npm run build`) e redirecione rotas desconhecidas para `index.html`.

## Onde ficam os dados

Os dados ficam no **IndexedDB do navegador**, separados por **domínio**. Trocar
o domínio do app (ex.: de `cashflow.vercel.app` para um domínio próprio) faz o
navegador abrir um banco vazio. Antes de mudar, exporte um backup no domínio
antigo e restaure no novo.

> O IndexedDB e o `crypto.randomUUID` exigem contexto seguro: sirva o app por
> **HTTPS** (ou `localhost` em desenvolvimento).
