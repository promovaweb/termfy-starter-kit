---
schemaVersion: 1.0.0
bin: termfy
title: Termfy
description: "CLI, TUI and MCP stdio server skeleton in Bun, with the Termfy framework skills installed."
status: done
createdAt: 2026-11-10T12:00:00.000Z
updatedAt: 2026-11-10T18:00:00.000Z
commands:
  - path: tui
    description: Open the terminal interface (Overview and About). Requires a TTY.
    arguments: []
    options:
      - name: "--tab"
        argument: tab
        values:
          - overview
          - about
        description: Initial tab. Overrides tui.initialTab from settings.json.
    data: "{ closed }"
    exitCodes:
      - 8
    credentials: []
    interactive: true
    example: termfy
  - path: about
    description: "Show version, executable, runtime, platform and credits."
    arguments: []
    options: []
    data: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy about
  - path: config
    description: Read and write preferences in ~/.<bin>/settings.json.
    arguments: []
    options: []
    data: "{ help } with --help"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config --help
  - path: config list
    description: List every key with its effective value (file merged with defaults).
    arguments: []
    options: []
    data: "{ file, exists, values }"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config list
  - path: config get
    description: Show the value of a key.
    arguments:
      - name: key
        required: true
    options: []
    data: "{ key, value }"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config get tui.initialTab
  - path: config set
    description: "Write a value to settings.json, converting the type according to the schema."
    arguments:
      - name: key
        required: true
      - name: value
        required: true
    options: []
    data: "{ key, value, file, unknownKey }"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config set output.format json
  - path: config unset
    description: "Remove a key from the file. The key falls back to its default, if any."
    arguments:
      - name: key
        required: true
    options: []
    data: "{ key, removed }"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config unset telemetry.enabled
  - path: config path
    description: Print the data directory and file paths.
    arguments: []
    options: []
    data: "{ base, settings, credentials, masterKey }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy config path
  - path: config schema
    description: "List the known keys with type, default and description."
    arguments: []
    options: []
    data: "{ keys[] }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy config schema --json
  - path: credentials
    description: Store encrypted secrets (AES-256-GCM) in ~/.<bin>/credentials.json.
    arguments: []
    options: []
    data: "{ help } with --help"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials --help
  - path: credentials set
    description: Save or replace a credential. The value is read without echo or from stdin.
    arguments:
      - name: name
        required: true
    options:
      - name: "--stdin"
        description: "Force reading the value from the first stdin line, even on an interactive terminal."
    data: "{ name, file, saved }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: true
    example: termfy credentials set openai.api_key
  - path: credentials get
    description: Show a masked credential. Use --reveal for the full value.
    arguments:
      - name: name
        required: true
    options:
      - name: "--reveal"
        description: "Print the value in clear. In --json the field becomes `value`."
    data: "{ name, masked, length } or { name, value } with --reveal"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials get openai.api_key
  - path: credentials list
    description: List saved names. Never shows values.
    arguments: []
    options: []
    data: "{ count, names[] }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials list --json
  - path: credentials remove
    description: Remove a credential from the vault.
    arguments:
      - name: name
        required: true
    options: []
    data: "{ name, removed }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials remove github.token
  - path: credentials status
    description: "Show file, master key source and number of credentials."
    arguments: []
    options: []
    data: "{ file, exists, masterKeySource, count, names[], masterKeyVariable, algorithm }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy credentials status
  - path: credentials clear
    description: Delete credentials.json entirely. Keeps master.key. Asks for confirmation on a terminal.
    arguments: []
    options:
      - name: "--yes"
        description: Skip the confirmation.
    data: "{ file, deleted }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: true
    example: termfy credentials clear --yes
  - path: credentials rotate-key
    description: Re-encrypt the existing vault with a new master key and write master.key with mode 0600.
    arguments: []
    options:
      - name: "--from-env"
        description: Use TERMFY_MASTER_KEY (64 hex characters) as the new key; read the current key from master.key.
    data: "{ rotated, source }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials rotate-key --help
  - path: mcp
    description: "Start the MCP server (stdio) with tools, resources and prompts for agents."
    arguments: []
    options:
      - name: "--list"
        description: "Instead of starting the server, list registered tools, resources and prompts and exit."
    data: "{ name, version, tools[], resources[], prompts[] } with --list; { closed } after shutdown"
    exitCodes:
      - 9
    credentials: []
    interactive: false
    example: termfy mcp
  - path: skill
    description: "Print the embedded documentation, whole or by topic. Same effect as --skill."
    arguments:
      - name: topic
        values:
          - cli
          - tui
          - mcp
          - config
          - exit-codes
          - reference
    options: []
    data: "{ topic, markdown }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy skill
  - path: doctor
    description: "Check runtime, terminal, settings, key source and vault readability without changing files."
    arguments: []
    options: []
    data: "{ checks[], ok }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy doctor --help
  - path: completion
    description: "Print a registry-generated completion script for bash, zsh or fish."
    arguments:
      - name: shell
        required: true
        values:
          - bash
          - zsh
          - fish
    options: []
    data: "{ shell, script }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy completion --help
  - path: spec
    description: Read and check the embedded CLISPEC.md contract.
    arguments: []
    options: []
    data: "{ help } with --help"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec --help
  - path: spec show
    description: "Show the embedded spec front matter, sections and progress."
    arguments: []
    options: []
    data: "{ frontmatter, sections, progress }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec show
  - path: spec check
    description: Validate the embedded spec against the executable registries.
    arguments: []
    options:
      - name: "--strict"
        description: Fail on warnings as well as errors. Disabled by default.
    data: "{ ok, errors[], warnings[] }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec check
  - path: spec progress
    description: "Show completed checklist items, total items and percentage."
    arguments: []
    options: []
    data: "{ done, total, percent }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec progress
