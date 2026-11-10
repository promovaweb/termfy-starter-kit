# Saída em texto e em JSON

## Fluxos

| Fluxo | Texto | `--json` |
| --- | --- | --- |
| dados do comando | stdout | stdout, envelope `{ ok: true, comando, dados }` |
| erro previsto | stderr, uma linha com `[código NOME]` | stdout, envelope `{ ok: false, comando, erro }` |
| progresso, avisos | stderr | stderr (texto livre) |
| servidor MCP | stdout reservado ao JSON-RPC | idem |

`comando` é a cadeia completa, por exemplo `termfy config get`.

## Quando o JSON é padrão

`saida.formato = json` em settings.json faz todo comando responder em JSON
sem a flag. `--json` sempre vence; não existe `--text`, porque a preferência
de arquivo cobre esse caso.

## Formatação de texto

Use `src/cli/formato.ts`:

- `tabela([[chave, valor], ...])` para pares alinhados;
- `secao("Título")` para cabeçalhos;
- `blocos(a, b, c)` para juntar com linha em branco, ignorando vazios;
- `cor.ok`, `cor.aviso`, `cor.erro`, `cor.sutil`, `cor.destaque`, `cor.codigo`.

Cores saem quando há TTY, `NO_COLOR` está vazio, `--no-color` não foi
passado e `saida.cores` é `true`.

## Mascaramento

`mascarar(valor)` mantém quatro caracteres iniciais e dois finais. Comandos
que exibem segredo mascaram por padrão e revelam só com `--reveal`. Em
`--json`, o campo muda de `mascarado` para `valor` quando revelado, para que
scripts não confundam os dois.

## Estabilidade

Depois de publicado, um campo de `dados` não muda de nome nem de tipo. Para
mudar, acrescente um campo novo e marque o antigo como obsoleto na descrição
do comando. Remova só em versão major.
