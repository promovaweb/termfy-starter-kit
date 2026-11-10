---
schemaVersion: 1.0.0
bin: termfy
title: Termfy
description: "CLI, TUI and MCP stdio server skeleton in Bun, with the Termfy framework skills installed."
status: done
createdAt: 2026-11-10T12:00:00.000Z
updatedAt: 2026-11-10T19:00:00.000Z
commands:
  - path: tui
    description: "Abre a interface de terminal com Overview e About. Exige TTY."
    arguments: []
    options:
      - name: "--tab"
        argument: tab
        values:
          - overview
          - about
        description: "Define a aba inicial e substitui tui.initialTab de settings.json."
    data: "{ closed }"
    exitCodes:
      - 8
    credentials: []
    interactive: true
    example: termfy
  - path: about
    description: "Mostra versão, executável, runtime, plataforma e créditos."
    arguments: []
    options: []
    data: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy about
  - path: config
    description: "Lê e grava preferências em ~/.<bin>/settings.json."
    arguments: []
    options: []
    data: "{ help } com --help"
    exitCodes:
      - 3
      - 7
      - 6
    credentials: []
    interactive: false
    example: termfy config --help
  - path: config list
    description: "Lista cada key com o valor do arquivo combinado ao padrão."
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
    description: "Mostra o valor de uma key."
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
    description: "Grava um valor em settings.json com o tipo definido pelo schema."
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
    description: "Remove uma key do arquivo e restaura seu padrão, se houver."
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
    description: "Mostra a pasta de dados e os caminhos dos arquivos."
    arguments: []
    options: []
    data: "{ base, settings, credentials, masterKey }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy config path
  - path: config schema
    description: "Lista as keys conhecidas com tipo, padrão e descrição."
    arguments: []
    options: []
    data: "{ keys[] }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy config schema --json
  - path: credentials
    description: "Armazena segredos cifrados com AES-256-GCM em ~/.<bin>/credentials.json."
    arguments: []
    options: []
    data: "{ help } com --help"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials --help
  - path: credentials set
    description: "Salva ou substitui uma credencial, lida sem eco ou pelo stdin."
    arguments:
      - name: name
        required: true
    options:
      - name: "--stdin"
        description: "Lê o valor da primeira linha do stdin, inclusive no terminal interativo."
    data: "{ name, file, saved }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: true
    example: termfy credentials set openai.api_key
  - path: credentials get
    description: "Mostra uma credencial mascarada; --reveal exibe o valor completo."
    arguments:
      - name: name
        required: true
    options:
      - name: "--reveal"
        description: "Exibe o valor em texto claro; no --json, o campo passa a ser value."
    data: "{ name, masked, length } ou { name, value } com --reveal"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials get openai.api_key
  - path: credentials list
    description: "Lista os nomes salvos, sem mostrar valores."
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
    description: "Remove uma credencial do cofre."
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
    description: "Mostra arquivo, origem da master key e quantidade de credenciais."
    arguments: []
    options: []
    data: "{ file, exists, masterKeySource, count, names[], masterKeyVariable, algorithm }"
    exitCodes: []
    credentials: []
    interactive: false
    example: termfy credentials status
  - path: credentials clear
    description: "Apaga credentials.json, preserva master.key e pede confirmação no terminal."
    arguments: []
    options:
      - name: "--yes"
        description: "Dispensa a confirmação."
    data: "{ file, deleted }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: true
    example: termfy credentials clear --yes
  - path: credentials rotate-key
    description: "Cifra novamente o cofre com uma nova master key e grava master.key com permissão 0600."
    arguments: []
    options:
      - name: "--from-env"
        description: "Usa TERMFY_MASTER_KEY, com 64 caracteres hexadecimais, como nova chave; lê a chave atual de master.key."
    data: "{ rotated, source }"
    exitCodes:
      - 4
      - 7
      - 130
    credentials: []
    interactive: false
    example: termfy credentials rotate-key --help
  - path: mcp
    description: "Inicia o servidor MCP via stdio com tools, resources e prompts para agentes."
    arguments: []
    options:
      - name: "--list"
        description: "Lista tools, resources e prompts registrados e encerra sem iniciar o servidor."
    data: "{ name, version, tools[], resources[], prompts[] } com --list; { closed } após encerrar"
    exitCodes:
      - 9
    credentials: []
    interactive: false
    example: termfy mcp
  - path: skill
    description: "Imprime a documentação embutida, completa ou por topic, como --skill."
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
    description: "Confere runtime, terminal, settings, origem da chave e leitura do cofre sem alterar arquivos."
    arguments: []
    options: []
    data: "{ checks[], ok }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy doctor --help
  - path: completion
    description: "Imprime um script de completion para bash, zsh ou fish gerado pelo registry."
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
    description: "Lê e confere o contrato CLISPEC.md embutido."
    arguments: []
    options: []
    data: "{ help } com --help"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec --help
  - path: spec show
    description: "Resume a spec em texto; com --json, mostra front matter, seções e progresso completos."
    arguments: []
    options: []
    data: "{ frontmatter, sections, progress }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec show
  - path: spec check
    description: "Confere a spec embutida contra os registries do executável."
    arguments: []
    options:
      - name: "--strict"
        description: "Faz avisos causarem falha, assim como erros. Desativada por padrão."
    data: "{ ok, errors[], warnings[] }"
    exitCodes:
      - 3
    credentials: []
    interactive: false
    example: termfy spec check
  - path: spec progress
    description: "Mostra itens concluídos, total e porcentagem da checklist."
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
    description: "Apresenta ambiente, configuração e cofre."
    keys: []
  - id: about
    title: About
    description: "Apresenta binário, versão, licença e créditos."
    keys: []
