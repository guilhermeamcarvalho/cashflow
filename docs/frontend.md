# Front-end

React 19 + TypeScript + Vite + Tailwind CSS v4.

## Organização

```
src/
├── main.tsx                 ponto de entrada
├── app/
│   ├── providers.tsx        composição dos providers globais
│   ├── router.tsx           rotas (cada página é carregada sob demanda)
│   ├── theme.tsx            tema claro / escuro / sistema
│   └── month.tsx            mês de referência compartilhado entre telas
├── components/
│   ├── ui/                  design system: GlassCard, Button, Field, Select, Sheet,
│   │                        SegmentedControl, Toast, CategoryIcon, Feedback
│   └── layout/              AppLayout, BottomNav, PageHeader, AmbientBackground
├── features/                uma pasta por funcionalidade
│   ├── auth/                api.ts, AuthContext, RequireAuth, Login/Register
│   ├── dashboard/           api.ts, DashboardPage, BalanceCard, gráficos
│   ├── transactions/        api.ts, página, formulário, contexto do formulário global
│   ├── budgets/             api.ts, página, formulário, barra de progresso/status
│   ├── categories/          api.ts, página, formulário
│   └── settings/            página de ajustes
├── lib/                     http.ts, session.ts, format.ts, month.ts, queryKeys.ts
├── styles/index.css         tokens e componentes Liquid Glass
└── types/api.ts             contrato da API (espelha os DTOs do back-end)
```

**Regra de dependência:** `features/*` podem usar `components/`, `lib/`,
`types/` e `app/`; `components/ui` não conhece features. Uma feature só importa
de outra o que é público e estável (ex.: `TransactionRow`, `useCategories`).

## Dados e estado

| Tipo de estado | Ferramenta | Exemplos |
|---|---|---|
| Dados do servidor | **TanStack Query** | lançamentos, orçamentos, dashboard |
| Estado global de UI | **Context API** | sessão, tema, mês de referência, formulário de lançamento, toasts |
| Estado local | `useState` | campos de formulário, filtros |

- Cada feature expõe em `api.ts` as **funções HTTP** e os **hooks** (`useX`,
  `useSaveX`, `useDeleteX`).
- As chaves de cache ficam centralizadas em `lib/queryKeys.ts`. Mutations
  invalidam todas as visões afetadas (ex.: criar um lançamento invalida
  lançamentos, orçamentos e dashboard).
- `lib/http.ts` é o único ponto de acesso à rede: adiciona o token, serializa
  JSON, converte erros Problem Details em `ApiError` (com `fieldErrors`) e
  encerra a sessão quando recebe `401`.
- A sessão (token + usuário) fica em `localStorage`, isolada em
  `lib/session.ts`; o logout automático acontece na expiração do token.

## Navegação

- Rotas públicas (`/login`, `/register`) e protegidas (demais) via
  `GuestOnly` / `RequireAuth`.
- **Barra inferior** (`BottomNav`): Início · Lançamentos · **+** · Orçamentos ·
  Ajustes. O botão central abre o formulário de lançamento global
  (`TransactionSheetProvider`), disponível em qualquer tela.
- O **mês de referência** é compartilhado: trocar o mês no dashboard mantém o
  mesmo mês em lançamentos e orçamentos.

## Design system — Liquid Glass

Definido em `src/styles/index.css`, em quatro camadas:

1. **Tokens** (variáveis CSS) para os temas claro e escuro: tinta (`--ink-*`),
   acento, receitas/despesas, status, superfícies de vidro, sombras.
2. **Mapeamento para o Tailwind** via `@theme inline` → classes como
   `text-ink`, `text-ink-3`, `bg-accent`, `border-hairline`, `text-critical`.
