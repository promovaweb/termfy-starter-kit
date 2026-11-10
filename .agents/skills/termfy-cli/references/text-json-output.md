# Saída em texto e em JSON

## Fluxos

| Fluxo | Texto | `--json` |
| --- | --- | --- |
| dados do comando | stdout | stdout, envelope `{ ok: true, command, data }` |
| erro previsto | stderr, uma linha com `[código NOME]` | stdout, envelope `{ ok: false, command, error }` |
| progresso, avisos | stderr | stderr (texto livre) |
| servidor MCP | stdout reservado ao JSON-RPC | idem |

`command` é a cadeia completa, por exemplo `termfy config get`.

## Quando o JSON é padrão

`output.format = json` em settings.json faz todo comando responder em JSON
sem a flag. `--json` sempre vence; não existe `--text`, porque a preferência
de arquivo cobre esse caso.

## Formatação de texto

Use `src/cli/format.ts`:

- `table([[key, value]])` para pares alinhados;
- `section("Title")` para cabeçalhos;
- `blocks(a, b, c)` para juntar com linha em branco, ignorando vazios;
- `color.ok`, `color.warn`, `color.error`, `color.dim`, `color.strong`, `color.code`.

Cores saem quando há TTY, `NO_COLOR` está vazio, `--no-color` não foi
passado e `output.colors` é `true`.

## Mascaramento

`mask(value)` mantém quatro caracteres iniciais e dois finais. Comandos
que exibem segredo mascaram por padrão e revelam só com `--reveal`. Em
`--json`, o campo muda de `masked` para `value` quando revelado, para que
scripts não confundam os dois.

## Estabilidade

Depois de publicado, um campo de `data` não muda de nome nem de tipo. Para
mudar, acrescente um campo novo e marque o antigo como obsoleto na descrição
do comando. Remova só em versão major.
