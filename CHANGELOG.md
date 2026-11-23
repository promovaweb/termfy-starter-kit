# Changelog

Formato baseado em Keep a Changelog. Versões seguem SemVer.

## [0.13.4] - 2026-11-23

- Passa a distribuir o starter kit sob a licença MIT, a regra dos templates da Promovaweb: o binário criado a partir dele pertence a quem o cria. O framework Termfy segue sob a GNU AGPL 3.0.

## [0.13.3] - 2026-11-23

- Passa a distribuir o projeto sob a GNU AGPL 3.0, com o arquivo `LICENSE` na raiz e o campo `license` em `AGPL-3.0-only`. O README deixa de descrever o repositório como privado.

## [0.13.2] - 2026-11-22

- Atualiza a identidade visual do projeto e sua apresentação no README.

## [0.13.1] - 2026-11-22

- Documenta a atualização das tarefas do ClickUp para pronto após o commit e publicado após o push.

## [0.13.0] - 2026-11-16

### Alterado

- Redesenho da TUI em cartões arejados: margem lateral, linha vazia entre
  cabeçalho, abas, conteúdo e barra, rótulo da seção em caixa alta acima de
  cada cartão e padding interno de duas colunas e uma linha.
- Abas com um traço `━` sob a aba ativa no lugar da régua e do fundo
  destacado.
- Barra de status sem fundo cheio, com a tecla em acento e a descrição
  apagada.
- Botões no formato `[c] copy MCP config`, inclusive nos diálogos.
- Overview com o cartão NEXT STEPS em duas colunas (comandos do terminal e
  configuração MCP para agentes). About em cartões próprios (BINARY,
  PROJECT, CREDITS), com caminhos e URLs cortados no meio.
- Docs com recuo nos itens de lista que quebram linha e sem título
  repetido.
- Barras de rolagem só quando o conteúdo passa da altura, em traço fino.

### Adicionado

- `src/tui/spacing.ts` com os tokens de espaçamento por faixa de layout,
  expostos em `ctx.space`.
- Skills do Termfy atualizadas para a 0.15.0.

## [0.12.1] - 2026-11-16

### Corrigido

- `table` alinha o cabeçalho e as células por coluna, trunca com "…" e
  fica num painel com título.
- A barra de baixo não sobrepõe mais itens em 80 colunas. `? help`,
  `q quit` e `^K commands` cabem inteiros em toda largura, e o status usa
  o espaço que sobra.
- Painéis não transbordam: conteúdo maior que o painel rola no componente
  novo `scrollPanel`, com barra discreta só quando precisa. About no
  compacto vira um painel rolável único.
- Textos cortados no Overview, no cofre (caminho abreviado no meio,
  preservando o nome do arquivo) e no About (URLs em linha própria).
- Docs junta as linhas quebradas da fonte em parágrafos e itens inteiros,
  com o documento num painel com o nome do tópico.
- About sem links duplicados. Créditos sem sobreposição em qualquer
  largura.
- No layout largo, os painéis dividem a largura por proporção.
- Plural de credenciais ("1 credential") e Settings sem "Accepted" para
  boolean.

### Adicionado

- `tests/tui-layout.test.ts`: cada aba em seis tamanhos, de 60×16 a
  200×60, conferindo barra inteira, bordas sem texto, largura do frame,
  textos-chave e ausência de segredo.
- Skills do Termfy atualizadas para a 0.14.1.

## [0.12.0] - 2026-11-16

### Adicionado

- Paleta de comandos (`Ctrl+K` ou `:`) com busca por nome nas ações de
  todas as abas, nas trocas de aba e nos comandos globais, por teclado e
  mouse.
- Diálogos modais `ctx.confirm` (com `danger`), `ctx.prompt` (com
  `secret`, `validate` e colar) e `ctx.choose`. Clique fora cancela.
- Toasts empilhados no canto inferior direito (`ctx.notify`) e texto de
  contexto da aba na barra de status (`ctx.status`).
- Layout responsivo: `ctx.layout()` devolve `wide`, `medium` ou `compact`.
  A tela é remontada quando a faixa muda. Abaixo de 60×16 aparece
  "Terminal too small".
