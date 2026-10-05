# Cashflow

Aplicação web para **controle de gastos pessoais mensais**: registre receitas e
despesas, organize por categorias, defina orçamentos, acompanhe faturas de
cartão e lançamentos fixos — tudo numa interface **Liquid Glass**, pensada para
o celular, com barra de navegação inferior.

Não há servidor nem conta: o app é um **site estático** e os dados ficam salvos
**no próprio navegador** (IndexedDB). Para levar os dados a outro aparelho ou se
proteger de uma limpeza do navegador, use **Ajustes → Exportar backup**.

```
┌──────────────────────────────────────────┐
│                NAVEGADOR                 │
│                                          │
│  Telas (React 19 + TypeScript + Vite)    │   Tailwind CSS v4 · React Router · Recharts
│        │  TanStack Query (cache)         │
│        ▼                                 │
│  Camada de dados (src/data)              │   regras de negócio: faturas, parcelas,
│        │                                 │   lançamentos fixos, orçamentos, dashboard
│        ▼                                 │
│  IndexedDB  ⇄  backup .json              │
└──────────────────────────────────────────┘
        ▲
        │ arquivos estáticos (HTML/JS/CSS)
   Vercel (ou qualquer host estático)
```

## Funcionalidades

| Área | O que faz |
|---|---|
| **Primeiro acesso** | Pergunta seu nome e cria as categorias padrão — ou restaura um backup |
| **Dashboard** | Saldo do mês, receitas × despesas com variação vs. mês anterior, consumo do orçamento, gastos por dia, ranking por categoria, **gastos por mês com filtros** (6/12 meses ou ano; despesas, receitas ou comparação; por categoria) e últimos lançamentos |
| **Lançamentos** | CRUD de receitas/despesas, forma de pagamento, filtro por tipo, busca por descrição, agrupamento por dia, paginação |
| **Cartões** | Fechamento/vencimento, compras parceladas (uma parcela por fatura), faturas com status (aberta, fechada, vencida, paga) e limite disponível |
| **Lançamentos fixos** | Despesas/receitas mensais geradas automaticamente até o mês corrente |
| **Orçamentos** | Limite mensal por categoria de despesa, status (dentro/perto/estourado), cópia do mês anterior |
| **Categorias** | CRUD com cor e ícone; exclusão bloqueada se houver lançamentos |
| **Ajustes** | Tema claro/escuro/sistema, nome, **exportar/restaurar backup**, apagar todos os dados |

## Início rápido

Pré-requisito: **Node 22**.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### App desktop (Windows, sem hospedagem)

```bash
cd frontend
npm run desktop          # abre o app (requer Rust — ver docs/desktop.md)
npm run desktop:build    # gera o instalador .exe
```

No app desktop os dados ficam num arquivo `.json`, que pode morar numa pasta do
OneDrive para backup automático. Detalhes em [docs/desktop.md](docs/desktop.md).

## Testes e qualidade

```bash
cd frontend && npm run lint && npm test && npm run build
```

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa o mesmo
em cada push/PR.

## Estrutura do repositório

```
cashflow/
├── frontend/                SPA React (ver docs/frontend.md)
│   └── src/
│       ├── app/             providers, rotas, tema, mês de referência
│       ├── components/      ui/ (design system) e layout/ (barra inferior...)
│       ├── data/            "back-end no navegador": armazenamento, regras e backup
│       ├── features/        uma pasta por funcionalidade (hooks + telas)
│       ├── lib/             formatação, datas, regras de fatura
│       ├── styles/          tokens e componentes Liquid Glass
│       └── types/           tipos consumidos pelas telas
│   └── src-tauri/           app desktop (Tauri): leitura/gravação do arquivo de dados
└── docs/                    documentação técnica e ADRs
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Visão geral, camada de dados, modelo, regras de negócio, backup |
| [docs/frontend.md](docs/frontend.md) | Organização do front-end, estado, design system Liquid Glass |
| [docs/deployment.md](docs/deployment.md) | Deploy na Vercel |
| [docs/desktop.md](docs/desktop.md) | App desktop com Tauri: instalação, arquivo de dados, OneDrive |
| [docs/adr/](docs/adr/) | Registros de decisões de arquitetura |
