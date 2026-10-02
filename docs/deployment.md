# Deploy

| Camada | Plataforma | Artefato |
|---|---|---|
| Banco | **Supabase** (PostgreSQL gerenciado) | schema criado pelo Flyway na 1ª subida da API |
| API | **Render** (Web Service Docker) | `backend/Dockerfile` |
| Front-end | **Vercel** (site estático) | `frontend/` (`npm run build` → `dist/`) |

Ordem recomendada: **Supabase → Render → Vercel → ajustar CORS no Render**.

---

## 1. Supabase (PostgreSQL)

1. Crie um projeto em <https://supabase.com> e guarde a senha do banco.
2. Em **Connect**, copie a string do **Session pooler** (porta `5432`).
   > Use o *pooler*: a conexão direta do Supabase é só IPv6, e o Render não
   > tem saída IPv6.
3. Converta para o formato JDBC:

   ```
   Supabase:  postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres
   JDBC:      jdbc:postgresql://aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=require
   usuário:   postgres.<ref>
   ```

Não é preciso criar tabelas: o **Flyway** aplica `db/migration/V*.sql` ao
iniciar a API.

## 2. Render (API)

**Via Blueprint (recomendado):** em *New → Blueprint*, aponte para o
repositório; o arquivo [`render.yaml`](../render.yaml) cria o serviço
`cashflow-api` (Docker, `rootDir: backend`, health check em
`/actuator/health`) e gera um `JWT_SECRET` aleatório.

**Manual:** *New → Web Service → Docker*, *Root Directory* = `backend`.

Variáveis de ambiente:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL JDBC do passo 1 |
| `DATABASE_USERNAME` | `postgres.<ref>` |
| `DATABASE_PASSWORD` | senha do banco |
| `JWT_SECRET` | ≥ 32 caracteres aleatórios (`openssl rand -base64 48`) |
| `CORS_ALLOWED_ORIGINS` | domínio(s) da Vercel, ex.: `https://cashflow.vercel.app,https://cashflow-*.vercel.app` |
| `API_DOCS_ENABLED` | `false` (recomendado em produção) |

A porta é lida de `PORT`, definida automaticamente pelo Render.

> **Plano free do Render:** o serviço hiberna após inatividade; a primeira
> requisição seguinte pode levar ~1 min. O front-end mostra o carregamento e o
> TanStack Query refaz a chamada em caso de falha de rede.

## 3. Vercel (front-end)

1. *Add New → Project*, selecione o repositório.
2. **Root Directory:** `frontend` (o preset Vite é detectado; o
   [`vercel.json`](../frontend/vercel.json) já define build, saída, rewrite da
   SPA e cache dos assets).
3. Variável de ambiente:

   | Variável | Valor |
   |---|---|
   | `VITE_API_URL` | URL do Render, ex.: `https://cashflow-api.onrender.com` |

4. Faça o deploy e copie o domínio gerado.

## 4. Fechando o ciclo

Volte ao Render e garanta que `CORS_ALLOWED_ORIGINS` contém o domínio da Vercel
(inclua o padrão de *preview deployments* se quiser testá-los). Salve — o
serviço reinicia.

Checklist:

- [ ] `https://<api>/actuator/health` responde `{"status":"UP"}`
- [ ] Cadastro funciona pelo front-end
- [ ] Sem erros de CORS no console do navegador

---

## Ambiente local com Docker

```bash
docker compose up --build        # db + api + web
docker compose down              # para os containers (mantém os dados)
docker compose down -v           # apaga também o volume do banco
```

No Compose, o Nginx do container `web` serve a SPA e encaminha `/api` para o
container `api` — mesma origem, sem CORS. O `web` só sobe depois que a API
passa no health check.

## Migrações de banco

- Arquivos em `backend/src/main/resources/db/migration`, nomeados
  `V<n>__descricao.sql`.
- **Nunca altere uma migração já aplicada**; crie uma nova (`V2__...`).
- O Hibernate valida o mapeamento contra o schema na subida
  (`ddl-auto: validate`): divergências impedem a API de iniciar, em vez de
  causar erros em produção.