- Foco entre painéis com `Tab` e `Shift+Tab`. Campos de texto recebem
  letras e números sem disparar ações.
- `Screen.watch()`: a aba recarrega quando outro processo altera um
  arquivo vigiado. `onPause` e `onResume` quando a janela do terminal perde
  ou ganha foco.
- Título da janela com a aba ativa, ponteiro de mão sobre o que é
  clicável (`src/tui/pointer.ts`), teclado Kitty e a setting `tui.motion`
  para as animações curtas.
- Abas novas: Settings (edita cada key do schema com o controle certo),
  Credentials (nomes do cofre, adicionar com valor secreto, trocar e
  remover com confirmação, sem mostrar valores) e Docs (documentação
  embutida em Markdown com índice clicável).
- Componentes `table` (ordena pelo cabeçalho, linhas clicáveis),
  `stateView`, `spinner`, `progressBar` e `link` (hyperlink OSC 8).
- About com logotipo em ASCII art no layout largo e links clicáveis.
- `src/tui/overlays.ts` com diálogos, paleta, help e toasts.
- Testes do shell, dos diálogos, da paleta, dos componentes e das abas
  novas, com 131 testes no total.

### Alterado

- `Tab` passa o foco entre painéis. A troca de aba fica com `←` `→`,
  `[` `]`, os números, o clique e a roda sobre as abas.
- O help virou modal, com linhas clicáveis.
- A barra mostra o status da aba, as ações que cabem, `? help`, `q quit` e
  `^K commands`. No layout compacto ficam só os comandos globais.
- `tui.initialTab` aceita `overview`, `settings`, `credentials`, `docs` e
  `about`.
- `template/screen/example.ts` segue o padrão lista e detalhe.
- `docs/tui.md`, `docs/configuration.md`, `docs/architecture.md` e o
  frame do `README.md` descrevem a interface nova.
- Skills do Termfy atualizadas para a 0.14.0.

## [0.11.0] - 2026-11-16

### Adicionado

- TUI operável por inteiro com teclado e com mouse. Toda interação tem
  tecla de atalho e um caminho de mouse que chama a mesma função.
- Abas numeradas com ícone (` 1 ⌂ Overview `). Clique abre a aba. A roda
  do mouse sobre a barra de abas troca de aba. `Shift+Tab` volta uma aba.
- `Screen.actions` com `ScreenAction { keys, label, description, icon, run }`.
  O shell roda a ação pela tecla, mostra na barra inferior e no help e roda
  no clique. `ScreenContext` ganhou `icons`, `refresh()` e `notify()`.
- Barra inferior clicável e mensagens curtas à direita por 4 segundos. Help
  com as ações da aba, as globais e o uso do mouse, com linhas clicáveis.
- `src/tui/icons.ts` com os conjuntos `nerd`, `unicode` e `ascii`, e as
  settings `tui.icons` (`auto` escolhe pelo terminal: Nerd Font no
  Ghostty, no Kitty, no WezTerm e no Omarchy) e `tui.mouse`.
- Componente `button`, ícone no título de `panel` e clique, hover e roda no
  `listPanel`.
- Ações `r` (recarregar) e `c` (copiar a configuração MCP por OSC 52) no
  Overview e `c` (copiar o link do repositório) no About, com botões.
- Testes de mouse, de teclado e de ícones (`tests/tui-mouse.test.ts`,
  `tests/tui-keys.test.ts`, `tests/tui-icons.test.ts`), com 104 testes no
  total.

### Alterado

- A barra de abas é própria e substitui o `TabSelectRenderable`.
- `Esc` fecha o help antes de sair da TUI.
- `template/screen/example.ts` declara os comandos em `actions`.
- `docs/tui.md`, `docs/configuration.md`, `docs/architecture.md` e o frame
  do `README.md` descrevem mouse, teclado, abas numeradas e ícones.
- Skills do Termfy atualizadas para a 0.13.0.

### Corrigido

- Rótulos de `keyValueRow` não encolhem mais em painéis estreitos
  ("Repositor" no lugar de "Repository").
