# App desktop (Windows)

O mesmo front-end empacotado com **Tauri 2** vira um app instalável, sem
hospedagem e sem navegador. Os dados ficam num arquivo `.json` no disco.

## Pré-requisitos (uma vez)

| Ferramenta | Como instalar |
|---|---|
| Node 22 | já usado no projeto |
| Visual Studio Build Tools com C++ | já instalado nesta máquina |
| **Rust** | `winget install Rustlang.Rustup` e depois abrir um terminal novo |
| WebView2 | já vem no Windows 11 |

## Comandos

```bash
cd frontend
npm run desktop          # abre o app em modo desenvolvimento (hot reload)
npm run desktop:build    # gera o instalador
```

O instalador sai em `C:\dev\cargo-target\release\bundle\nsis\`
(`Cashflow_1.0.0_x64-setup.exe`). Ele instala só para o usuário atual, sem
pedir administrador.

> **Pasta de build fora do OneDrive:** `src-tauri/.cargo/config.toml` manda a
> compilação para `C:\dev\cargo-target`. Dentro do OneDrive o Windows nega a
> criação da pasta, e ela passaria de 2 GB sincronizando. Para usar outra
> pasta, defina `CARGO_TARGET_DIR`, que tem prioridade.

## Onde ficam os dados

- Padrão: `%APPDATA%\com.cashflow.app\cashflow-dados.json`.
- Em **Ajustes → Arquivo de dados → Escolher pasta…** dá para usar outra pasta.
  Numa pasta do **OneDrive**, o arquivo ganha backup automático e pode ser
  aberto em outro computador:
  - se a pasta escolhida já tem um `cashflow-dados.json`, o app **abre** esse
    arquivo;
  - se não tem, **copia** os dados atuais para lá.

  O arquivo anterior nunca é apagado.
- No segundo computador, use **"abrir a pasta de dados (OneDrive)"** na tela de
  boas-vindas.
- A pasta escolhida fica em `%APPDATA%\com.cashflow.app\config.json`.

**Use em um computador de cada vez.** Ao voltar para a janela, o app relê o
arquivo (pega o que o OneDrive sincronizou), mas com dois computadores abertos
ao mesmo tempo, a última gravação vence.

## Como funciona

- `src/main.tsx` detecta o Tauri (`data/desktop.ts → isDesktop`) e troca o
  armazenamento da camada de dados de IndexedDB para `fileAdapter`. Regras,
  telas e backup são os mesmos da versão web.
- Os comandos em Rust (`src-tauri/src/lib.rs`) só leem e gravam texto. A
  gravação é **atômica**: escreve num `.tmp` e renomeia por cima, então nem uma
  queda de energia nem o OneDrive veem um arquivo pela metade.
- Arquivo corrompido (JSON inválido) gera erro na abertura em vez de ser
  tratado como "sem dados". Assim o app nunca sobrescreve os dados por engano.