3. **Componentes de vidro**:
   - `.glass` / `.glass-strong` — fundo translúcido com
     `backdrop-filter: blur() saturate()`, brilho especular no topo
     (`inset` shadow), brilho interno nas bordas e uma **borda de luz em
     gradiente** desenhada por um pseudo-elemento com máscara.
   - `.lens` — "lente" de destaque que desliza com curva de mola
     (`--ease-spring`) na barra inferior e nos controles segmentados.
   - `.pressable` — o vidro "afunda" ao toque.
   - `.field` — campo de formulário em vidro rebaixado.
   - `Select` (`components/ui/Select.tsx`) — dropdown em vidro que substitui o
     `<select>` nativo (cuja lista não aceita estilo). Segue o padrão ARIA
     *select-only combobox*: setas, Home/End, Enter/Espaço, Esc e busca por
     digitação. A lista é renderizada num portal com posição fixa — não é
     cortada pelo painel inferior e abre para cima quando falta espaço. Aceita
     ícone por opção (usado com `CategoryIcon`) e as variantes `field`
     (formulário) e `pill` (filtro).
   - `PeriodPicker` (`components/ui/PeriodPicker.tsx`) — calendário de meses
     em vidro com dois modos: **Período** (1º clique = início, 2º = fim, com
     prévia do intervalo sob o ponteiro e meses além do limite de 24
     desabilitados) e **Mês específico**. Atalhos (últimos 6/12 meses, ano
     atual e anterior), navegação por ano, mês atual marcado com um ponto e
     teclado (setas, PageUp/PageDown, Esc). O filtro só muda ao "Aplicar".
   - `popover.ts` — hooks compartilhados por `Select` e `PeriodPicker`:
     posicionamento ancorado (abre para cima quando falta espaço, nunca sai da
     tela) e fechamento ao clicar fora.
4. **Fundo ambiente** — orbs coloridos e desfocados que se movem lentamente;
   são eles que o vidro refrata. O `body` é transparente de propósito para que
   os orbs (z-index negativo) fiquem visíveis.

Tipografia:

- Fonte **Manrope** (variável), empacotada via `@fontsource-variable/manrope` —
  servida junto com o app, sem dependência do Google Fonts; o navegador baixa
  só o subconjunto de caracteres necessário.
- Escala base de **17px** no celular e **18px** a partir de 768px (definida no
  `html`). Como o Tailwind trabalha em `rem`, espaçamentos e raios acompanham a
  escala proporcionalmente.

Acessibilidade e robustez:

- `prefers-reduced-motion` desativa animações.
- Sem suporte a `backdrop-filter`, o vidro fica mais opaco (legível).
- Tema aplicado antes da renderização (script em `index.html`) — sem "flash".
- Áreas seguras de iPhone (`env(safe-area-inset-*)`) respeitadas na barra
  inferior, nos painéis e nos toasts.

### Gráficos e cores

- **Gastos por mês** (`MonthlyTrendCard` + `TrendChart`): filtros acima do
  gráfico — período (calendário `PeriodPicker`), tipo (despesas, receitas ou
  comparar) e categoria. No modo **mês específico** o gráfico passa a mostrar
  os dias daquele mês (`/dashboard/daily-totals`), já que um gráfico de uma
  barra só não comunicaria nada. Com uma métrica, é série única com o **mês
  selecionado em destaque** e os demais esmaecidos; em "Comparar", duas séries
  (azul = receitas, laranja = despesas — par validado para daltonismo, em vez
  de verde/vermelho) com legenda. Clicar numa barra seleciona aquele mês no
  app inteiro. Totais, média e maior mês aparecem em texto abaixo.
- **Por categoria**: ranking com **nome + ícone** em cada linha; a cor da
  categoria é reforço visual, nunca o único identificador (as cores padrão não
  são distinguíveis o suficiente para daltonismo sozinhas).
- **Status de orçamento** sempre com **ícone + rótulo** ("Dentro do limite",
  "Perto do limite", "Limite estourado"), não apenas cor.
- O Recharts escreve cores em atributos SVG, onde `var()` não funciona; por isso
  `lib/useCssVar.ts` lê o token computado e reage à troca de tema.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173, proxy de `/api`) |
| `npm run build` | Checagem de tipos + build de produção em `dist/` |
| `npm run lint` | Oxlint |
| `npm test` | Vitest |
| `npm run preview` | Serve o build localmente |