- `Ctrl+C` não aciona mais a ação da tecla `c`.
- Uma tecla consumida pelo shell não chega duas vezes à lista em foco.
- Trocar de aba, recarregar, fechar o help e sair destroem os nós antigos e
  chamam `onLeave`.

## [0.10.0] - 2026-11-16

### Adicionado

- Tema `terminal` na TUI, novo padrão de `tui.theme`. Cada cor é uma
  referência à paleta ANSI do terminal ou ao texto e fundo padrão dele,
  sem RGB fixo. A TUI herda o tema do Ghostty, do Alacritty, do Kitty,
  do Omarchy, do Termius, do Herdr e de outros terminais. Trocar o tema do
  terminal muda a TUI na hora. O fundo padrão mantém a transparência e o
  blur do terminal.
- Consulta da paleta ao abrir (OSC 4, 10 e 11), com espera limitada a
  300 ms. Com resposta, `chooseTerminalSlots` escolhe o slot de cada papel
  pelo contraste real: texto apagado legível mesmo onde o preto brilhante é
  igual ao fundo (Solarized Dark), sombra da seleção, acento normal ou
  brilhante e texto da barra de teclas. Sem resposta, vale o mapeamento
  padrão.
- `DEFAULT_TERMINAL_SLOTS` e `ANSI` em `src/tui/theme.ts`: a marca escolhe
  o slot do acento (`accent: ANSI.cyan`, por exemplo) sem sair do tema do
  terminal.
- `tests/tui-theme.test.ts`, com paletas reais do Tokyo Night, do Solarized
  Dark e Light e do Gruvbox Dark, respostas incompletas, consulta que não
  responde e montagem da TUI com o tema `terminal`.

### Alterado

- `tui.theme` aceita `terminal`, `night` e `day`, com padrão `terminal`.
  `night` e `day` seguem como paletas fixas.
- Os tokens de `Theme` passam a ter o tipo `ColorInput` (string ou
  `RGBA`). `keyValueRow` e `keyValueTable` aceitam o mesmo tipo.
- `docs/tui.md`, `docs/configuration.md`, `docs/architecture.md`,
  `docs/cli.md`, `docs/customize-template.md` e o frame do `README.md`
  descrevem os três temas.
- Skills do Termfy atualizadas para a 0.12.0, que exige o tema `terminal`
  como padrão dos binários derivados.

## [0.9.4] - 2026-11-13

### Corrigido

- Workflows do CI e da release usam `actions/checkout@v5`, que roda no
  Node.js 24 e remove o aviso de Node.js 20 descontinuado.

## [0.9.3] - 2026-11-13

### Adicionado

- Nova identidade visual do Termfy Starter Kit, submarca do Termfy: ícone,
  logotipo e kit de marca em `brand/` (logos, favicons, paleta com acento
  lima, tokens, CSS, tema Tailwind, tipografia, relatório de contraste e
  guia visual).
- Logo no cabeçalho do `README.md` e a linha "Um projeto da Promovaweb".
- `.markdownlint.json` com o HTML do cabeçalho do README liberado.

### Alterado

- `README.md` e `docs/customize-template.md` explicam que `brand/` é a
  marca do template no GitHub e que o projeto derivado troca ou remove a
  pasta e o cabeçalho do README. A identidade do binário e a paleta da TUI
  não mudam.
- `docs/release.md` sem a linha em branco extra no fim.

## [0.9.2] - 2026-11-12

### Corrigido

- `init` num projeto novo: começa na versão 0.1.0, com `CHANGELOG.md`
  próprio, sem herdar a URL do repositório do template. As referências ao
  framework (skills `termfy-*`, `promovaweb/termfy*`, frases sobre o
  starter kit) deixam de ser renomeadas para o nome do binário.
- `init` num rename sem `--title` mantém o título atual.
- `skills:check` passa a ler a compatibilidade no formato que as skills
  usam ("Starter kit a partir da vX.Y.Z") e compara com a versão do kit
  de origem, gravada pelo `init` em `termfy.starterKit`.
- A ajuda de `config` e `credentials` mostra a pasta real
  (`~/.<bin>/`), sem o marcador literal.
- A mensagem de credencial ausente traz o comando completo, com o nome do
  binário.