screens:
  - id: overview
    title: Overview
    description: "Environment, configuration and vault at a glance"
    keys: []
  - id: about
    title: About
    description: "Binary, version, license and credits"
    keys: []
mcp:
  tools:
    - name: about
      description: "Version, executable, runtime, platform and credits of the binary."
      input: "{}"
      output: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
      effect: read
    - name: exit_codes
      description: Process exit-code table.
      input: "{}"
      output: "{ codes[] }"
      effect: read
    - name: skill
      description: "Embedded documentation, whole or by topic."
      input: "{ topic? }"
      output: Markdown text
      effect: read
    - name: config_list
      description: Every settings.json key with its effective value.
      input: "{}"
      output: "{ file, values, schema[] }"
      effect: read
    - name: config_get
      description: Value of a settings.json key.
      input: "{ key }"
      output: "{ key, value, exists }"
      effect: read
    - name: credentials_status
      description: "Saved names and master key source, without values."
      input: "{}"
      output: "{ file, exists, masterKeySource, count, names[] }"
      effect: read
    - name: doctor
      description: "Diagnose runtime, terminal and configuration health. Returns checks and ok without credential values or file changes."
      input: "{}"
      output: "{ checks[], ok }"
      effect: read
    - name: spec
      description: "Read the binary contract before operating it or proposing changes. Returns front matter, sections and progress without writing."
      input: "{}"
      output: "{ frontmatter, sections, progress }"
      effect: read
  resources:
    - uri: termfy://about
      description: Binary identity and runtime as JSON.
    - uri: termfy://exit-codes
      description: Exit-code table as JSON.
    - uri: termfy://skill
      description: Full documentation in Markdown.
    - uri: "termfy://skill/{topic}"
      description: "One documentation section. Topics: cli, tui, mcp, config, exit-codes, reference."
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
    description: Default CLI output format when --json is not given.
  - key: output.colors
    type: boolean
    default: true
    description: Use ANSI colors in text output. NO_COLOR=1 always disables them.
  - key: tui.initialTab
    type: enum
    default: overview
    values:
      - overview
      - about
    description: Tab opened when the TUI starts.
  - key: tui.theme
    type: enum
    default: night
    values:
      - night
      - day
    description: "TUI palette. `night` is the default modern unix palette."
  - key: telemetry.enabled
    type: boolean
    default: false
    description: Reserved for derived projects. The skeleton sends nothing.
credentials: []
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

## Checklist

- [x] Disponibilizar os commands do esqueleto com saída texto e JSON `#termfy-cli` {#c001}
- [x] Exibir as screens Overview e About `#termfy-tui` {#t001}
- [x] Expor tools, resources e o prompt operate `#termfy-mcp` {#m001}
- [x] Gerenciar settings e credenciais cifradas `#termfy-config` {#s001}
- [x] Ler e conferir o contrato com spec show, check e progress `#termfy-cli` {#c002}
- [x] Expor a spec pela tool MCP spec `#termfy-mcp` {#m002}

## Notes

- 2026-11-10: contrato convertido para front matter YAML e cinco seções fixas.
- 2026-11-10: nenhuma credencial de serviço é consumida pelo esqueleto.
