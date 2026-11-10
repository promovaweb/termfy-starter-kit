---
name: termfy-tui
description: Cria e altera telas da TUI Termfy sobre o OpenTUI, com abas modulares, componentes compartilhados, tema modern unix e testes por captura de frame.
---

# Construir e evoluir a TUI

Use esta skill para criar abas, mudar o layout, ajustar o tema ou corrigir a
interação por teclado da interface de terminal.

## Leia antes

- `CLISPEC.md` na raiz do projeto e `bun run dev -- spec show --json`: a
  entrada do front matter e o item da checklist que descrevem o que será
  implementado. Se o arquivo não cobrir o pedido, rode a skill `termfy-spec`
  antes de continuar.
- `docs/tui.md`.
- `src/tui/index.ts` (montagem), `src/tui/screen.ts` (contrato),
  `src/tui/components.ts` e `src/tui/theme.ts`.
- `references/modern-unix-design.md`: o padrão visual que toda tela segue.
- `references/opentui/README.md`: índice da documentação oficial do OpenTUI
  copiada nesta skill; abra as páginas indicadas para o componente em uso.
- `references/screen-tests.md` para escrever o teste da tela.

## Regras

1. Uma aba por arquivo em `src/tui/screens/`, registrada em
   `src/tui/screens/index.ts`. A ordem da lista é a ordem das abas.
2. Nenhuma cor literal nas telas. Use `ctx.theme.*`. Cor nova entra em
   `src/tui/theme.ts`, nas duas paletas, com nome de papel.
3. Use os componentes de `src/tui/components.ts`: `panel`, `keyValueTable`,
   `list`, `heading`, `dim` e `listPanel` (lista com rolagem e seleção por
   teclado, com `select`, `selected` e `move` para a screen tratar em
   `onKey`). Se precisar de um novo,
   crie lá, com tema como parâmetro, e documente no cabeçalho do arquivo.
4. Painéis vizinhos não têm gap. Padding interno de uma célula. Bordas
   `rounded` com título na borda. Acento só no painel em foco.
5. Teclas da tela vão em `keys` (para a barra inferior) e em `onKey`.
   Não capture `q`, `Esc`, `Tab`, `?` nem dígitos, que são globais.
6. Timers e assinaturas começam em `onEnter` e terminam em `onLeave`.
7. A TUI nunca escreve em stdout com `console.log`. Use `renderer.console`
   do OpenTUI quando precisar depurar.
8. `renderer.destroy()` fica a cargo de `mountTui`. A tela chama
   `ctx.quit()` quando precisar encerrar.

## Passos

1. Rode `git status --short`.
2. Copie `template/screen/example.ts` para `src/tui/screens/<id>.ts` e ajuste os
   imports.
3. Monte o conteúdo com `panel`, `keyValueTable`, `list`, `heading` e
   `dim`. Dados vêm de funções de `src/config/` ou de coletores já usados
   pelo CLI (como `aboutData`), nunca de chamadas duplicadas.
4. Registre a tela. Se ela puder ser aba inicial, acrescente o `id` em
   `tui.initialTab` (`src/config/settings.ts`) e em `--tab`
   (`src/cli/commands/tui.ts`).
5. Escreva o teste em `tests/tui.test.ts` ou em arquivo próprio com
   `createTestRenderer` e `captureCharFrame`.
6. Rode `bun run validate`.
7. Atualize `docs/tui.md` com a aba nova e suas teclas.

## Checklist da spec

Ao concluir cada entrega, marque o item correspondente em `## Checklist` do
`CLISPEC.md` de `- [ ]` para `- [x]` pelo `{#id}`, sem mudar texto nem id,
e avance `updatedAt`. Registre em `## Notes` uma linha datada quando a
implementação se afastar do combinado. Rode `bun run dev -- spec check` antes
de entregar: avisos sobre o item recém-implementado devem ter sumido.

## Marcos

Tela registrada e visível no frame de teste; teclas da tela na barra; testes
verdes; documentação ajustada.

## Saída

Liste arquivos, cole o frame capturado da tela nova (texto) e informe os
comandos de validação executados.

## Compatibilidade

Starter kit 0.5.x. Caminhos citados: `src/tui/index.ts`, `src/tui/screen.ts`,
`src/tui/components.ts`, `src/tui/theme.ts`, `src/tui/screens/`,
`template/screen/example.ts`, `tests/tui.test.ts` e `docs/tui.md`.