- `docs/release.md` envia só a tag da versão, sem `--tags`.
- `docs/customize-template.md`: o primeiro commit fica com a pessoa.

### Alterado

- `template/screen/example.ts` exporta a factory `createExampleScreen()`,
  com estado por instância.
- A ajuda do command `mcp` remete a `mcp --list` em vez de listar as
  tools à mão.
- Testes de config restauram as variáveis de ambiente; o teste MCP usa
  `stderr: "pipe"`.
- Skills do Termfy 0.10.0.

### Adicionado

- `tests/init.test.ts`: identidade nova, versão 0.1.0, referências ao
  framework preservadas e rename sem `--title`.

## [0.9.1] - 2026-11-11

### Removido

- `docs/tui-overview.txt`, frame antigo da TUI (v0.3.0) que nada
  referenciava.

### Adicionado

- Teste que garante que o template registra só os commands do esqueleto.

### Alterado

- Skills do Termfy 0.9.3: o primeiro `CLISPEC.md` registra em Surface o
  que o esqueleto já entrega.

## [0.9.0] - 2026-11-11

### Removido

- Subsistema de specs do binário: o command `spec` e seus subcommands, as
  tools MCP `spec` e `specs`, a aba Specs da TUI, `src/spec/`,
  `bun run spec:check`, `scripts/check-spec.ts` e
  `scripts/credential-calls.ts`. O esqueleto volta a ter só o que demonstra
  os três modos.
- `CLISPEC.md`, `specs/0001` a `0005` e `docs/spec.md`. As specs passam a
  ser Markdown puro, criadas pelas skills `termfy-clispec` e `termfy-spec`
  no projeto derivado.
- Valor `specs` de `tui.initialTab` e de `tui --tab`.
- Saídas antigas de ebook versionadas em `.ebook/build/`.

### Alterado

- `bun run init` não reescreve mais o `CLISPEC.md` nem apaga specs.
- Skills do framework atualizadas para o Termfy 0.9.0, com specs em
  Markdown puro.

## [0.8.2] - 2026-11-11

### Corrigido

- `bun run build` falhava depois de um `bun install` comum com Bun 1.4.4 e
  OpenTUI 0.8.4, porque o bundler tentava resolver os pacotes nativos de
  todas as plataformas, inclusive os `-musl`. `scripts/build.ts` marca como
  externos os que não estão instalados; `build:all` avisa quando falta o
  pacote de um alvo.
- A release instala os pacotes nativos com `--libc="*"`, que o Bun 1.4
  exige para os `-musl`.

## [0.8.1] - 2026-11-11

### Alterado

- Bun 1.4.4 como mínimo (`engines` e `doctor`), `@opentui/core` 0.8.4,
  `@types/bun` 1.4.4 e TypeScript 7.
- O scanner de `getCredential` do `spec:check` usa um tokenizador próprio
  (`scripts/credential-calls.ts`), porque o TypeScript 7 não traz a API
  JavaScript do compilador.

### Corrigido

- A release instalava o `@opentui/core` mais recente, e não o do lockfile,
  para compilar os outros alvos; a 0.8.0 falhou quando saiu a 0.8.4. O
  workflow passa a usar `bun install --frozen-lockfile --os="*" --cpu="*"`.
- `specs/0005` registra a manutenção.

## [0.8.0] - 2026-11-10

### Adicionado

- Contrato CLISPEC 2.0.0 com dois documentos: `CLISPEC.md`, único, com a
  visão macro (identidade, superfície entregue e índice `specs`), e
  `specs/NNNN-slug.md`, uma spec por evolução, com `changes`
  (`add`, `update`, `remove`) e as seções Goal, Behavior, Design, Tasks,
  Tests e Notes.
- `spec list`, `spec new <slug>`, `spec close <id>` e `spec migrate`;
  `spec show` e `spec progress` aceitam o ID de uma spec.
- `spec close` incorpora as mudanças ao `CLISPEC.md` e recusa, sem gravar,
  spec sem Behavior ou Design, com item pendente, com conflito de `changes`
  ou que deixe o `CLISPEC.md` divergente do código.
