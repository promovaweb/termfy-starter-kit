# TUI

A interface de terminal abre com `{{bin}}` sem argumentos ou com
`{{bin}} tui`. Ela exige stdin e stdout em um TTY; fora disso o processo
encerra com código 8.

## Abas

| Aba | Conteúdo |
| --- | --- |
| Overview | Ambiente (binário, runtime, plataforma, terminal, pasta de dados), estado de settings.json e do cofre, configuração em vigor e próximos passos. |
| About | Binário, projeto, licença, créditos e padrões seguidos. |

A aba inicial vem de `tui.abaInicial` em settings.json ou de `--aba`.

## Teclas

| Tecla | Ação |
| --- | --- |
| `←` `→` `[` `]` | aba anterior ou seguinte |
| `Tab` | próxima aba |
| `1` … `9` | ir para a aba de mesmo número |
| `?` | mostrar ou esconder a ajuda de teclas |
| `q` `Esc` `Ctrl+C` | sair |

Cada tela pode declarar teclas próprias em `teclas` e tratá-las em
`aoTecla`. Elas aparecem na barra inferior antes das teclas globais.

## Tema

Duas paletas em `src/tui/tema.ts`: `noite` (padrão) e `dia`. A escolha vem de
`tui.tema`. As cores têm nomes de papel (`acento`, `textoSutil`, `borda`), não
de matiz, para que uma troca de paleta não exija tocar nas telas.

Princípios do visual, no estilo modern unix:

- bordas arredondadas com título na própria borda;
- rótulos apagados à esquerda e valores em cor plena à direita;
- uma cor de acento para o que está ativo, uma secundária para links e
  origens externas; verde, âmbar e vermelho só para estado;
- barra de status com teclas em blocos invertidos;
- sem espaços vazios entre painéis vizinhos; padding interno de uma célula;
- nada pisca, nada rola sozinho.

## Como criar uma tela

1. Copie `template/tela/exemplo.ts` para `src/tui/telas/<id>.ts`.
2. Preencha `id`, `titulo`, `descricao` e `montar(ctx)`. Use os componentes de
   `src/tui/componentes.ts` (`painel`, `tabelaChaveValor`, `lista`, `titulo`,
   `sutil`) e as cores de `ctx.tema`.
3. Se a tela precisar de atualização periódica, inicie o timer em `aoEntrar` e
   limpe em `aoSair`.
4. Registre em `src/tui/telas/index.ts`. A ordem da lista é a ordem das abas.
5. Se o `id` for uma opção válida de aba inicial, acrescente-o em
   `tui.abaInicial` (`src/config/settings.ts`) e em `--aba`
   (`src/cli/comandos/tui.ts`).

A TUI roda sobre o OpenTUI (`@opentui/core`). Use `BoxRenderable`,
`TextRenderable`, `TabSelectRenderable`, `ScrollBoxRenderable` e os demais
renderables do pacote. Sempre devolva o terminal com `renderer.destroy()`;
`iniciarTui()` já cuida disso para `q`, `Esc` e `Ctrl+C`.
