# Personalizar o template

Este repositório é um template do GitHub. Para iniciar um binário novo:

1. No GitHub, clique em **Use this template** e crie o repositório.
2. Clone, instale e renomeie:

   ```bash
   bun install
   bun run init -- --name mycli --title "My CLI" --description "What it does." --author "Your company" --repository https://github.com/org/mycli --site https://example.com
   ```

   O script reescreve `package.json` (`name`, `bin`, `description`, bloco
   `termfy`), `.env.example` e as menções a `termfy` em `README.md`,
   `AGENTS.md`, `CHANGELOG.md` e `.github/workflows/`. Os placeholders
   `{{bin}}` em `docs/` são resolvidos em tempo de execução pelo manifest,
   então `docs/` não precisa de edição.

3. Escreva o `CLISPEC.md` com a skill `termfy-spec`: ela entrevista você e
   registra propósito, commands, options, saídas, screens, tools e keys de
   configuração. As demais skills leem esse arquivo antes de implementar.
4. Confira: `bun run dev -- --version`, `bun run dev -- --help`, `bun run dev`.
5. Rode `bun run ebook` para regenerar o guia em PDF e EPUB com o título novo.
6. Rode `bun run validate`.
7. Apague a seção "Sobre o template" do README e escreva a do produto.
8. Faça o primeiro commit e a primeira release conforme [release.md](release.md).

## O que mudar depois

| Quer | Onde |
| --- | --- |
| novo command | `template/command/example.ts` → `src/cli/commands/`, registrar em `src/cli/commands.ts` |
| nova aba | `template/screen/example.ts` → `src/tui/screens/`, registrar em `src/tui/screens/index.ts` |
| nova tool MCP | `template/tool/example.ts` → `src/mcp/tools/`, registrar em `src/mcp/server.ts` |
| nova key de configuração | `SETTINGS_SCHEMA` em `src/config/settings.ts` |
| novo exit code | `src/app/exit-codes.ts` e `src/app/errors.ts` |
| credits e links | `src/app/manifest.ts` e bloco `termfy` do `package.json` |
| cores da TUI | `src/tui/theme.ts` |

## Skills

As skills do framework [`promovaweb/termfy`](https://github.com/promovaweb/termfy)
estão instaladas em `.agents/skills/` e registradas em `skills-lock.json`.
Elas ensinam um agente a evoluir o projeto:

| Skill | Uso |
| --- | --- |
| `termfy-spec` | entrevistar a pessoa e montar o `CLISPEC.md` |
| `termfy-init` | criar o binário a partir do template e fazer o primeiro commit |
| `termfy-cli` | commands, options, saída texto/JSON, exit codes e OpenCLI |
| `termfy-tui` | screens, componentes, tema e o visual modern unix |
| `termfy-mcp` | tools, resources, prompts e testes com o Inspector |
| `termfy-config` | settings, credenciais, master key e variáveis |

Atualize para a versão mais recente do framework com `bun run skills:update`.
Se a pasta sumir, reinstale com `bun run skills:install`. Não edite as skills
aqui: mudanças acontecem no framework. Dentro deste repositório, os agentes
leem `AGENTS.md`, que aponta para elas.
