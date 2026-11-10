# Da frase da pessoa à entrevista

A pessoa costuma dizer algo como: "quero um CLI que liste meus pedidos da
loja, mostre o detalhe de um pedido e avise quando chegar um novo". Extraia
o que a entrevista da `termfy-spec` pergunta antes de perguntar de novo.

| Bloco da entrevista | O que procurar na frase | Exemplo |
| --- | --- | --- |
| Identidade | nome do produto ou do serviço | `loja` → sugerir `bin: lojacli`, `title: Loja CLI` |
| Propósito | o verbo principal e o objeto | listar e ver pedidos; avisar sobre novos |
| Públicos | quem fala ("meus", "a equipe", "o agente") | pessoa no terminal; agente via MCP se mencionar automação |
| Modos | "avisar", "acompanhar", "painel" sugerem TUI; "no script", "no CI" sugerem `--json` | TUI com aba de pedidos |
| Commands | cada verbo vira `recurso verbo` | `orders list`, `orders show <id>`, `orders watch` |
| TUI | o que a pessoa quer "ver" | screen `orders` com `listPanel` |
| MCP | o que um agente faria | `orders_list`, `orders_show` |
| Configuração | o que varia por ambiente | `shop.baseUrl` |
| Credenciais | o serviço citado | `shop.token` |
| Fora de escopo | o que a frase não pede | criar ou cancelar pedidos |

## Perguntas que ainda valem a pena

Só as que mudam a construção e a frase não responde:

1. Qual serviço ou API fornece os dados, e como se autentica?
2. O que o usuário precisa ver primeiro na TUI?
3. Algum command deve rodar sem confirmação em script?

Três perguntas no máximo, em uma mensagem, com um caminho recomendado em
cada. Depois disso, a `termfy-spec` grava e `termfy-build` segue.

## Sugerir, não decidir sozinho

Nome do executável, nomes de commands e nomes de credenciais são sugeridos
com a forma final ("`orders list`, pode ser?"). A pessoa aprova no
checkpoint da spec; até lá, nada é código.
