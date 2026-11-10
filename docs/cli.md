# CLI

## Convenções

- `{{bin}} <comando> [subcomando] [argumentos] [opções]`.
- Opções aceitam `--chave valor` e `--chave=valor`. Não há agrupamento de
  flags curtas (`-abc`).
- `--` encerra a leitura de opções; o que vem depois é argumento.
- Opções globais valem em qualquer posição, antes ou depois do comando.
- Sem argumentos, em terminal interativo, o binário abre a TUI. Sem TTY,
  imprime a ajuda e sai com código 2.
- Toda saída de dados vai para stdout. Avisos, progresso e erros em modo
  texto vão para stderr.

## Opções globais

| Opção | Efeito |
| --- | --- |
| `-h`, `--help` | Ajuda do comando atual. Código 0. |
| `-V`, `--version` | Imprime `{{bin}} <versão>`. Código 0. |
| `--json` | Saída em JSON com envelope estável. Erros também saem em JSON, em stdout. |
| `--skill [topico]` | Documentação embutida. Tópicos: `cli`, `tui`, `mcp`, `config`, `codigos`. |
| `--opencli` | Descrição OpenCLI 0.1 da árvore de comandos em JSON. |
| `--no-color` | Desliga cores ANSI. `NO_COLOR=1` tem o mesmo efeito. |

## Saída em texto e em JSON

Texto é o padrão quando `saida.formato` em settings.json é `texto`. Com
`--json`, ou com `saida.formato = json`, a saída segue este envelope:

```json
{ "ok": true, "comando": "{{bin}} config get", "dados": { "chave": "tui.tema", "valor": "noite" } }
```

Em erro:

```json
{
  "ok": false,
  "comando": "{{bin}} credentials get",
  "erro": { "codigo": 4, "nome": "CREDENCIAIS", "mensagem": "Credencial \"x\" não encontrada.", "detalhes": { "nome": "x" } }
}
```

O código de saída do processo é sempre o mesmo de `erro.codigo`. Um agente
deve ler os dois: o envelope para a mensagem, o código para a classe da falha.

## Comandos do esqueleto

| Comando | Função |
| --- | --- |
| `tui [--aba <aba>]` | Abre a TUI. Exige TTY. |
| `about` | Versão, executável, runtime, plataforma e créditos. |
| `config list\|get\|set\|unset\|path\|schema` | Preferências em settings.json. |
| `credentials set\|get\|list\|remove\|status\|clear` | Cofre cifrado em credentials.json. |
| `mcp [--list]` | Servidor MCP via stdio, ou listagem do que ele registra. |
| `skill [topico]` | Mesmo efeito de `--skill`. |

## Como adicionar um comando

1. Copie `template/comando/exemplo.ts` para `src/cli/comandos/<nome>.ts`.
2. Preencha `nome`, `descricao`, `argumentos`, `opcoes`, `exemplos` e
   `codigosSaida`. Toda opção precisa de `descricao`; é ela que aparece no
   `--help`, no `--skill` e no OpenCLI.
3. Implemente `executar(ctx)` devolvendo `{ dados, texto }`. `dados` é o que
   sai em `--json`; `texto` é o que sai para humanos. Lance `ErroApp` (ou use
   `erro.*`) para falhas previstas, com o código certo.
4. Registre o comando em `src/cli/comandos.ts`.
5. Rode `bun test`, `bun run opencli` e confira `docs/opencli.json`.

Segredos nunca entram por argumento de linha de comando. Leia pelo stdin ou
por `lerSegredo()`; grave com `definirCredencial()`; recupere com
`obterCredencial()`, que encerra com código 4 quando o valor não existe.