- `spec check` cruza as specs com o `CLISPEC.md` e relata em `pending` o
  que uma spec aberta já explica.
- Tool MCP `specs`, para listar e ler as specs.
- Edição de specs pelo binário: `spec start`, `spec block --reason`,
  `spec archive --reason`, `spec task add [--tag <skill>]`, `spec test add` e
  `spec done [--undo]`, com `{#id}` gerado e índice mantido.
- `storage.tables` no `CLISPEC.md` e em `changes`: tabelas e colunas do
  banco SQLite opcional, conferidas por `spec check` contra o schema que as
  migrations de `src/db/migrations/` criam.
- Rastreabilidade: `spec check` avisa entrada de `changes` de uma spec em
  andamento que nenhuma tarefa ou teste cita.
- `spec close` registra a data do fechamento em `## Notes` do `CLISPEC.md`.
- `spec sync --write --spec <id>` adota código existente pelo `changes.add`
  de uma spec aberta.
- Aba Specs na TUI (tecla 2), com lista, detalhe e resumo do `CLISPEC.md`;
  `tui --tab specs` e `tui.initialTab: specs`.
- Stubs opcionais de SQLite em `template/db/`: banco em `~/.<bin>/data.db`,
  uma migration por arquivo embutida no binário, backup em
  `data.db.v<versão>.bak` antes de migrar, repositório, command
  `db status|migrate` e teste com banco em memória. O esqueleto continua sem
  banco.
- `specs/0001` a `specs/0004` registram o esqueleto, esta mudança de
  contrato, os stubs de banco e as ferramentas de spec.
- `skills:check` exige as dezoito skills do framework 0.8.0 e recusa skills
  `termfy-*` que ele não tem mais. Novas:
  `termfy` (porta de entrada, antes `termfy-build`), `termfy-clispec` e
  `termfy-database`.

### Alterado

- `CLISPEC.md` do esqueleto migrado para 2.0.0; a checklist foi para
  `specs/0001-baseline.md`.
- A tool `spec` devolve `{ frontmatter, sections }`, sem progresso.
- `bun run init` atualiza identidade e URIs de resources no `CLISPEC.md` e,
  ao partir do template, limpa o índice e remove as specs do esqueleto.
- Exemplos de `spec sync` no `--help` passam a citar o nome do binário.

### Migração

- Projetos derivados rodam `bun run dev -- spec migrate` para ver o plano e
  `--write` para converter. Até lá, o binário lê o 1.0.0 com aviso.

## [0.7.0] - 2026-11-10

### Adicionado

- `spec sync [--write] [--file <path>]`: lista o que o código tem e a spec
  não (commands com arguments, options, exit codes e exemplo; screens;
  tools, resources e prompts; settings) e, com `--write`, acrescenta ao
  front matter como rascunho, preservando entradas e corpo. Emissor YAML em
  estilo de blocos (`src/spec/yaml.ts`) que omite arrays vazios.
- `spec check` passa a exigir que credenciais citadas em commands estejam
  declaradas em `credentials` e avisa item de checklist sem tag de skill.
- `skills:check` exige as dezesseis skills do framework 0.7.0.

### Alterado

- `screens`, `mcp`, `settings` e `credentials` do front matter passam a ser
  opcionais (listas vazias por padrão); `CLISPEC.md` do esqueleto
  compactado por `spec sync --write`.
- `AGENTS.md` aponta `termfy-build` como porta de entrada para pedidos em
  linguagem natural.

## [0.6.1] - 2026-11-10

### Corrigido

- A 0.6.0 saiu sem a skill `termfy-brand` instalada (o instalador pulava a
  skill por um frontmatter inválido no framework 0.6.1) e com `skills:check`
  falhando. Skills do framework 0.6.2 instaladas, oito no total, e
  `validate` verde.

## [0.6.0] - 2026-11-10

### Adicionado

- `scripts/check-docs.ts` e o script `docs:check`, em `validate`: todo
  command, screen, tool, resource, prompt, key de configuração e exit code
  do código precisa aparecer em `docs/`.
- `skills:check` passa a exigir as oito skills do framework, incluindo
  `termfy-brand` e `termfy-docs`.

## [0.5.1] - 2026-11-10

