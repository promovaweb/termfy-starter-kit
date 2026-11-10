# Changelog

Formato baseado em Keep a Changelog. Versões seguem SemVer.

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
