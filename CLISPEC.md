---
schemaVersion: 2.0.0
bin: termfy
title: Termfy
description: CLI, TUI and MCP stdio server skeleton in Bun, with the Termfy framework skills installed.
createdAt: "2026-11-10T12:00:00.000Z"
updatedAt: "2026-11-11T01:57:50.480Z"
commands:
  - path: tui
    description: Open the terminal interface (Overview and About). Requires a TTY.
    options:
      - name: "--tab"
        argument: tab
        values:
          - overview
          - specs
          - about
        description: Initial tab. Overrides tui.initialTab from settings.json.
    data: "{ closed }"
    exitCodes:
      - 8
    interactive: true
    example: termfy
  - path: about
    description: Mostra versão, executável, runtime, plataforma e créditos.
    data: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
    example: termfy about
  - path: config
    description: Lê e grava preferências em ~/.<bin>/settings.json.
    data: "{ help } com --help"
    exitCodes:
      - 3
      - 7
      - 6
    example: termfy config --help
  - path: config list
    description: Lista cada key com o valor do arquivo combinado ao padrão.
    data: "{ file, exists, values }"
    exitCodes:
      - 3
      - 7
      - 6
    example: termfy config list
  - path: config get
    description: Mostra o valor de uma key.
    arguments:
      - name: key
        required: true
    data: "{ key, value }"
    exitCodes:
      - 3
      - 7
      - 6
    example: termfy config get tui.initialTab
  - path: config set
    description: Grava um valor em settings.json com o tipo definido pelo schema.
    arguments:
      - name: key
        required: true
      - name: value
        required: true
    data: "{ key, value, file, unknownKey }"
    exitCodes:
      - 3
      - 7
      - 6
    example: termfy config set output.format json
  - path: config unset
    description: Remove uma key do arquivo e restaura seu padrão, se houver.
    arguments:
      - name: key
        required: true
    data: "{ key, removed }"
    exitCodes:
      - 3
      - 7
      - 6
    example: termfy config unset telemetry.enabled
  - path: config path
    description: Mostra a pasta de dados e os caminhos dos arquivos.
    data: "{ base, settings, credentials, masterKey }"
    example: termfy config path
  - path: config schema
    description: Lista as keys conhecidas com tipo, padrão e descrição.
    data: "{ keys[] }"
    example: termfy config schema --json
  - path: credentials
    description: Armazena segredos cifrados com AES-256-GCM em ~/.<bin>/credentials.json.
    data: "{ help } com --help"
    exitCodes:
      - 4
      - 7
      - 130
    example: termfy credentials --help
  - path: credentials set
    description: Salva ou substitui uma credencial, lida sem eco ou pelo stdin.
    arguments:
      - name: name
        required: true
    options:
      - name: "--stdin"
        description: Lê o valor da primeira linha do stdin, inclusive no terminal interativo.
    data: "{ name, file, saved }"
    exitCodes:
      - 4
      - 7
      - 130
    interactive: true
    example: termfy credentials set openai.api_key
  - path: credentials get
    description: Mostra uma credencial mascarada; --reveal exibe o valor completo.
    arguments:
      - name: name
        required: true
    options:
      - name: "--reveal"
        description: Exibe o valor em texto claro; no --json, o campo passa a ser value.
    data: "{ name, masked, length } ou { name, value } com --reveal"
    exitCodes:
      - 4
      - 7
      - 130
    example: termfy credentials get openai.api_key
  - path: credentials list
    description: Lista os nomes salvos, sem mostrar valores.
    data: "{ count, names[] }"
    exitCodes:
      - 4
      - 7
      - 130
    example: termfy credentials list --json
  - path: credentials remove
    description: Remove uma credencial do cofre.
    arguments:
      - name: name
        required: true
    data: "{ name, removed }"
    exitCodes:
      - 4
      - 7
      - 130
    example: termfy credentials remove github.token
  - path: credentials status
    description: Mostra arquivo, origem da master key e quantidade de credenciais.
    data: "{ file, exists, masterKeySource, count, names[], masterKeyVariable, algorithm }"
    example: termfy credentials status
  - path: credentials clear
    description: Apaga credentials.json, preserva master.key e pede confirmação no terminal.
    options:
      - name: "--yes"
        description: Dispensa a confirmação.
    data: "{ file, deleted }"
    exitCodes:
      - 4
      - 7
      - 130
    interactive: true
    example: termfy credentials clear --yes
  - path: credentials rotate-key
    description: Cifra novamente o cofre com uma nova master key e grava master.key com permissão 0600.
    options:
      - name: "--from-env"
        description: Usa TERMFY_MASTER_KEY, com 64 caracteres hexadecimais, como nova chave; lê a chave atual de master.key.
    data: "{ rotated, source }"
    exitCodes:
      - 4
      - 7
      - 130
    example: termfy credentials rotate-key --help
  - path: mcp
    description: Inicia o servidor MCP via stdio com tools, resources e prompts para agentes.
    options:
      - name: "--list"
        description: Lista tools, resources e prompts registrados e encerra sem iniciar o servidor.
    data: "{ name, version, tools[], resources[], prompts[] } com --list; { closed } após encerrar"
    exitCodes:
      - 9
    example: termfy mcp
  - path: skill
    description: Imprime a documentação embutida, completa ou por topic, como --skill.
    arguments:
      - name: topic
        values:
          - cli
          - tui
          - mcp
          - config
          - exit-codes
          - reference
    data: "{ topic, markdown }"
    example: termfy skill
  - path: doctor
    description: Confere runtime, terminal, settings, origem da chave e leitura do cofre sem alterar arquivos.
    data: "{ checks[], ok }"
    exitCodes:
      - 3
    example: termfy doctor --help
  - path: completion
    description: Imprime um script de completion para bash, zsh ou fish gerado pelo registry.
    arguments:
      - name: shell
        required: true
        values:
          - bash
          - zsh
          - fish
    data: "{ shell, script }"
    example: termfy completion --help
  - path: spec
    description: Read and evolve the CLISPEC.md contract and its specs.
    data: "{ help } com --help"
    exitCodes:
      - 3
      - 7
  - path: spec show
    description: Show CLISPEC.md, or one spec of specs/ when an ID is given.
    arguments:
      - name: id
    data: "{ frontmatter, sections } sem id; { file, slug, frontmatter, sections, tasks, tests, progress } com id"
    exitCodes:
      - 3
    example: termfy spec show
  - path: spec check
    description: Validate CLISPEC.md against the executable registries and the specs against CLISPEC.md.
    options:
      - name: "--strict"
        description: Fail on warnings as well as errors. Disabled by default.
    data: "{ ok, errors[], warnings[], pending[] }"
    exitCodes:
      - 3
    example: termfy spec check
  - path: spec progress
    description: Show completed tasks and tests of one spec, or of every open spec.
    arguments:
      - name: id
    data: "{ open, done, total, percent, specs[] } sem id; { id, status, done, total, percent } com id"
    exitCodes:
      - 3
    example: termfy spec progress
  - path: spec sync
    description: List code entries missing from CLISPEC.md and, with --write, append them as a draft.
    options:
      - name: "--write"
        description: Write the missing entries (to CLISPEC.md, or to the spec given by --spec).
      - name: "--spec"
        argument: id
        description: Open spec that receives the entries in changes.add instead of CLISPEC.md.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ file, written, commands[], screens[], tools[], resources[], prompts[], settings[], total }"
    exitCodes:
      - 3
      - 7
    example: termfy spec sync
  - path: spec list
    description: List the specs with status, progress and change counts.
    data: "{ source, specs[] }"
    exitCodes:
      - 3
    example: termfy spec list
  - path: spec new
    description: Create specs/NNNN-<slug>.md as a draft and add it to the CLISPEC.md index.
    arguments:
      - name: slug
        required: true
    options:
      - name: "--title"
        argument: text
        description: Spec title. Defaults to the slug in words.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, file, title }"
    exitCodes:
      - 3
      - 7
    example: termfy spec new orders-export --title "Export orders to CSV"
  - path: spec close
    description: Apply a finished spec to CLISPEC.md and mark it done.
    arguments:
      - name: id
        required: true
    options:
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, file, check }"
    exitCodes:
      - 3
      - 7
    example: termfy spec close 0002
  - path: spec migrate
    description: Convert a schemaVersion 1.0.0 CLISPEC.md to 2.0.0, moving its checklist into specs/.
    options:
      - name: "--write"
        description: Write the converted files. Without it, only reports the plan.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ needed, migrated, file, spec? }"
    exitCodes:
      - 3
      - 7
    example: termfy spec migrate
  - path: spec start
    description: Move a draft or blocked spec to in_progress.
    arguments:
      - name: id
        required: true
    options:
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, from, to }"
    exitCodes:
      - 3
      - 7
    example: termfy spec start 0002
  - path: spec block
    description: Mark an open spec as blocked, with a reason.
    arguments:
      - name: id
        required: true
    options:
      - name: "--reason"
        argument: text
        description: Why the spec is blocked; stored as blockedReason.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, from, to }"
    exitCodes:
      - 3
      - 7
    example: termfy spec block 0002 --reason "Waiting for the API key"
  - path: spec archive
    description: Archive an open spec without applying its changes, with a reason.
    arguments:
      - name: id
        required: true
    options:
      - name: "--reason"
        argument: text
        description: Why the spec is archived; stored as archivedReason.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, from, to }"
    exitCodes:
      - 3
      - 7
    example: termfy spec archive 0002 --reason "Waiting for the API key"
  - path: spec task
    description: Manage the tasks of a spec.
    data: "{ help } com --help"
    exitCodes:
      - 3
      - 7
  - path: spec task add
    description: Append a task to a spec with a generated {#id}.
    arguments:
      - name: id
        required: true
      - name: text
        required: true
        variadic: true
    options:
      - name: "--tag"
        argument: skill
        description: "Skill tag of the task: the skill responsible, such as termfy-cli."
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, item, section }"
    exitCodes:
      - 3
      - 7
    example: termfy spec task add 0002 Implement orders export --tag termfy-cli
  - path: spec test
    description: Manage the acceptance tests of a spec.
    data: "{ help } com --help"
    exitCodes:
      - 3
      - 7
  - path: spec test add
    description: Append a test to a spec with a generated {#id}.
    arguments:
      - name: id
        required: true
      - name: text
        required: true
        variadic: true
    options:
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, item, section }"
    exitCodes:
      - 3
      - 7
    example: termfy spec test add 0002 "orders export --json returns { file, count }"
  - path: spec done
    description: Mark a task or test of a spec as done by its {#id}.
    arguments:
      - name: id
        required: true
      - name: item
        required: true
    options:
      - name: "--undo"
        description: Unmark the item instead.
      - name: "--file"
        argument: path
        default: CLISPEC.md
        description: CLISPEC.md to read and write; specs/ sits next to it.
    data: "{ id, item, done }"
    exitCodes:
      - 3
      - 7
    example: termfy spec done 0002 a1b2
screens:
  - id: overview
    title: Overview
    description: Apresenta ambiente, configuração e cofre.
  - id: about
    title: About
    description: Apresenta binário, versão, licença e créditos.
  - id: specs
    title: Specs
    description: Specs that evolve the binary, with status and progress
    keys:
      - key: up/down
        action: select spec
mcp:
  tools:
    - name: about
      description: Mostra versão, executável, runtime, plataforma e créditos do binário.
      input: "{}"
      output: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
      effect: read
    - name: exit_codes
      description: Retorna a tabela de exit codes do processo.
      input: "{}"
      output: "{ codes[] }"
      effect: read
    - name: skill
      description: Retorna a documentação embutida, completa ou por topic.
      input: "{ topic? }"
      output: Texto em Markdown
      effect: read
    - name: config_list
      description: Retorna cada key de settings.json com seu valor atual.
      input: "{}"
      output: "{ file, values, schema[] }"
      effect: read
    - name: config_get
      description: Retorna o valor de uma key de settings.json.
      input: "{ key }"
      output: "{ key, value, exists }"
      effect: read
    - name: credentials_status
      description: Mostra nomes salvos e origem da master key, sem valores.
      input: "{}"
      output: "{ file, exists, masterKeySource, count, names[] }"
      effect: read
    - name: doctor
      description: Confere runtime, terminal e configuração; retorna checks e ok sem valores de credenciais ou alterações em arquivos.
      input: "{}"
      output: "{ checks[], ok }"
      effect: read
    - name: spec
      description: Read the binary contract (CLISPEC.md) before operating it or proposing changes. Returns identity, delivered surface, spec index and sections without writing.
      input: "{}"
      output: "{ frontmatter, sections }"
      effect: read
    - name: specs
      description: List the specs that evolve the binary, or read one by id with its changes, tasks, tests and progress. Read only.
      input: "{ id? }"
      output: "{ source, specs[] } ou { file, slug, frontmatter, sections, tasks, tests, progress }"
      effect: read
  resources:
    - uri: termfy://about
      description: Retorna identidade do binário e runtime em JSON.
    - uri: termfy://exit-codes
      description: Retorna a tabela de exit codes em JSON.
    - uri: termfy://skill
      description: Retorna a documentação completa em Markdown.
    - uri: termfy://skill/{topic}
      description: "Retorna uma seção da documentação. Topics: cli, tui, mcp, config, exit-codes, reference."
  prompts:
    - name: operate
      args:
        - task
settings:
  - key: output.format
    type: enum
    default: text
    values:
      - text
      - json
    description: Define o formato de saída do CLI quando --json não é informado.
  - key: output.colors
    type: boolean
    default: true
    description: Usa cores ANSI na saída de texto; NO_COLOR=1 sempre desliga as cores.
  - key: tui.initialTab
    type: enum
    default: overview
    values:
      - overview
      - specs
      - about
    description: Define a aba aberta ao iniciar a TUI.
  - key: tui.theme
    type: enum
    default: night
    values:
      - night
      - day
    description: Define a paleta da TUI; night é o padrão modern unix.
  - key: telemetry.enabled
    type: boolean
    default: false
    description: Reservada para projetos derivados; o esqueleto não envia dados.
specs:
  - id: "0001"
    title: Baseline
    status: done
  - id: "0002"
    title: Specs de evolução do binário
    status: done
  - id: "0003"
    title: Stubs de banco SQLite opcional
    status: done
  - id: "0004"
    title: Ferramentas de spec, storage e aba Specs
    status: done
---
## Purpose

O starter kit fornece a base para quem cria ferramentas de terminal com Bun.
O mesmo executável oferece TUI, CLI e MCP, compartilha configuração e cofre
e permite consultar sua documentação e seu contrato sem acessar o repositório.

## Audiences

| Público | Modo | Necessidade |
| --- | --- | --- |
| pessoa no terminal | TUI e CLI texto | consultar o ambiente e ajustar preferências |
| script ou CI | CLI com `--json` | ler dados estruturados e conferir a spec |
| agente de IA | MCP e `--skill` | consultar o contrato antes de operar o binário |

## Out of scope

- Acessar APIs externas ou executar operações de rede.
- Consumir credenciais de serviços: o esqueleto apenas administra o cofre.
- Persistir dados fora de `~/.termfy/`, salvo a pasta definida por `TERMFY_HOME`.

## Notes

- 2026-11-10: contrato convertido para front matter YAML e cinco seções fixas.
- 2026-11-10: nenhuma credencial de serviço é consumida pelo esqueleto.
- 2026-11-10: resumo textual da spec e conferência de checklist revisados.
- 2026-11-10: spec 0004 (Ferramentas de spec, storage e aba Specs) closed.
