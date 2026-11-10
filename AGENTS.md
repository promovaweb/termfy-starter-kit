# Instruções para agentes

Este repositório é o starter kit do Termfy: um binário em Bun com três modos
no mesmo executável. Sem argumentos abre a TUI; com argumentos roda como CLI
com saída em texto ou `--json`; `<bin> mcp` vira servidor Model Context
Protocol via stdio. Ele é um template do GitHub; projetos derivados herdam
esta estrutura.

As skills que ensinam a evoluir este projeto vêm do framework
[`promovaweb/termfy`](https://github.com/promovaweb/termfy) e estão
instaladas em `.agents/skills/termfy-*` (com links em `.claude/skills/`),
registradas em `skills-lock.json`. Atualize com `bun run skills:update`.

## Idioma

- Todo o código é em inglês: nomes de arquivos, identificadores, comentários,
  mensagens do binário, commands, options, arguments, keys de configuração e
  campos do `--json`.
- Documentação para pessoas (`README.md`, `docs/`, `CHANGELOG.md`, este
  arquivo) é em português do Brasil, com os termos técnicos em inglês
  preservados (`build`, `stdin`, `flag`, `tool`, `resource`, `command`).
- Respostas ao usuário em português do Brasil.

## Especificação

`CLISPEC.md`, na raiz, descreve o que o binário faz: propósito, públicos,
commands com arguments e options, formatos de saída, screens da TUI, tools e
resources MCP, keys de configuração, credenciais e exit codes. A skill
`termfy-spec` monta esse arquivo em entrevista com a pessoa. Antes de
implementar qualquer command, screen ou tool, leia o `CLISPEC.md`; se ele
não existir ou não cobrir o pedido, rode a skill `termfy-spec` primeiro.

## Ordem de leitura

1. Este arquivo.
2. `CLISPEC.md`.
3. `docs/architecture.md` para entender as camadas.
4. A skill compatível com a tarefa em `.agents/skills/`:
   - `termfy-spec`: montar ou revisar o `CLISPEC.md`;
   - `termfy-init`: personalizar este starter kit para um binário novo;
   - `termfy-cli`: commands, options, saída e exit codes;
   - `termfy-tui`: screens, tema e interação por teclado;
   - `termfy-mcp`: tools, resources e prompts;
   - `termfy-config`: settings, credenciais e variáveis.
5. As `references/` indicadas pela skill. Citar uma referência não substitui
   abri-la.

## Regras que valem para toda mudança

- Toda option, argument, subcommand, tool e key de configuração nasce
  documentada: `description` no registry, linha na tabela de `docs/` e, quando
  for conceito novo, parágrafo em prosa. O `--skill` imprime `docs/` inteiro
  mais a referência gerada do registry, então `docs/` precisa continuar
  correto para quem lê o binário sem o repositório.
- Exit codes vêm de `src/app/exit-codes.ts`. Zero é sucesso. Não invente
  números em commands; acrescente a família na tabela.
- Segredos nunca passam por argument, log, erro, `--json` sem `--reveal`,
  tool MCP ou frame da TUI. Leia com `getCredential()`.
- Stdout recebe dados; stderr recebe progresso e avisos. Em `mcp`, stdout é
  do JSON-RPC.
- Um arquivo por command, por screen e por grupo de tools. Registro central
  em `src/cli/commands.ts`, `src/tui/screens/index.ts` e `src/mcp/server.ts`.
- Cores da TUI só em `src/tui/theme.ts`.
- Node e npm não entram no binário: o projeto usa Bun para rodar, testar e
  compilar. O `npx skills` é a única exceção, por ser a ferramenta oficial de
  distribuição de skills.
- Documente código novo ou alterado com cabeçalho explicando o propósito do
  arquivo e JSDoc em funções exportadas, em inglês.
- Não edite `.agents/skills/termfy-*`. Mudança de skill acontece no
  framework; aqui ela chega por `bun run skills:update`.

## Validação antes de concluir

```bash
bun run validate
```

Encadeia `typecheck`, `bun test`, `skills:check`, `opencli:check`,
`ebook:verify` e `build`. Quando o registry de commands mudar, rode
`bun run opencli` antes e revise o diff de `docs/opencli.json`. Quando
`docs/` mudar, avance `ebook/VERSION`, rode `bun run ebook` e inclua `ebook/`
no commit. Confira `git status --short` ao final e preserve mudanças que já
existiam.

## Publicação

Toda alteração publicada sai com versão em `package.json`, entrada em
`CHANGELOG.md`, tag `vX.Y.Z` e GitHub Release com binários. O fluxo está em
`docs/release.md`. Tags não são movidas.
