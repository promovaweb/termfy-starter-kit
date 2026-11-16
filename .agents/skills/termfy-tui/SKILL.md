---
name: termfy-tui
description: Implementa telas Termfy com OpenTUI Core, layout em células, foco, listas, formulários, estado assíncrono, cleanup e testes de interação e frames.
---

# Construir interfaces de terminal com OpenTUI

Use esta skill para criar ou revisar telas, componentes, navegação por teclado,
foco, rolagem e carregamento de informações na TUI do Termfy. O agente conduz
as alterações e as verificações; o usuário descreve a interface desejada.

## Leia antes

1. Leia `AGENTS.md`, `CLISPEC.md` e `docs/tui.md` do projeto. Leia a spec
   aberta em `specs/` (status `in_progress`) e localize a screen em
   `## Surface`, o Behavior (teclas, estados, o que a tela mostra), o Design e
   os itens `#termfy-tui` de Tasks e Tests. Se faltar a descrição do
   comportamento, use `termfy-spec`.
2. Confira a versão instalada de `@opentui/core`, o lock e o runtime.
   Leia [fontes e compatibilidade](references/opentui-sources.md).
3. Abra `src/tui/index.ts`, `src/tui/screen.ts`, `src/tui/components.ts`,
   `src/tui/theme.ts`, `src/tui/icons.ts` e `src/tui/screens/index.ts`. O
   código do projeto define quais recursos do OpenTUI já estão integrados.
4. Leia [o contrato de tela](references/screen-contract.md),
   [design modern unix](references/modern-unix-design.md) e
   [testes](references/screen-tests.md). Depois selecione os temas abaixo.

## Referências por tarefa

| Tarefa | Referência Termfy | Documentação OpenTUI copiada |
| --- | --- | --- |
| Montar e registrar uma aba | [Contrato de tela](references/screen-contract.md) | [Renderables](references/opentui/core-concepts/renderables.mdx) |
| Redimensionar, alinhar e rolar | [Layout e conteúdo](references/layout-and-content.md) | [Layout](references/opentui/core-concepts/layout.mdx), [ScrollBox](references/opentui/components/scrollbox.mdx) |
| Selecionar, editar e mudar o foco | [Teclado e formulários](references/keyboard-and-forms.md) | [Keyboard](references/opentui/core-concepts/keyboard.mdx), [Input](references/opentui/components/input.mdx) |
| Consultar API e atualizar a tela | [Estado e cleanup](references/async-and-lifecycle.md) | [Lifecycle](references/opentui/core-concepts/lifecycle.mdx) |
| Criar gráficos de linhas e barras | [Bibliotecas e gráficos](references/charts.md) | [FrameBuffer](references/opentui/components/frame-buffer.mdx) |
| Diagnosticar comportamento | [Diagnóstico](references/troubleshooting.md) | [Troubleshooting](references/opentui/test-and-debug/troubleshooting.mdx) |
| Adaptar um exemplo completo | [Exemplos](references/examples/README.md) | [Testing](references/opentui/core-concepts/testing.mdx) |

## Entrada e plano

Confirme a ação principal da tela, a origem das informações, o volume esperado,
os estados de carregamento e erro, as teclas e o menor terminal atendido.
Reaproveite o que o Behavior e o Design da spec já informam. Mostre um plano curto com arquivos,
comportamentos, exemplos escolhidos e verificações antes de editar.

## Contratos de implementação

1. Use a API imperativa de `@opentui/core`. Não adicione React, Solid ou
   outro gerenciador de estado para construir uma aba.
2. Crie uma tela por arquivo em `src/tui/screens/`. Use uma factory quando
   houver estado mutável; cada montagem de aplicação recebe suas instâncias.
3. Reutilize `panel`, `keyValueTable`, `list`, `heading`, `dim`, `spacer`,
   `button` e `listPanel`. Confira assinaturas no arquivo real, sem deduí-las
   pelo nome. `spacer(renderer, height)` não recebe tema. `button` e
   `listPanel` já respondem ao clique.
4. Use `ctx.theme` para cores e `ctx.icons` para ícones. Mantenha as três
   paletas (`terminal`, `night` e `day`) e o contrato visual existente. O
   padrão de `tui.theme` continua `terminal`, que herda as cores do tema do
   terminal. Componentes compartilhados recebem tema como parâmetro.
5. Declare cada comando da tela como uma `ScreenAction` em `actions`, com
   `keys`, `description`, `icon` e `run`. O shell roda a ação pela tecla,
   mostra na barra inferior e no help e roda no clique. A aba declara
   `icon`. A barra mostra o número e o ícone do papel.
6. Ligue todo elemento clicável à mesma função de uma ação. `button({ key,
   label, icon, onPress })` e a linha de `listPanel` chamam a função que a
   ação com aquela tecla chama. Teclado e mouse chegam ao mesmo efeito.
