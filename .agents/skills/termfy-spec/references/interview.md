# Entrevista do CLISPEC

Pergunte em blocos. Confirme cada bloco em uma frase antes do próximo. Quando
houver escolha, ofereça até três caminhos com o recomendado primeiro e aceite
uma resposta livre.

## 1. Identidade

- Qual o nome do executável? (minúsculas, dígitos e hífen)
- Qual o título legível e a frase de descrição, em inglês?
- Quem assina: autor, repositório, site?

Define: `bin`, `title`, `description` do front matter e os argumentos de
`bun run init`.

## 2. Propósito e públicos

- Que problema o binário resolve e para quem?
- Quem usa no terminal, quem chama por script e que agente vai operá-lo?
- O que cada público precisa conseguir fazer na primeira versão?

Define: `## Purpose` e `## Audiences`. Se um público não existir, registre e
remova o modo correspondente do escopo (uma TUI sem público pode ficar só
com Overview e About).

## 3. Modos

- A TUI precisa de abas além de Overview e About? Quais?
- O CLI vai ser chamado por scripts? Então todo command precisa de `data`
  estável.
- Agentes vão operar pelo MCP? Então cada ação relevante vira tool.

Define: se `screens` e `mcp` do front matter ficam vazios ou não.

## 4. Commands

Para cada ação que a pessoa citou:

- Nome do command e, se houver família, do subcommand (`orders list`).
- Arguments posicionais: quais, obrigatórios ou não, valores aceitos.
- Options: nome, se recebe valor, tipo, padrão, valores aceitos.
- O que volta em `data` no `--json`: campos e tipos.
- O que pode dar errado e com qual exit code.
- Um exemplo de uso.
- Precisa de confirmação ou de terminal? Então `interactive` e uma saída não
  interativa (`--yes`, `--stdin`).

Define: a lista `commands` do front matter. Recomende o padrão `recurso verbo`
(`orders list`, `orders show`) quando houver mais de uma ação sobre o mesmo
recurso.

## 5. TUI

Para cada aba nova:

- O que a pessoa precisa ver de relance? (vira painéis)
- O que ela faz ali? (vira teclas próprias)
- Os dados vêm de onde? (reaproveita um command ou função de `config/`)

Define: a lista `screens`. Recomende poucas abas, cada uma com até quatro painéis.

## 6. MCP

Para cada ação que um agente vai executar:

- Nome da tool em `snake_case` e o command que ela espelha.
- Entrada: campos, tipos, opcionais.
- Saída: forma de `structuredContent`.
- Efeito: só leitura, grava em disco, chama rede.

Para dados passivos (documentação, listas estáveis): resource com URI.
Define: `mcp.tools`, `mcp.resources` e `mcp.prompts`. Lembre que nenhuma tool devolve valor de credencial.

## 7. Configuração e credenciais

- Que preferências a pessoa vai querer mudar sem editar código? (keys)
- Que serviços externos o binário acessa? Cada um vira uma credencial
  `service.purpose`.
- Como a pessoa obtém cada credencial?

Define: `settings` e `credentials`.

## 8. Fora de escopo

- O que fica para depois, mesmo que pareça óbvio?

Define: `## Out of scope`. Uma lista curta evita que o agente amplie o
trabalho.

## 9. Checagens de aceite

- Como a pessoa vai saber que está pronto? Que comando ela roda e o que
  espera ver?

Define: os itens de `## Checklist`, um por entrega, cada um com `{#id}` e a
tag da skill responsável. Frases verificáveis: command, saída e exit code.

## Fechamento

Releia a spec com a pessoa, rode `bun run dev -- spec check --json`, registre
as pendências em `## Notes` e indique a próxima skill. Diferencie erros
de estrutura de referências futuras ainda não implementadas. As skills
de implementação marcam a checklist somente após implementar e testar.
