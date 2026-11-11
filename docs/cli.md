# CLI

## Convenções

- `{{bin}} <command> [subcommand] [arguments] [options]`.
- Options aceitam `--key value` e `--key=value`. Não há agrupamento de flags
  curtas (`-abc`).
- `--` encerra a leitura de options; o que vem depois é argument.
- Options globais valem em qualquer posição, antes ou depois do command.
- Sem argumentos, em terminal interativo, o binário abre a TUI. Sem TTY,
  imprime o help e sai com exit code 2.
- Toda saída de dados vai para stdout. Avisos, progresso e erros em modo
  texto vão para stderr.
- Nomes de commands, subcommands, options, arguments, keys e campos de saída
  são em inglês. Mensagens do binário também.

## Options globais

| Option | Efeito |
| --- | --- |
| `-h`, `--help` | Help do command atual. Exit code 0. |
| `-V`, `--version` | Imprime `{{bin}} <version>`. Exit code 0. |
| `--json` | Saída em JSON com envelope estável. Erros também saem em JSON, em stdout. |
| `--skill [topic]` | Documentação embutida. Topics: `cli`, `tui`, `mcp`, `config`, `exit-codes`, `reference`. |
| `--opencli` | Descrição OpenCLI 0.1 da árvore de commands em JSON. |
| `--no-color` | Desliga cores ANSI. `NO_COLOR=1` tem o mesmo efeito. |

## Saída em texto e em JSON

Texto é o padrão quando `output.format` em settings.json é `text`. Com
`--json`, ou com `output.format = json`, a saída segue este envelope:

```json
{ "ok": true, "command": "{{bin}} config get", "data": { "key": "tui.theme", "value": "night" } }
```

Em erro:

```json
{
  "ok": false,
  "command": "{{bin}} credentials get",
  "error": { "code": 4, "name": "CREDENTIALS", "message": "Credential \"x\" not found.", "details": { "name": "x" } }
}
```

O exit code do processo é sempre o mesmo de `error.code`. Um agente deve ler
os dois: o envelope para a mensagem, o code para a classe da falha.

## Commands do esqueleto

| Command | Função |
| --- | --- |
| `tui [--tab <tab>]` | Abre a TUI. Exige TTY. |
| `about` | Version, executable, runtime, platform e credits. |
| `config list\|get\|set\|unset\|path\|schema` | Preferências em settings.json. |
| `credentials set\|get\|list\|remove\|status\|clear\|rotate-key` | Cofre cifrado em credentials.json. |
| `mcp [--list]` | Servidor MCP via stdio, ou listagem do que ele registra. |
| `skill [topic]` | Mesmo efeito de `--skill`. |
| `doctor` | Confere runtime, TTY, pasta, settings, chave e cofre. |
| `completion <shell>` | Gera script para `bash`, `zsh` ou `fish`. |
| `spec show\|list\|progress\|check\|new\|start\|block\|archive\|task add\|test add\|done\|close\|sync\|migrate` | Lê o `CLISPEC.md` e as specs de `specs/`, confere o contrato com o código e as migrations, cria, edita e fecha specs. `check --strict` também falha com avisos. |

O command `spec` trabalha com dois documentos. O `CLISPEC.md`, embutido no
binário, é a visão macro: identidade, superfície entregue e índice das specs.
Cada arquivo de `specs/` descreve uma evolução, com mudanças de superfície,
tarefas e testes.

| Subcommand | Função |
| --- | --- |
| `spec show [id]` | sem ID, resume o `CLISPEC.md`; com ID, mostra uma spec e suas pendências |
| `spec list` | specs com status, progresso e contagem de mudanças |
| `spec progress [id]` | tarefas e testes concluídos de uma spec ou da soma das specs abertas |
| `spec check [--strict]` | confere o `CLISPEC.md` com o código e as specs com o `CLISPEC.md`; exit code 3 na falha |
| `spec new <slug> [--title <text>]` | cria `specs/NNNN-<slug>.md` como `draft` e o registra no índice |
| `spec start <id>` | move uma spec `draft` ou `blocked` para `in_progress` |
| `spec block <id> --reason <text>` | marca uma spec aberta como `blocked` |
| `spec archive <id> --reason <text>` | arquiva uma spec aberta sem aplicar suas mudanças |
| `spec task add <id> <text> [--tag <skill>]` | acrescenta uma tarefa com `{#id}` gerado |
| `spec test add <id> <text>` | acrescenta um teste de aceite com `{#id}` gerado |
| `spec done <id> <item> [--undo]` | marca ou desmarca uma tarefa ou teste |
| `spec close <id>` | aplica as mudanças de uma spec concluída ao `CLISPEC.md`, a marca como `done` e registra a data em `## Notes` |
| `spec sync [--write] [--spec <id>]` | acrescenta ao `CLISPEC.md`, ou ao `changes.add` de uma spec aberta, o que o código tem e nenhuma spec aberta planeja |
| `spec migrate [--write]` | converte um `CLISPEC.md` 1.0.0 e move a checklist para `specs/` |

Todos aceitam `--json`. Os subcommands que gravam aceitam `--file <path>`
(padrão `CLISPEC.md`), e `specs/` fica ao lado desse arquivo. Fora da pasta
do projeto, `spec list` usa o índice embutido. O formato dos arquivos está
em [docs/spec.md](spec.md).

## Como adicionar um command

1. Copie `template/command/example.ts` para `src/cli/commands/<name>.ts`.
2. Preencha `name`, `description`, `arguments`, `options`, `examples` e
   `exitCodes`. Toda option precisa de `description`; é ela que aparece no
   `--help`, no `--skill` e no OpenCLI.
3. Implemente `run(ctx)` devolvendo `{ data, text }`. `data` é o que sai em
   `--json`; `text` é o que sai para humanos. Lance `AppError` (ou use
   `error.*`) para falhas previstas, com o exit code certo.
4. Registre o command em `src/cli/commands.ts`.
5. Rode `bun test`, `bun run opencli` e confira `docs/opencli.json`.

Segredos nunca entram por argument de linha de comando. Leia pelo stdin ou
por `readSecret()`; grave com `setCredential()`; recupere com
`getCredential()`, que encerra com exit code 4 quando o valor não existe.

## Diagnóstico e completion

`{{bin}} doctor` confere Bun 1.4.4 ou superior, TTY de stdin/stdout,
pasta de dados com 0700, leitura de settings.json, origem da master key,
decifragem do cofre, versão e plataforma. Cada linha usa ✓, ! ou ✗.
Em JSON, `data` contém `{ checks, ok }`; cada check tem `name`, `status`
e `detail`. Ausência de TTY ou de arquivos ainda não criados gera `warn`.
Uma verificação com `fail` produz exit code 3; as demais retornam 0.
O diagnóstico não cria arquivos nem mostra segredos.

`{{bin}} completion <shell>` imprime o script em stdout. O argument `shell`
aceita `bash`, `zsh` ou `fish`; subcommands, options locais e globais e valores
de enum vêm do registry. Com `--json`, `data` contém `{ shell, script }`.
O script Zsh usa `compdef` e `compadd`, sem `bashcompinit`.
Instale na sessão atual ou acrescente a linha ao arquivo de inicialização:

```bash
eval "$({{bin}} completion bash)"
eval "$({{bin}} completion zsh)"
# fish
{{bin}} completion fish | source
```

`{{bin}} --skill reference` retorna somente a referência gerada, com
commands, arguments, options e exit codes. `skill reference` tem o mesmo
resultado, sem os capítulos da documentação.
