---
name: termfy-spec
description: Entrevista a pessoa e monta o CLISPEC.md do binário (propósito, públicos, commands, options, saídas, screens da TUI, tools MCP, configuração, credenciais e exit codes), para que as demais skills implementem com o pedido claro.
---

# Montar o CLISPEC.md

Use esta skill antes de implementar qualquer command, screen ou tool em um
projeto derivado do starter kit, quando `CLISPEC.md` não existir, estiver com
o conteúdo de exemplo ou não cobrir o pedido atual. O resultado é um único
arquivo na raiz, `CLISPEC.md`, que as skills `termfy-cli`, `termfy-tui`,
`termfy-mcp` e `termfy-config` leem antes de tocar no código.

## Leia antes

- `AGENTS.md` do repositório.
- `CLISPEC.md` atual, se existir.
- `references/clispec-template.md`: o formato do arquivo.
- `references/entrevista.md`: as perguntas, em ordem, e o que cada resposta
  define.
- `docs/cli.md`, `docs/tui.md`, `docs/mcp.md` e `docs/configuration.md` do
  starter kit, para conhecer o que o esqueleto já oferece e não especificar
  de novo.

## Regras

1. A spec descreve o que o binário faz, não como o código é organizado. A
   organização já vem do starter kit.
2. Toda entrada da spec usa os nomes que vão para o código, em inglês:
   commands, subcommands, options, arguments, keys, campos de `data`, tools,
   resources e screens. A prosa em volta fica em português.
3. Cada command tem: nome, uma frase de propósito, arguments com
   obrigatoriedade, options com tipo e padrão, formato de `data` no `--json`,
   exit codes além de 0, 1 e 2, e um exemplo de uso.
4. Cada credencial consumida tem nome `service.purpose` e a lista de commands
   e tools que a usam.
5. Cada tool MCP tem nome em `snake_case`, entrada, saída e se grava ou chama
   rede.
6. O que não entra no binário vai em "Fora de escopo". O que prova que o
   binário está pronto vai em "Checagens de aceite", em frases verificáveis.
7. Não invente requisitos. Quando a pessoa não souber responder, registre a
   dúvida em "Pendências" com a pergunta aberta, e siga.
8. A entrevista é em etapas curtas. Faça poucas perguntas por vez, confirme
   o entendimento em uma frase e só então avance. Em cada escolha aberta,
   ofereça até três caminhos com o recomendado primeiro.

## Passos

1. Rode `git status --short` e leia o `CLISPEC.md` atual.
2. Conduza a entrevista de `references/entrevista.md` na ordem: identidade,
   propósito e públicos, modos, commands, TUI, MCP, configuração e
   credenciais, fora de escopo, checagens de aceite.
3. A cada bloco respondido, escreva a seção correspondente no `CLISPEC.md`
   seguindo `references/clispec-template.md` e mostre o trecho à pessoa.
4. Ao final, releia o arquivo inteiro em voz de revisão: nomes em inglês,
   exit codes existentes em `src/app/exit-codes.ts`, options sem colisão com
   as globais (`--help`, `--version`, `--json`, `--skill`, `--opencli`,
   `--no-color`), credenciais nomeadas.
5. Liste as pendências e pergunte se a pessoa quer resolvê-las agora ou
   seguir para a implementação com elas registradas.
6. Indique a próxima skill: `termfy-cli` para commands, `termfy-tui` para
   screens, `termfy-mcp` para tools, `termfy-config` para keys e credenciais.

## Marcos

Identidade e propósito confirmados; tabela de commands fechada; TUI e MCP
decididos; configuração e credenciais nomeadas; `CLISPEC.md` gravado e
relido.

## Saída

Relate o caminho do `CLISPEC.md`, o número de commands, screens, tools e
keys especificados, as pendências abertas e a skill sugerida para o próximo
passo.

## Compatibilidade

Starter kit 0.3.x. O arquivo `CLISPEC.md` nasce na raiz do starter kit com um
exemplo, e `AGENTS.md` manda lê-lo antes de implementar.
