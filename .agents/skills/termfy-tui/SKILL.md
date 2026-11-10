---
name: termfy-tui
description: Cria e altera telas da TUI Termfy sobre o OpenTUI, com abas modulares, componentes compartilhados, tema modern unix e testes por captura de frame.
---

# Construir e evoluir a TUI

Use esta skill para criar abas, mudar o layout, ajustar o tema ou corrigir a
interação por teclado da interface de terminal.

## Leia antes

- `docs/tui.md`.
- `src/tui/index.ts` (montagem), `src/tui/tela.ts` (contrato),
  `src/tui/componentes.ts` e `src/tui/tema.ts`.
- `references/design-modern-unix.md`: o padrão visual que toda tela segue.
- `references/opentui/README.md`: índice da documentação oficial do OpenTUI
  copiada nesta skill; abra as páginas indicadas para o componente em uso.
- `references/testes-de-tela.md` para escrever o teste da tela.

## Regras

1. Uma aba por arquivo em `src/tui/telas/`, registrada em
   `src/tui/telas/index.ts`. A ordem da lista é a ordem das abas.
2. Nenhuma cor literal nas telas. Use `ctx.tema.*`. Cor nova entra em
   `src/tui/tema.ts`, nas duas paletas, com nome de papel.
3. Use os componentes de `src/tui/componentes.ts`. Se precisar de um novo,
   crie lá, com tema como parâmetro, e documente no cabeçalho do arquivo.
4. Painéis vizinhos não têm gap. Padding interno de uma célula. Bordas
   `rounded` com título na borda. Acento só no painel em foco.
5. Teclas da tela vão em `teclas` (para a barra inferior) e em `aoTecla`.
   Não capture `q`, `Esc`, `Tab`, `?` nem dígitos, que são globais.
6. Timers e assinaturas começam em `aoEntrar` e terminam em `aoSair`.
7. A TUI nunca escreve em stdout com `console.log`. Use `renderer.console`
   do OpenTUI quando precisar depurar.
8. `renderer.destroy()` fica a cargo de `montarTui`. A tela chama
   `ctx.sair()` quando precisar encerrar.

## Passos

1. Rode `git status --short`.
2. Copie `template/tela/exemplo.ts` para `src/tui/telas/<id>.ts` e ajuste os
   imports.
3. Monte o conteúdo com `painel`, `tabelaChaveValor`, `lista`, `titulo` e
   `sutil`. Dados vêm de funções de `src/config/` ou de coletores já usados
   pelo CLI (como `dadosAbout`), nunca de chamadas duplicadas.
4. Registre a tela. Se ela puder ser aba inicial, acrescente o `id` em
   `tui.abaInicial` (`src/config/settings.ts`) e em `--aba`
   (`src/cli/comandos/tui.ts`).
5. Escreva o teste em `tests/tui.test.ts` ou em arquivo próprio com
   `createTestRenderer` e `captureCharFrame`.
6. Rode `bun run validar`.
7. Atualize `docs/tui.md` com a aba nova e suas teclas.

## Marcos

Tela registrada e visível no frame de teste; teclas da tela na barra; testes
verdes; documentação ajustada.

## Saída

Liste arquivos, cole o frame capturado da tela nova (texto) e informe os
comandos de validação executados.

## Compatibilidade

Starter kit 0.1.x. Caminhos citados: `src/tui/index.ts`, `src/tui/tela.ts`,
`src/tui/componentes.ts`, `src/tui/tema.ts`, `src/tui/telas/`,
`template/tela/exemplo.ts`, `tests/tui.test.ts` e `docs/tui.md`.
