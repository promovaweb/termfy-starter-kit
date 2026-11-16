# TUI

A interface de terminal abre com `{{bin}}` sem argumentos ou com
`{{bin}} tui`. Ela exige stdin e stdout em um TTY; fora disso o processo
encerra com exit code 8.

## Abas

| Aba | Ícone | Conteúdo |
| --- | --- | --- |
| Overview | `overview` | Environment (binary, runtime, platform, terminal, data directory), estado de settings.json e do cofre, settings em vigor e next steps. |
| About | `about` | Binary, project, license, credits e standards seguidos. |

Cada aba mostra o número e o ícone do papel: ` 1 ⌂ Overview ` e
` 2 ℹ About `. O clique abre a aba. A roda do mouse sobre a barra de abas
troca de aba. A aba inicial vem de `tui.initialTab` em settings.json ou de
`--tab`.

## Teclas

| Tecla | Ação |
| --- | --- |
| `←` `→` `[` `]` | aba anterior ou seguinte |
| `Tab` `Shift+Tab` | próxima aba ou aba anterior |
| `1` … `9` | ir para a aba de mesmo número |
| `?` | mostrar ou esconder o help de teclas |
| `Esc` | fechar o help; com o help fechado, sair |
| `q` `Ctrl+C` | sair |

Cada screen declara os próprios comandos em `actions`. O shell executa a
ação pela tecla, mostra na barra inferior, mostra no help e executa no
clique. As ações da tela aparecem antes das globais.

`keys` mais `onKey` continuam aceitos em telas escritas antes de `actions`.
A entrada de `keys` aparece na barra inferior como legenda e não cria
handler.

## Mouse

A TUI responde ao mouse com `tui.mouse` em `true`, o padrão. O clique numa
aba abre a aba, numa linha da lista seleciona e ativa o item, num botão ou
num item da barra inferior roda a mesma ação da tecla. Numa linha do help,
roda o comando. A roda rola a lista e troca de aba sobre a barra de abas.
O item sob o ponteiro recebe destaque.

Com o mouse ligado, a maioria dos terminais deixa de selecionar texto por
arrastar. Use `Shift` e arraste para selecionar. Com `tui.mouse` em `false`,
o terminal volta a selecionar com o mouse e a TUI fica só com o teclado.

## Ícones

`src/tui/icons.ts` guarda três conjuntos com os mesmos nomes de papel:
`nerd` (Nerd Font), `unicode` e `ascii`. Os papéis seguem o significado
(`overview`, `about`, `settings`, `terminal`, `copy`, `refresh`, `ok`,
`warn`, `error` e outros), não o desenho.

`tui.icons` escolhe o conjunto. `auto` (padrão) usa `nerd` no Ghostty, no
Kitty, no WezTerm e no Omarchy (`OMARCHY_PATH` ou a pasta
`~/.local/share/omarchy`), `ascii` no console Linux (`TERM=linux` ou
`dumb`) e `unicode` nos demais terminais.

A screen lê os ícones de `ctx.icons` e monta o texto com `withIcon()`.
Nenhum glifo fixo fica no código da screen.

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
2. Preencha `id`, `title`, `icon`, `description` e `mount(ctx)`. Use os
   componentes de `src/tui/components.ts` (`panel`, `keyValueTable`, `list`,
   `heading`, `dim`) e as cores de `ctx.theme`. Os ícones vêm de `ctx.icons`.
3. Declare os comandos em `actions`. Cada entrada tem `keys`, `description`,
   `icon` e `run`. O shell roda a ação pela tecla, mostra na barra inferior,
   mostra no help e roda no clique.

   ```ts
   const actions: ScreenAction[] = [
     {
       keys: ["r"],
       description: "reload",
       icon: "refresh",
       run: (ctx) => {
         ctx.refresh();
         ctx.notify("Reloaded", "ok");
       },
     },
   ];
   ```

4. Monte os elementos clicáveis com `button({ key, label, icon, onPress })`
   e com `listPanel`. Os dois chamam a mesma função de uma ação, então tecla
   e clique fazem o mesmo.
5. Use `ctx.notify(message, tone)` para a mensagem curta à direita da barra
   inferior, que some em 4 segundos. Use `ctx.refresh()` para remontar a tela.
6. Se a screen precisar de atualização periódica, inicie o timer em
   `onEnter` e limpe em `onLeave`.
7. Registre em `src/tui/screens/index.ts`. A ordem da lista é a ordem das abas.
   O stub exporta a factory `createExampleScreen()`: registre o `Screen` que
   ela devolve, para que seleção e renderables fiquem por instância.
8. Se o `id` for uma opção válida de aba inicial, acrescente-o em
   `tui.initialTab` (`src/config/settings.ts`) e em `--tab`
   (`src/cli/commands/tui.ts`).

A TUI roda sobre o OpenTUI (`@opentui/core`). Use `BoxRenderable`,
`TextRenderable`, `ScrollBoxRenderable` e os demais
renderables do pacote. Toda saída devolve o terminal com
`renderer.destroy()`; `mountTui()` já cuida disso para `q`, `Esc` e
`Ctrl+C`.

## Testar sem terminal

`tests/tui.test.ts` monta a interface com `createTestRenderer` de
`@opentui/core/testing`, envia teclas com `mockInput.pressKey` e confere
o frame com `captureCharFrame`. `setup.mockMouse` envia clique, hover e
roda, para conferir o caminho de mouse da mesma ação. `mountTui` aceita
qualquer renderer; `startTui` cria o renderer real.

## Lista com seleção

`listPanel(renderer, theme, { title, items, onSelect })` monta uma lista
com `ScrollBoxRenderable`. O item atual recebe `theme.surfaceHigh` no fundo
e `theme.accent` no texto. A rolagem acompanha o item selecionado. Um
clique numa linha seleciona e ativa o item, o hover destaca a linha sob o
ponteiro e a roda rola a lista.

| Retorno | Uso |
| --- | --- |
| `box` | Adicione ao layout; `handleKeyPress` trata up/down, j/k e Enter. |
| `move(delta)` | Move o destaque sem chamar `onSelect`; respeita os limites. |
| `selected()` | Retorna o índice atual, ou -1 para lista vazia. |
| `select(index)` | Destaca o índice e chama `onSelect(index)`. |

Na screen, trate up/k com `move(-1)`, down/j com `move(1)` e Enter com
`select(selected())` dentro de `onKey`. A tecla `r` pode voltar ao primeiro
item com `move(-selected())`. Declare esses comandos em `actions` para
aparecerem na barra inferior e no help. O exemplo completo está em
`template/screen/example.ts`.
Não encaminhe a mesma tecla pelo foco de `box` e por `onKey` simultaneamente.
