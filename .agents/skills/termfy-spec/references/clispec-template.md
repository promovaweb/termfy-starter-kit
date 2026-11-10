# Template do CLISPEC.md

Copie o bloco abaixo para `CLISPEC.md` na raiz do projeto e preencha. Mantenha
os títulos: as outras skills procuram por eles.

````markdown
# CLISPEC: <Title>

> Especificação do binário. Montada com a skill `termfy-spec` em <data>.
> As demais skills leem este arquivo antes de implementar.

## Identidade

| Campo | Valor |
| --- | --- |
| bin | `<bin>` |
| title | <Title> |
| description | <uma frase, em inglês, que vai para o package.json> |
| author | <org> |
| repository | <url> |

## Propósito

<Dois ou três parágrafos: o problema, quem sofre com ele hoje e o que muda
com o binário. Sem lista de features.>

## Públicos

| Público | Modo | O que precisa fazer |
| --- | --- | --- |
| <pessoa no terminal> | TUI e CLI em texto | <tarefas> |
| <script ou CI> | CLI com `--json` | <tarefas> |
| <agente de IA> | MCP e `--skill` | <tarefas> |

## Commands

| Command | Arguments | Options | Saída (`data`) | Exit codes |
| --- | --- | --- | --- | --- |
| `orders list` | | `--status <open\|closed>`, `--limit <n>` (10) | `{ count, orders[] }` | 4, 5 |
| `orders show` | `<id>` | | `{ order }` | 4, 5, 6 |

Para cada command, um bloco:

### `orders list`

Lista pedidos da loja. Lê a credencial `shop.token`.

- Arguments: nenhum.
- Options: `--status <open|closed>` filtra por estado; `--limit <n>` limita
  a quantidade, padrão 10.
- `data`: `{ "count": 2, "orders": [{ "id": "...", "status": "open" }] }`.
- Exit codes: 4 sem credencial; 5 falha da API.
- Exemplo: `mycli orders list --status open --json`.

## TUI

| Screen | Conteúdo | Teclas próprias |
| --- | --- | --- |
| `overview` | <painéis> | |
| `orders` | <painéis> | `r` recarrega, `Enter` abre |

## MCP

| Tipo | Nome | Entrada | Saída | Efeito |
| --- | --- | --- | --- | --- |
| tool | `orders_list` | `status?`, `limit?` | `{ count, orders[] }` | lê rede |
| resource | `mycli://orders/{id}` | | JSON do pedido | lê rede |
| prompt | `operate` | `task` | instrução | nenhum |

## Configuração

| Key | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `shop.baseUrl` | string | `https://api.example.com` | endereço da API |

## Credenciais

| Nome | Usada por | Como obter |
| --- | --- | --- |
| `shop.token` | `orders *`, `orders_list` | painel da loja, seção API |

## Fora de escopo

- <o que o binário não faz nesta versão>

## Checagens de aceite

- `mycli orders list --json` devolve `count` e `orders` com a credencial gravada.
- `mycli orders list` sem credencial sai com exit code 4 e orienta `credentials set shop.token`.
- `bun run validate` passa.

## Pendências

- <pergunta aberta, com quem responde>
````

## Regras de preenchimento

- Nomes em inglês, no formato do código: commands em minúsculas, options com
  `--`, keys em `group.camelCase`, tools em `snake_case`, resources em
  `<bin>://path/{param}`.
- Exit codes vêm de `src/app/exit-codes.ts`. Uma família nova entra na spec
  com nome e número e depois no código.
- `data` descreve a forma, não o valor: campos e tipos. Um exemplo curto
  ajuda quando a forma tem lista ou aninhamento.
- Uma credencial nunca aparece com valor.
