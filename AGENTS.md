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

Código, comentários, documentação, mensagens de interface e respostas em
Português do Brasil. Termos técnicos consagrados ficam em inglês (`build`,
`stdin`, `flag`, `tool`, `resource`).

## Ordem de leitura

1. Este arquivo.
2. `docs/arquitetura.md` para entender as camadas.
3. A skill compatível com a tarefa em `.agents/skills/`:
   - `termfy-iniciar`: personalizar este starter kit para um binário novo;
   - `termfy-cli`: comandos, opções, saída e códigos de saída;
   - `termfy-tui`: telas, tema e interação por teclado;
   - `termfy-mcp`: tools, resources e prompts;
   - `termfy-config`: settings, credenciais e variáveis.
4. As `references/` indicadas pela skill. Citar uma referência não substitui
   abri-la.

## Regras que valem para toda mudança

- Toda opção, argumento, subcomando, tool e chave de configuração nasce
  documentado: `descricao` no registro, linha na tabela de `docs/` e, quando
  for conceito novo, parágrafo em prosa. O `--skill` imprime `docs/` inteiro
  mais a referência gerada do registro, então `docs/` precisa continuar
  correto para quem lê o binário sem o repositório.
- Códigos de saída vêm de `src/app/saida.ts`. Zero é sucesso. Não invente
  números em comandos; acrescente a família na tabela.
- Segredos nunca passam por argumento, log, erro, `--json` sem `--reveal`,
  tool MCP ou frame da TUI. Leia com `obterCredencial()`.
- Stdout recebe dados; stderr recebe progresso e avisos. Em `mcp`, stdout é
  do JSON-RPC.
- Um arquivo por comando, por tela e por grupo de tools. Registro central em
  `src/cli/comandos.ts`, `src/tui/telas/index.ts` e `src/mcp/servidor.ts`.
- Cores da TUI só em `src/tui/tema.ts`.
- Node e npm não entram no binário: o projeto usa Bun para rodar, testar e
  compilar. O `npx skills` é a única exceção, por ser a ferramenta oficial de
  distribuição de skills.
- Documente código novo ou alterado com cabeçalho explicando o propósito do
  arquivo e JSDoc em funções exportadas.
- Não edite `.agents/skills/termfy-*`. Mudança de skill acontece no
  framework; aqui ela chega por `bun run skills:update`.

## Validação antes de concluir

```bash
bun run validar
```

Encadeia `typecheck`, `bun test`, `skills:check`, `opencli:check`,
`ebook:verify` e `build`. Quando `docs/` mudar, avance `ebook/VERSION`, rode
`bun run ebook` e inclua `ebook/` no commit.
Quando o registro de comandos mudar, rode `bun run opencli` antes e revise o
diff de `docs/opencli.json`. Confira `git status --short` ao final e preserve
mudanças que já existiam.

## Publicação

Toda alteração publicada sai com versão em `package.json`, entrada em
`CHANGELOG.md`, tag `vX.Y.Z` e GitHub Release com binários. O fluxo está em
`docs/release.md`. Tags não são movidas.