### Corrigido

- Spec: checklist malformada deixa de ser ignorada, options recursivas dos
  commands pais são aceitas no cruzamento, campos obrigatórios só com
  espaços são rejeitados, `spec show` em texto vira um resumo legível (o
  `--json` continua completo) e `docs/spec.md` documenta erros, avisos,
  formatos e exit codes.
- Completion: zsh passa a usar `compdef` e `compadd` nativos; bash e zsh
  conferidos em execução.
- `credentials rotate-key`: rollback atômico da chave quando a recifragem
  falha, com cópia preservada se o rollback também falhar; `--from-env`
  exige 64 hex.
- `doctor`: avisos de TTY fora de terminal não contam como falha; exit
  codes 0 e 3 conferidos.
- `listPanel`: rolagem acompanha a seleção; `j` e `k` sem conflito com as
  teclas globais.
- Testes: 112 (1 pulado quando `fish` não está instalado).

## [0.5.0] - 2026-11-10

### Adicionado

- Contrato estruturado do `CLISPEC.md` (`docs/spec.md`): front matter
  validado por schema Zod (`src/spec/schema.ts`), seções `Purpose`,
  `Audiences`, `Out of scope`, `Checklist` e `Notes`, checklist com `{#id}`.
  Command `spec show|check|progress` (`spec check --strict` trata avisos
  como erros), tool MCP `spec`, script `spec:check` em `validate` que ainda
  confere `getCredential()` contra a spec, e `CLISPEC.md` do esqueleto
  reescrito no contrato.
- Command `doctor` e tool MCP `doctor`: Bun, TTY, pasta de dados, settings,
  master key, cofre, versão e plataforma, com exit code 3 em falha.
- Command `completion bash|zsh|fish`, gerado do registry
  (`src/cli/completion.ts`).
- Subcommand `credentials rotate-key [--from-env]` (`rotateMasterKey` em
  `src/config/crypto.ts`).
- Componente `listPanel` em `src/tui/components.ts` (lista com rolagem,
  seleção e navegação por teclado); `template/screen/example.ts` o usa.
- Topic `reference` no `--skill`: só a referência gerada do registry.
- `scripts/check-skills.ts` avisa quando a faixa de compatibilidade das
  skills instaladas difere da versão do projeto.
- Testes: 90 no total (`spec`, `doctor`, `completion`, `rotate-key`,
  `tui-list`, `reference`).

## [0.4.0] - 2026-11-10

### Removido

- Pipeline de ebook (`.ebook/`, `ebook/`, `docs/reading-order.txt`, scripts
  `ebook` e `ebook:verify`, dependências `@fontsource/*`, passos nos
  workflows). O ebook é do framework `promovaweb/termfy`; o starter kit
  entrega a documentação embutida por `--skill` e o `docs/opencli.json`.

## [0.3.2] - 2026-11-10

### Corrigido

- Ebook do guia do usuário avança para a edição 0.2.1, com o nome
  `termfy-init` em `docs/customize-template.md`; a 0.3.1 tinha regenerado a
  edição 0.2.0 com conteúdo novo sem avançar `ebook/VERSION`.

## [0.3.1] - 2026-11-10

### Alterado

- Skills do framework 0.4.0: `termfy-iniciar` substituída por `termfy-init`
  em `.agents/skills/`, `skills-lock.json`, `scripts/check-skills.ts`,
  `AGENTS.md`, `README.md` e `docs/customize-template.md`.

## [0.3.0] - 2026-11-10

### Alterado

- Todo o código passa a ser em inglês: arquivos (`src/app/manifest.ts`,
  `src/app/exit-codes.ts`, `src/app/errors.ts`, `src/cli/registry.ts`,
  `src/cli/help.ts`, `src/cli/format.ts`, `src/cli/input.ts`,
  `src/cli/commands/`, `src/config/paths.ts`, `src/config/crypto.ts`,
  `src/config/credentials.ts`, `src/mcp/server.ts`, `src/tui/theme.ts`,
  `src/tui/screen.ts`, `src/tui/components.ts`, `src/tui/screens/`),
  identificadores, comentários e mensagens do binário.