7. Use `mount` para criar nós. Inicie trabalho ativo em `onEnter` e interrompa
   em `onLeave`. Trate também `renderer` emitindo `destroy`: a versão atual
   de `mountTui` não chama `onLeave` ao encerrar a aplicação.
8. A aplicação é dona do renderer. Uma tela usa `ctx.quit()`; não chama
   `process.exit()`, não cria outro renderer e não escreve em stdout.
9. Retorne `true` de `onKey` apenas para uma tecla consumida pela tela.
   Preserve as teclas globais durante navegação. Prefira `actions` a `keys`
   mais `onKey` em telas novas. Leia a referência de foco antes de incluir
   qualquer campo editável.
10. Não reconstrua a árvore inteira para atualizar um texto. Preserve seleção
    e posição de leitura, limite logs em memória e cancele consultas antigas.
    Use `ctx.notify(message, tone)` para a mensagem curta da barra inferior e
    `ctx.refresh()` para remontar a tela.
11. Compartilhe serviços com CLI e MCP. A tela apresenta resultados; não
    duplica autenticação, persistência ou chamadas HTTP já existentes.
12. Não apresente um exemplo como integrado sem registrar a tela, declarar
    as ações, marcar os itens da spec e conferir o comportamento no host
    Termfy.

## Procedimento

1. Confira o Git e a spec aberta. Liste o que já funciona e o que a tela acrescenta.
2. Escolha um exemplo em `references/examples/README.md`. Copie apenas o
   necessário e adapte imports, domínio, identidade e fonte das informações.
3. Monte a árvore com limites de largura e altura. Dê texto próprio aos
   estados vazio, carregando, erro e pronto, além de ação para tentar novamente.
4. Registre a tela em `src/tui/screens/index.ts`. Para permitir abertura direta,
   atualize também `tui.initialTab` em `src/config/settings.ts` e `--tab` em
   `src/cli/commands/tui.ts`.
5. Integre teclas e foco. Declare as ações da tela com `keys`, `description`,
   `icon` e `run`. Se precisar mudar o contrato `Screen.onKey`, altere
   host, tipos, testes e documentação juntos. Não simule modificadores com
   nomes de teclas que o contrato atual não recebe.
6. Teste a lógica isolada, depois a tela com `createTestRenderer` e finalmente
   a navegação pelo `mountTui`. Inclua saída durante uma requisição pendente.
   Use `setup.mockMouse` para o clique, o hover e a roda, além de
   `mockInput.pressKey` para a tecla da mesma ação.
7. Confira `terminal`, `night` e `day` em 80×24, 110×30 e 160×40.
   Acrescente 40×12 para verificar a mensagem de terminal pequeno ou a
   composição compacta.
8. Atualize `docs/tui.md` e os exemplos de uso. Se a tela mudou em relação
   à spec, revise a Surface e o Behavior com `termfy-spec`.
   Execute a validação do projeto e relate falhas alheias ao escopo.

## Itens da spec

Ao começar, troque `Status:` para `in_progress` na spec e na linha dela no
índice do `CLISPEC.md`. Depois de implementar e testar, marque `[x]` no
item da spec, editando o arquivo em `specs/`. Item novo entra no fim de
Tasks ou Tests, com a tag `#termfy-tui`. Mantenha `in_progress` enquanto
houver entregas por fazer. Use `termfy-spec` se o comportamento combinado
mudar e registre a alteração em `## Notes` da spec. Não mexa na
superfície do `CLISPEC.md` enquanto a spec está aberta: a screen nova fica
só na Surface da spec. Execute `bun run validate`. Com todos os itens
marcados, feche a spec pelo ciclo de `termfy-spec`: faça a conferência
manual descrita em `references/spec-contract.md` daquela skill, aplique a
Surface às tabelas do `CLISPEC.md` e troque o status para `done`. Uma
verificação reprovada não equivale a entrega validada.

## Marcos e saída

Informe quando a tela estiver montada, quando teclado, mouse e cleanup
estiverem conferidos e quando os testes e a documentação terminarem.
Entregue os arquivos alterados, versões verificadas, teclas, ações, estados
cobertos, dimensões ensaiadas e um frame real capturado. Identifique
separadamente testes executados, exemplos apenas compilados e comportamentos
ainda não exercitados.

## Compatibilidade

Starter kit a partir da v0.11.0 (tema `terminal` em `tui.theme`; specs em
Markdown puro, sem command
`spec`; `tui.initialTab` aceita `overview` e `about`) e OpenTUI Core 0.8.4,
conferidos no checkout. A faixa
`^0.8.4` não prova qual versão está instalada. Não atualize dependências
somente porque a documentação online apresenta uma versão posterior.
As referências originais em `references/opentui/` permanecem com licença e
marcador `.terceiros`; os guias e exemplos Termfy ficam fora dessa pasta.
