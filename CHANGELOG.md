# Changelog

Formato baseado em Keep a Changelog. Versões seguem SemVer.

## [0.3.1] - 2026-11-10

### Alterado

- Skills do framework 0.4.0: `termfy-iniciar` substituída por `termfy-init`
  em `.agents/skills/`, `skills-lock.json`, `scripts/check-skills.ts`,
  `AGENTS.md`, `README.md` e `docs/customize-template.md`.

## [0.3.0] - 2026-11-10

### Alterado

- Todo o código passa a ser em inglês: arquivos (`src/app/manifest.ts`,
  `src/app/exit-codes.ts`, `src/app/errors.ts`, `src/cli/registry.ts`,
  `src/cli/help.ts`, `src/cli/format.ts`, `src/cli/input.ts`,
  `src/cli/commands/`, `src/config/paths.ts`, `src/config/crypto.ts`,
  `src/config/credentials.ts`, `src/mcp/server.ts`, `src/tui/theme.ts`,
  `src/tui/screen.ts`, `src/tui/components.ts`, `src/tui/screens/`),
  identificadores, comentários e mensagens do binário.
- Interface pública em inglês: option `--tab` (antes `--aba`), nomes de
  arguments (`key`, `value`, `name`, `topic`), topic `exit-codes` (antes
  `codigos`), keys `output.format`, `output.colors`, `tui.initialTab`,
  `tui.theme` (valores `night` e `day`) e `telemetry.enabled`; envelope
  `--json` com `command`, `data` e `error { code, name, message, details }`;
  nomes de exit codes `SUCCESS`, `GENERIC_ERROR`, `USAGE`, `CONFIG`,
  `CREDENTIALS`, `NETWORK_OR_API`, `NOT_FOUND`, `PERMISSION`, `NO_TTY`, `MCP`
  e `INTERRUPTED`; campos de `data` e do catalog MCP em inglês; tool `skill`
  com `topic`, tool `config_get` com `key`, resource `skill/{topic}`, prompt
  `operate` com `task`. O alias `sobre` de `about` foi removido.
- Scripts do `package.json` em inglês: `init`, `validate`, `build:all`,
  `skills:install`, `skills:update`, `skills:check`, `opencli:check`;
  stubs em `template/command/`, `template/screen/` e `template/tool/`; docs
  renomeadas para `configuration.md`, `exit-codes.md`, `architecture.md` e
  `customize-template.md`; ebook `<Title>-User-Guide-v<version>`.
- Workflows, docs, README e AGENTS.md atualizados para os novos nomes.

### Adicionado

- `CLISPEC.md`: especificação do binário montada com a skill `termfy-spec`,
  lida pelas demais skills antes de implementar.

## [0.2.0] - 2026-11-10

### Adicionado

- Guia do usuário em PDF e EPUB em `ebook/`, gerado por `bun run ebook` a
  partir da mesma `docs/` embutida no binário, com os placeholders
  `{{bin}}`, `{{titulo}}`, `{{versao}}` e `{{BIN}}` resolvidos pelo
  manifesto. Saída `<Titulo>-Guia-do-Usuario-v<versão>.{pdf,epub}`, aliases
  `ebook-<bin>.*`, `ebook/VERSION` e `ebook/build.json`, com o design system
  de PDF da Promovaweb (`pdf-design-system: 1.0.0`).
- `bun run ebook:verify` entra em `bun run validar`; CI e release instalam
  as ferramentas de conferência e a release anexa o PDF e o EPUB.
- `docs/reading-order.txt` define a ordem dos capítulos.

### Alterado

- `docs/release.md`, `docs/personalizar-template.md`, `docs/arquitetura.md`,
  `README.md`, `AGENTS.md` e o aviso final de `bun run iniciar` orientam a
  regenerar o ebook depois do bootstrap e sempre que `docs/` mudar.

## [0.1.0] - 2026-11-10

### Adicionado

- Esqueleto do binário em Bun com três modos: TUI sem argumentos, CLI com
  argumentos e servidor MCP via stdio (`termfy mcp`), separado do framework
  `promovaweb/termfy` 0.1.0.
- CLI com registro declarativo de comandos, parser próprio, `--help` gerado,
  `--version`, `--json` com envelope estável, `--skill [topico]` com a
  documentação embutida, `--opencli` (OpenCLI 0.1) e `--no-color`.
- Comandos `tui`, `about`, `config`, `credentials`, `mcp [--list]` e `skill`.
- Códigos de saída fixos em `src/app/saida.ts`.
- Pasta `~/.<bin>/` com `settings.json`, `credentials.json` (AES-256-GCM) e
  `master.key` (0600), com `<BIN>_HOME` e `<BIN>_MASTER_KEY`.
- TUI sobre `@opentui/core` 0.8.3 com abas Overview e About e tema modern
  unix em duas paletas.
- Servidor MCP com `@modelcontextprotocol/sdk` 1.32: seis tools, quatro
  resources e um prompt.
- Skills `termfy-*` instaladas em `.agents/skills/` via `npx skills add`,
  com `skills-lock.json`, e scripts `skills:instalar`, `skills:update` e
  `skills:check`.
- Documentação em `docs/`, stubs em `template/`, 37 testes com `bun test` e
  workflows de CI e release.