- Interface pública em inglês: option `--tab` (antes `--aba`), nomes de
  arguments (`key`, `value`, `name`, `topic`), topic `exit-codes` (antes
  `codigos`), keys `output.format`, `output.colors`, `tui.initialTab`,
  `tui.theme` (valores `night` e `day`) e `telemetry.enabled`; envelope
  `--json` com `command`, `data` e `error { code, name, message, details }`;
  nomes de exit codes `SUCCESS`, `GENERIC_ERROR`, `USAGE`, `CONFIG`,
  `CREDENTIALS`, `NETWORK_OR_API`, `NOT_FOUND`, `PERMISSION`, `NO_TTY`, `MCP`
  e `INTERRUPTED`; campos de `data` e do catalog MCP em inglês; tool `skill`
  com `topic`, tool `config_get` com `key`, resource `skill/{topic}`, prompt
  `operate` com `task`. O alias `sobre` de `about` foi removido.
- Scripts do `package.json` em inglês: `init`, `validate`, `build:all`,
  `skills:install`, `skills:update`, `skills:check`, `opencli:check`;
  stubs em `template/command/`, `template/screen/` e `template/tool/`; docs
  renomeadas para `configuration.md`, `exit-codes.md`, `architecture.md` e
  `customize-template.md`; ebook `<Title>-User-Guide-v<version>`.
- Workflows, docs, README e AGENTS.md atualizados para os novos nomes.

### Adicionado

- `CLISPEC.md`: especificação do binário montada com a skill `termfy-spec`,
  lida pelas demais skills antes de implementar.

## [0.2.0] - 2026-11-10

### Adicionado

- Guia do usuário em PDF e EPUB em `ebook/`, gerado por `bun run ebook` a
  partir da mesma `docs/` embutida no binário, com os placeholders
  `{{bin}}`, `{{titulo}}`, `{{versao}}` e `{{BIN}}` resolvidos pelo
  manifesto. Saída `<Titulo>-Guia-do-Usuario-v<versão>.{pdf,epub}`, aliases
  `ebook-<bin>.*`, `ebook/VERSION` e `ebook/build.json`, com o design system
  de PDF da Promovaweb (`pdf-design-system: 1.0.0`).
- `bun run ebook:verify` entra em `bun run validar`; CI e release instalam
  as ferramentas de conferência e a release anexa o PDF e o EPUB.
- `docs/reading-order.txt` define a ordem dos capítulos.

### Alterado

- `docs/release.md`, `docs/personalizar-template.md`, `docs/arquitetura.md`,
  `README.md`, `AGENTS.md` e o aviso final de `bun run iniciar` orientam a
  regenerar o ebook depois do bootstrap e sempre que `docs/` mudar.

## [0.1.0] - 2026-11-10

### Adicionado

- Esqueleto do binário em Bun com três modos: TUI sem argumentos, CLI com
  argumentos e servidor MCP via stdio (`termfy mcp`), separado do framework
  `promovaweb/termfy` 0.1.0.
- CLI com registro declarativo de comandos, parser próprio, `--help` gerado,
  `--version`, `--json` com envelope estável, `--skill [topico]` com a
  documentação embutida, `--opencli` (OpenCLI 0.1) e `--no-color`.
- Comandos `tui`, `about`, `config`, `credentials`, `mcp [--list]` e `skill`.
- Códigos de saída fixos em `src/app/saida.ts`.
- Pasta `~/.<bin>/` com `settings.json`, `credentials.json` (AES-256-GCM) e
  `master.key` (0600), com `<BIN>_HOME` e `<BIN>_MASTER_KEY`.
- TUI sobre `@opentui/core` 0.8.3 com abas Overview e About e tema modern
  unix em duas paletas.
- Servidor MCP com `@modelcontextprotocol/sdk` 1.32: seis tools, quatro
  resources e um prompt.
- Skills `termfy-*` instaladas em `.agents/skills/` via `npx skills add`,
  com `skills-lock.json`, e scripts `skills:instalar`, `skills:update` e
  `skills:check`.
- Documentação em `docs/`, stubs em `template/`, 37 testes com `bun test` e
  workflows de CI e release.