mcp:
  tools:
    - name: about
      description: "Mostra versão, executável, runtime, plataforma e créditos do binário."
      input: "{}"
      output: "{ bin, title, version, description, author, site, repository, license, executable, runtime, platform, pid, dataDir, credits[] }"
      effect: read
    - name: exit_codes
      description: "Retorna a tabela de exit codes do processo."
      input: "{}"
      output: "{ codes[] }"
      effect: read
    - name: skill
      description: "Retorna a documentação embutida, completa ou por topic."
      input: "{ topic? }"
      output: Texto em Markdown
      effect: read
    - name: config_list
      description: "Retorna cada key de settings.json com seu valor atual."
      input: "{}"
      output: "{ file, values, schema[] }"
      effect: read
    - name: config_get
      description: "Retorna o valor de uma key de settings.json."
      input: "{ key }"
      output: "{ key, value, exists }"
      effect: read
    - name: credentials_status
      description: "Mostra nomes salvos e origem da master key, sem valores."
      input: "{}"
      output: "{ file, exists, masterKeySource, count, names[] }"
      effect: read
    - name: doctor
      description: "Confere runtime, terminal e configuração; retorna checks e ok sem valores de credenciais ou alterações em arquivos."
      input: "{}"
      output: "{ checks[], ok }"
      effect: read
    - name: spec
      description: "Lê o contrato antes de operar o binário ou propor mudanças; retorna front matter, seções e progresso sem gravar."
      input: "{}"
      output: "{ frontmatter, sections, progress }"
      effect: read
  resources:
    - uri: termfy://about
      description: "Retorna identidade do binário e runtime em JSON."
    - uri: termfy://exit-codes
      description: "Retorna a tabela de exit codes em JSON."
    - uri: termfy://skill
      description: "Retorna a documentação completa em Markdown."
    - uri: "termfy://skill/{topic}"
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
    description: "Define o formato de saída do CLI quando --json não é informado."
  - key: output.colors
    type: boolean
    default: true
    description: "Usa cores ANSI na saída de texto; NO_COLOR=1 sempre desliga as cores."
  - key: tui.initialTab
    type: enum
    default: overview
    values:
      - overview
      - about
    description: "Define a aba aberta ao iniciar a TUI."
  - key: tui.theme
    type: enum
    default: night
    values:
      - night
      - day
    description: "Define a paleta da TUI; night é o padrão modern unix."
  - key: telemetry.enabled
    type: boolean
    default: false
    description: "Reservada para projetos derivados; o esqueleto não envia dados."
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
- 2026-11-10: resumo textual da spec e conferência de checklist revisados.
