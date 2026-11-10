# MCP

`termfy mcp` transforma o processo em um servidor Model Context Protocol
sobre stdio. Nada mais é escrito em stdout; diagnósticos vão para stderr.

## Configuração no cliente

```json
{
  "mcpServers": {
    "termfy": { "command": "termfy", "args": ["mcp"] }
  }
}
```

Para o Claude Code: `claude mcp add termfy -- termfy mcp`.
Para desenvolvimento, sem compilar: `"command": "bun", "args": ["run", "src/main.ts", "mcp"]`.

## Tools

| Tool | Entrada | Saída |
| --- | --- | --- |
| `about` | nenhuma | identity, runtime, platform, data directory e credits |
| `exit_codes` | nenhuma | tabela de exit codes |
| `skill` | `topic?` (`cli`, `tui`, `mcp`, `config`, `exit-codes`) | documentação em Markdown |
| `config_list` | nenhuma | keys de settings.json em vigor e o schema |
| `config_get` | `key` | valor da key; `isError` quando não existe |
| `credentials_status` | nenhuma | file, master key source, count e names |

Nenhuma tool devolve o valor de uma credencial, e nenhuma tool grava. Escrita
continua no CLI, onde há confirmação humana.

## Resources

| URI | Conteúdo |
| --- | --- |
| `termfy://about` | identity em JSON |
| `termfy://exit-codes` | exit codes em JSON |
| `termfy://skill` | documentação completa em Markdown |
| `termfy://skill/{topic}` | uma seção; o template lista os topics |

## Prompts

| Prompt | Arguments | Função |
| --- | --- | --- |
| `operate` | `task` | instrui o agente a ler `skill cli` e executar a task pelo CLI com `--json` |

## Listar sem iniciar

```bash
termfy mcp --list
termfy mcp --list --json
```

## Testar

```bash
npx @modelcontextprotocol/inspector termfy mcp
```

O Inspector abre uma página local para chamar tools, ler resources e
inspecionar as mensagens JSON-RPC.

## Como adicionar uma tool

1. Copie `template/tool/example.ts` para `src/mcp/tools/<name>.ts`.
2. Declare `inputSchema` com Zod e descreva cada campo com `.describe()`. A
   description da tool diz quando usar e o que ela devolve.
3. Devolva `content` em texto e, quando a saída for estruturada,
   `structuredContent` com o mesmo objeto.
4. Acrescente a tool ao `catalog.tools` para que `mcp --list` a enxergue.
5. Registre a função em `registerAll` em `src/mcp/server.ts`.
6. Teste com o Inspector e com `bun test`.

Nomes de tools usam `snake_case`. Tools que gravam ou chamam APIs externas
precisam dizer isso na description e nunca devem ecoar segredos na resposta.
