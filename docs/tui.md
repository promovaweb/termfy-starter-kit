# TUI

A interface de terminal abre com `{{bin}}` sem argumentos ou com
`{{bin}} tui`. Ela exige stdin e stdout em um TTY; fora disso o processo
encerra com exit code 8.

## Abas

| Aba | Conteúdo |
| --- | --- |
| Overview | Environment (binary, runtime, platform, terminal, data directory), estado de settings.json e do cofre, settings em vigor e next steps. |
| About | Binary, project, license, credits e standards seguidos. |

A aba inicial vem de `tui.initialTab` em settings.json ou de `--tab`.

## Teclas

| Tecla | Ação |
| --- | --- |
| `←` `→` `[` `]` | aba anterior ou seguinte |
| `Tab` | próxima aba |
| `1` … `9` | ir para a aba de mesmo número |
| `?` | mostrar ou esconder o help de teclas |
| `q` `Esc` `Ctrl+C` | sair |

Cada screen pode declarar teclas próprias em `keys` e tratá-las em `onKey`.
Elas aparecem na barra inferior antes das teclas globais.

## Tema

Três paletas em `src/tui/theme.ts`: `terminal` (padrão), `night` e `day`.
A escolha vem de `tui.theme`. As cores têm nomes de papel (`accent`,
`textDim`, `border`), não de matiz, para que uma troca de paleta não exija
alterar as screens.

### terminal

O tema `terminal` herda as cores do tema do terminal (Ghostty, Alacritty,
Kitty, Omarchy, Termius, Herdr e outros). Cada cor da TUI é uma referência à
paleta do terminal (as 16 cores ANSI) ou ao texto e fundo padrão, sem
RGB fixo. O terminal pinta com o tema dele, então trocar o tema do terminal
muda a TUI na hora. O fundo é o fundo padrão do terminal, então a
transparência e o blur do terminal continuam.

Ao abrir, a TUI pergunta a paleta ao terminal (OSC 4, 10 e 11) com espera
curta de 300 ms. Com resposta, ela escolhe qual cor da paleta ocupa cada
papel: texto apagado legível sobre o fundo (alguns temas, como o Solarized
Dark, pintam o preto brilhante igual ao fundo), sombra da seleção, acento
com contraste (troca entre a cor normal e a brilhante) e o texto da barra de
teclas. Sem resposta, usa o mapeamento padrão. A escolha do slot vale até a
próxima abertura. As cores em si acompanham o terminal com a TUI aberta.

Mapeamento padrão:

| Papel | Slot |
| --- | --- |
| `background`, `surface`, `surfaceHigh` | fundo padrão do terminal |
| `text`, `textStrong` | texto padrão do terminal |
| `textDim`, `border`, `barText` | ANSI 8 (preto brilhante) |
| `barBackground` | fundo padrão do terminal |
| `accent`, `borderActive`, `keyBackground` | ANSI 4 (azul) |
| `accentSecondary` | ANSI 5 (magenta) |
| `ok` | ANSI 2 (verde) |
| `warn` | ANSI 3 (amarelo) |
| `error` | ANSI 1 (vermelho) |
| `keyText` | texto padrão do terminal |

`night` (Tokyo Night) e `day` (Tokyo Night Day) são paletas fixas em RGB,
iguais em qualquer terminal.

O acento do binário, nesse tema, é um slot ANSI em
`DEFAULT_TERMINAL_SLOTS` (`accent: ANSI.cyan`, por exemplo). Um hex ali
deixaria a TUI fora do tema do terminal.

Um token novo precisa existir nas três paletas. No `terminal`, ele aponta
para um slot ANSI ou para o texto ou fundo padrão do terminal. Os testes
visuais conferem `terminal`, `night` e `day`. Para testar a escolha dos
slots, passe uma paleta conhecida a `terminalTheme(colors)`, como faz
`tests/tui-theme.test.ts`.

Princípios do visual, no estilo modern unix:

- bordas arredondadas com título na própria borda;
- rótulos apagados à esquerda e valores em cor plena à direita;
- uma cor de accent para o que está ativo, uma secundária para links e
  origens externas; verde, âmbar e vermelho só para estado;
- barra de status com teclas em blocos invertidos;
- sem espaços vazios entre painéis vizinhos; padding interno de uma célula;
- nada pisca, nada rola sozinho.

## Como criar uma screen

1. Copie `template/screen/example.ts` para `src/tui/screens/<id>.ts`.
2. Preencha `id`, `title`, `description` e `mount(ctx)`. Use os componentes
   de `src/tui/components.ts` (`panel`, `keyValueTable`, `list`, `heading`,
   `dim`) e as cores de `ctx.theme`.
3. Se a screen precisar de atualização periódica, inicie o timer em
   `onEnter` e limpe em `onLeave`.
4. Registre em `src/tui/screens/index.ts`. A ordem da lista é a ordem das abas.
   O stub exporta a factory `createExampleScreen()`: registre o `Screen` que
   ela devolve, para que seleção e renderables fiquem por instância.
5. Se o `id` for uma opção válida de aba inicial, acrescente-o em
   `tui.initialTab` (`src/config/settings.ts`) e em `--tab`
   (`src/cli/commands/tui.ts`).

A TUI roda sobre o OpenTUI (`@opentui/core`). Use `BoxRenderable`,
`TextRenderable`, `TabSelectRenderable`, `ScrollBoxRenderable` e os demais
renderables do pacote. Toda saída devolve o terminal com
`renderer.destroy()`; `mountTui()` já cuida disso para `q`, `Esc` e
`Ctrl+C`.

## Testar sem terminal

`tests/tui.test.ts` monta a interface com `createTestRenderer` de
`@opentui/core/testing`, envia teclas com `mockInput.pressKey` e confere
o frame com `captureCharFrame`. `mountTui` aceita qualquer renderer;
`startTui` cria o renderer real.

## Lista com seleção

`listPanel(renderer, theme, { title, items, onSelect })` monta uma lista
com `ScrollBoxRenderable`. O item atual recebe `theme.surfaceHigh` no fundo
e `theme.accent` no texto. A rolagem acompanha o item selecionado.

| Retorno | Uso |
| --- | --- |
| `box` | Adicione ao layout; `handleKeyPress` trata up/down, j/k e Enter. |
| `move(delta)` | Move o destaque sem chamar `onSelect`; respeita os limites. |
| `selected()` | Retorna o índice atual, ou -1 para lista vazia. |
| `select(index)` | Destaca o índice e chama `onSelect(index)`. |

Na screen, trate up/k com `move(-1)`, down/j com `move(1)` e Enter com
`select(selected())` dentro de `onKey`. A tecla `r` pode voltar ao primeiro
item com `move(-selected())`. Declare essas teclas em `keys` para aparecerem
na barra inferior. O exemplo completo está em `template/screen/example.ts`.
Não encaminhe a mesma tecla pelo foco de `box` e por `onKey` simultaneamente.
