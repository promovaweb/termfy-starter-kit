# Documentação do {{titulo}}

`{{bin}}` é um executável único com três modos de uso:

| Modo | Como entrar | Para quem |
| --- | --- | --- |
| TUI | `{{bin}}` sem argumentos em um terminal interativo | pessoas |
| CLI | `{{bin}} <comando> [opções]`, com saída em texto ou `--json` | pessoas, scripts e agentes |
| MCP | `{{bin}} mcp`, servidor Model Context Protocol via stdio | agentes de IA |

Os três modos compartilham a mesma identidade (`src/app/manifesto.ts`), a
mesma configuração (`~/.{{bin}}/settings.json`), o mesmo cofre de credenciais
(`~/.{{bin}}/credentials.json`, cifrado) e a mesma tabela de códigos de saída.

## Mapa

- [cli.md](cli.md): comandos, opções globais, convenções de saída e a referência gerada do registro.
- [tui.md](tui.md): abas, teclas, tema e como criar uma tela.
- [mcp.md](mcp.md): tools, resources, prompts e configuração nos clientes.
- [configuracao.md](configuracao.md): settings.json, credentials.json, chave mestra e variáveis de ambiente.
- [codigos-de-saida.md](codigos-de-saida.md): tabela de códigos e como tratá-los.
- [arquitetura.md](arquitetura.md): pastas, camadas e fluxo de execução.
- [personalizar-template.md](personalizar-template.md): usar este repositório como ponto de partida de um novo binário.
- [release.md](release.md): versão, changelog, tag, GitHub Release e binários.
- [opencli.json](opencli.json): descrição OpenCLI gerada por `bun run opencli`.

## Documentação embutida

Toda esta pasta entra no binário. Um agente pode ler tudo sem acesso ao
repositório:

```bash
{{bin}} --skill          # tudo
{{bin}} --skill cli      # só a seção do CLI, com a referência gerada
{{bin}} --skill mcp --json
```

Os tópicos aceitos são `cli`, `tui`, `mcp`, `config` e `codigos`.
