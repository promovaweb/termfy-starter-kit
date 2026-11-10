# Termfy Starter Kit

Esqueleto de binário em [Bun](https://bun.sh) para construir ferramentas de
terminal com três modos no mesmo executável. É o template do GitHub do
framework [Termfy](https://github.com/promovaweb/termfy), e já vem com as
skills do framework instaladas em `.agents/skills/`.

| Modo | Entrada | Para quem |
| --- | --- | --- |
| TUI | `termfy` sem argumentos, em terminal interativo | pessoas |
| CLI | `termfy <comando> [opções]`, saída em texto ou `--json` | pessoas, scripts e agentes |
| MCP | `termfy mcp`, servidor Model Context Protocol via stdio | agentes de IA |

Os três modos compartilham identidade, configuração (`~/.termfy/settings.json`),
cofre de credenciais cifrado (`~/.termfy/credentials.json`) e a tabela de
códigos de saída. A TUI usa o [OpenTUI](https://opentui.com); o CLI publica
sua interface no formato [OpenCLI](https://opencli.org); o MCP usa o
[SDK oficial](https://github.com/modelcontextprotocol/typescript-sdk).

```text
 ▌ Termfy v0.1.0  │  Framework de skills e esqueleto de CLI, TUI e servidor MCP stdio  linux-x64 • Bun 1.3.14
 ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Overview      About
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
 ╭─ Ambiente ─────────────────────────────────────────────────╮╭─ Estado ───────────────────────────────────╮
 │ Binário     termfy v0.1.0                                  ││ settings.json     • padrões                │
 │ Runtime     Bun 1.3.14                                     ││ credentials.json  • vazio                  │
 │ Plataforma  linux-x64                                      ││ chave mestra      não criada               │
 │ Terminal    110×30  xterm-256color                         ││ MCP               termfy mcp               │
 │ Dados       /home/voce/.termfy                             ││                                            │
 ╰────────────────────────────────────────────────────────────╯╰────────────────────────────────────────────╯
 ╭─ Configuração em vigor ────────────────────────────────────╮╭─ Próximos passos ──────────────────────────╮
 │ saida.cores       true                                     ││ No terminal                                │
 │ saida.formato     "texto"                                  ││ → termfy --help                            │
 │ tui.abaInicial    "overview"                               ││ → termfy credentials set <nome>            │
 │ tui.tema          "noite"                                  ││ → termfy --skill                           │
 ╰────────────────────────────────────────────────────────────╯╰────────────────────────────────────────────╯
  ←/→  aba   1-9  ir   ?  ajuda   q  sair
```

## Sobre o template

Este repositório é um template do GitHub. Clique em **Use this template**,
clone e personalize:

```bash
bun install
bun run iniciar -- --nome meucli --titulo "Meu CLI" --descricao "O que ele faz." --autor "Sua empresa" --repositorio https://github.com/org/meucli
bun run dev -- --help
```

O guia completo está em [docs/personalizar-template.md](docs/personalizar-template.md).
Agentes de IA leem [AGENTS.md](AGENTS.md) e as skills instaladas em
`.agents/skills/termfy-*`. Atualize-as com `bun run skills:update`; o guia do
método e o ebook ficam no [framework](https://github.com/promovaweb/termfy).

## Requisitos

Bun 1.3.14 ou superior. Node.js não é usado.

## Rodar em desenvolvimento

```bash
bun install
bun run dev                 # TUI
bun run dev -- --help       # ajuda do CLI
bun run dev -- about --json
bun run dev -- mcp --list
```

## Comandos

| Comando | Função |
| --- | --- |
| `termfy` | abre a TUI (abas Overview e About) |
| `termfy tui [--aba overview\|about]` | abre a TUI em uma aba |
| `termfy about` | versão, executável, runtime, plataforma e créditos |
| `termfy config list\|get\|set\|unset\|path\|schema` | preferências em `settings.json` |
| `termfy credentials set\|get\|list\|remove\|status\|clear` | segredos cifrados em `credentials.json` |
| `termfy mcp [--list]` | servidor MCP via stdio |
| `termfy skill [topico]` | documentação embutida |

Opções globais: `--help`, `--version`, `--json`, `--skill [topico]`,
`--opencli`, `--no-color`. Referência completa em [docs/cli.md](docs/cli.md).

## Documentação embutida

```bash
termfy --skill          # tudo, em Markdown
termfy --skill mcp      # uma seção: cli, tui, mcp, config, codigos
termfy --opencli        # descrição OpenCLI em JSON
```

A pasta [docs/](docs/README.md) entra no binário em tempo de build. Um agente
lê a documentação sem acesso ao repositório.

## Códigos de saída

| Código | Nome |
| --- | --- |
| 0 | `SUCESSO` |
| 1 | `ERRO_GENERICO` |
| 2 | `USO_INVALIDO` |
| 3 | `CONFIGURACAO` |
| 4 | `CREDENCIAIS` |
| 5 | `REDE_OU_API` |
| 6 | `NAO_ENCONTRADO` |
| 7 | `PERMISSAO` |
| 8 | `TERMINAL_INDISPONIVEL` |
| 9 | `MCP` |
| 130 | `INTERROMPIDO` |

Detalhes em [docs/codigos-de-saida.md](docs/codigos-de-saida.md).

## Configuração e credenciais

```bash
termfy config set tui.tema dia
termfy credentials set openai.api_key        # digita sem eco
printf '%s' "$TOKEN" | termfy credentials set github.token --stdin
termfy credentials status
```

Os arquivos ficam em `~/.termfy/` com permissão 0600. As credenciais são
cifradas com AES-256-GCM; a chave mestra vem de `TERMFY_MASTER_KEY` ou de
`~/.termfy/master.key`. Veja [docs/configuracao.md](docs/configuracao.md).

## MCP

```json
{ "mcpServers": { "termfy": { "command": "termfy", "args": ["mcp"] } } }
```

Tools: `about`, `exit_codes`, `skill`, `config_list`, `config_get`,
`credentials_status`. Resources: `termfy://about`, `termfy://exit-codes`,
`termfy://skill`, `termfy://skill/{topico}`. Prompt: `operar`.
Detalhes em [docs/mcp.md](docs/mcp.md).

## Estrutura

```text
src/        código do binário (app, cli, config, mcp, tui, skill)
docs/       documentação embutida e opencli.json
template/   stubs de comando, tela e tool
.agents/    skills do framework instaladas via npx skills (skills-lock.json)
scripts/    build, bootstrap e validações
tests/      bun test
```

Arquitetura em [docs/arquitetura.md](docs/arquitetura.md).

## Validar, compilar e publicar

```bash
bun run validar       # typecheck, testes, skills:check, opencli:check, build
bun run skills:update # atualiza as skills do framework
bun run build         # dist/termfy
bun run build:todos   # linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64
```

Releases seguem [docs/release.md](docs/release.md): versão em
`package.json`, entrada no `CHANGELOG.md`, tag `vX.Y.Z` e GitHub Release com
binários gerados pelo workflow.

## Licença

Repositório privado da Promovaweb. Uso interno e dos alunos autorizados.
