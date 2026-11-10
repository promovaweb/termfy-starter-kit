# CLISPEC: Termfy

> Especificação do binário. Montada com a skill `termfy-spec` em entrevista
> com a pessoa responsável. As demais skills leem este arquivo antes de
> implementar. Substitua este conteúdo pelo do seu produto.

## Identidade

| Campo | Valor |
| --- | --- |
| bin | `termfy` |
| title | Termfy |
| description | CLI, TUI and MCP stdio server skeleton in Bun |
| author | Promovaweb |
| repository | https://github.com/promovaweb/termfy-starter-kit |

## Propósito

Esqueleto de referência: demonstra os três modos, a configuração, o cofre e
a documentação embutida. Um projeto derivado substitui esta seção pelo
problema que resolve e para quem.

## Públicos

| Público | Modo | O que precisa fazer |
| --- | --- | --- |
| pessoa no terminal | TUI e CLI em texto | ver o estado e ajustar preferências |
| script ou CI | CLI com `--json` | ler configuração e exit codes |
| agente de IA | MCP e `--skill` | descobrir o binário e operá-lo |

## Commands

| Command | Arguments | Options | Saída (`data`) | Exit codes |
| --- | --- | --- | --- | --- |
| `tui` | | `--tab <overview\|about>` | `{ closed }` | 8 |
| `about` | | | identity, runtime, platform, credits | |
| `config list\|get\|set\|unset\|path\|schema` | `key`, `value` | | ver `docs/cli.md` | 3, 6, 7 |
| `credentials set\|get\|list\|remove\|status\|clear` | `name` | `--stdin`, `--reveal`, `--yes` | ver `docs/cli.md` | 4, 7, 130 |
| `mcp` | | `--list` | catalog | 9 |
| `skill` | `topic` | | `{ topic, markdown }` | |

## TUI

| Screen | Conteúdo | Teclas próprias |
| --- | --- | --- |
| `overview` | environment, state, settings, next steps | |
| `about` | binary, project, credits, standards | |

## MCP

| Tipo | Nome | Entrada | Saída |
| --- | --- | --- | --- |
| tool | `about` | | identity |
| tool | `exit_codes` | | tabela |
| tool | `skill` | `topic?` | Markdown |
| tool | `config_list` | | values, schema |
| tool | `config_get` | `key` | value |
| tool | `credentials_status` | | names, count |
| resource | `termfy://about`, `termfy://exit-codes`, `termfy://skill[/{topic}]` | | |
| prompt | `operate` | `task` | instrução |

## Configuração

| Key | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `output.format` | `text\|json` | `text` | formato padrão |
| `output.colors` | boolean | `true` | cores |
| `tui.initialTab` | `overview\|about` | `overview` | aba inicial |
| `tui.theme` | `night\|day` | `night` | paleta |
| `telemetry.enabled` | boolean | `false` | reservado |

## Credenciais

Nenhuma credencial é consumida pelo esqueleto. Um projeto derivado lista
aqui cada `service.purpose` e o command ou tool que a usa.

## Fora de escopo

Rede, APIs externas e persistência além de `~/.termfy/`.

## Checagens de aceite

- `bun run validate` passa.
- `termfy --skill` imprime a documentação completa.
- `termfy mcp --list` enumera tools, resources e prompts.
