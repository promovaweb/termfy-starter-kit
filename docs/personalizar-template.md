# Personalizar o template

Este repositório é um template do GitHub. Para iniciar um binário novo:

1. No GitHub, clique em **Use this template** e crie o repositório.
2. Clone, instale e renomeie:

   ```bash
   bun install
   bun run iniciar -- --nome meucli --titulo "Meu CLI" --descricao "O que ele faz." --autor "Sua empresa" --repositorio https://github.com/org/meucli --site https://exemplo.com
   ```

   O script reescreve `package.json` (`name`, `bin`, `description`, bloco
   `termfy`), `.env.example` e as menções a `termfy` em `README.md`,
   `AGENTS.md`, `CHANGELOG.md` e `.github/workflows/`. Os placeholders
   `{{bin}}` em `docs/` são resolvidos em tempo de execução pelo manifesto,
   então `docs/` não precisa de edição.

3. Confira: `bun run dev -- --version`, `bun run dev -- --help`, `bun run dev`.
4. Rode `bun run ebook` para regenerar o guia em PDF e EPUB com o título novo.
5. Rode `bun run validar`.
6. Apague a seção "Sobre o template" deste README e escreva a do produto.
7. Faça o primeiro commit e a primeira release conforme [release.md](release.md).

## O que mudar depois

| Quer | Onde |
| --- | --- |
| novo comando | `template/comando/exemplo.ts` → `src/cli/comandos/`, registrar em `src/cli/comandos.ts` |
| nova aba | `template/tela/exemplo.ts` → `src/tui/telas/`, registrar em `src/tui/telas/index.ts` |
| nova tool MCP | `template/tool/exemplo.ts` → `src/mcp/tools/`, registrar em `src/mcp/servidor.ts` |
| nova chave de configuração | `ESQUEMA_SETTINGS` em `src/config/settings.ts` |
| novo código de saída | `src/app/saida.ts` e `src/app/erros.ts` |
| créditos e links | `src/app/manifesto.ts` e bloco `termfy` do `package.json` |
| cores da TUI | `src/tui/tema.ts` |

## Skills

As skills do framework [`promovaweb/termfy`](https://github.com/promovaweb/termfy)
estão instaladas em `.agents/skills/` e registradas em `skills-lock.json`.
Elas ensinam um agente a evoluir o projeto:

| Skill | Uso |
| --- | --- |
| `termfy-iniciar` | criar o binário a partir do template e fazer o primeiro commit |
| `termfy-cli` | comandos, opções, saída texto/JSON, códigos de saída e OpenCLI |
| `termfy-tui` | telas, componentes, tema e o visual modern unix |
| `termfy-mcp` | tools, resources, prompts e testes com o Inspector |
| `termfy-config` | settings, credenciais, chave mestra e variáveis |

Atualize para a versão mais recente do framework com `bun run skills:update`.
Se a pasta sumir, reinstale com `bun run skills:instalar`. Não edite as skills
aqui: mudanças acontecem no framework. Dentro deste repositório, os agentes
leem `AGENTS.md`, que aponta para elas.
