---
name: termfy-init
description: Cria um binário novo a partir do starter kit do Termfy, renomeia o executável, atualiza as skills instaladas, confere os três modos (TUI, CLI, MCP) e prepara o primeiro commit.
---

# Iniciar um binário a partir do starter kit

Use esta skill quando a pessoa pedir um CLI, uma TUI ou um servidor MCP novo
em Bun e o repositório ainda estiver com a identidade `termfy`, recém-criado
a partir do template `promovaweb/termfy-starter-kit`.

## Leia antes

- `AGENTS.md` do repositório.
- `docs/customize-template.md` e `docs/architecture.md`.
- `references/checklist.md` desta skill.

## Entrada

Pergunte, se não vier no pedido: nome do executável (minúsculas, números e
hífen), título legível, descrição em uma frase, autor, URL do repositório e
site. O nome do executável define a pasta `~/.<bin>/`, o prefixo das
variáveis `<BIN>_HOME` e `<BIN>_MASTER_KEY` e o esquema das URIs MCP.

## Passos

1. Rode `git status --short` e preserve mudanças locais.
2. Rode `bun install`.
3. Rode o bootstrap com todos os campos conhecidos:

   ```bash
   bun run init -- --name <bin> --title "<Título>" --description "<frase>" --author "<Autor>" --repository <url> --site <url>
   ```

4. Atualize as skills para a versão mais recente do framework:

   ```bash
   bun run skills:update
   bun run skills:check
   ```

5. Confira a identidade nos três modos:

   ```bash
   bun run dev -- --version
   bun run dev -- about --json
   bun run dev -- mcp --list
   ```

   A TUI só abre em terminal interativo. Se o ambiente não tiver TTY, use o
   teste `tests/tui.test.ts`, que monta a interface no renderer de teste.

6. Rode `bun run validate`. O comando encadeia typecheck, testes, conferência
   das skills instaladas, conferência do `docs/opencli.json` e build.
7. Reescreva a seção inicial de `README.md` com o propósito do produto e
   apague o trecho sobre o template. Mantenha as seções de instalação, modos,
   configuração e release.
8. Registre a versão inicial em `CHANGELOG.md` e siga `docs/release.md` para
   tag e GitHub Release.

## Marcos de progresso

Informe ao usuário quando: o bootstrap terminar, as skills estiverem
atualizadas, `bun run validate` passar e o README
estiver reescrito. Em cada
marco, liste os arquivos alterados.

## Saída

Relate nome do binário, caminhos de dados, versão das skills instaladas
(`skills-lock.json`), comandos conferidos, testes executados e o que ficou
pendente. Não declare concluído com `bun run validate` falhando.

## Compatibilidade

Starter kit 0.4.x. Os caminhos citados (`scripts/init.ts`,
`docs/customize-template.md`, `tests/tui.test.ts`)
existem nessa faixa.
