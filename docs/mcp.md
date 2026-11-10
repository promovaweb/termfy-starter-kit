# MCP

`{{bin}} mcp` transforma o processo em um servidor Model Context Protocol
sobre stdio. Nada mais é escrito em stdout; diagnósticos vão para stderr.

## Configuração no cliente

```json
{
  "mcpServers": {
    "{{bin}}": { "command": "{{bin}}", "args": ["mcp"] }
  }
}
```

Para o Claude Code: `claude mcp add {{bin}} -- {{bin}} mcp`.
Para desenvolvimento, sem compilar: `"command": "bun", "args": ["run", "src/main.ts", "mcp"]`.

## Tools

| Tool | Entrada | Saída |
| --- | --- | --- |
| `about` | nenhuma | identidade, runtime, plataforma, pasta de dados e créditos |
| `exit_codes` | nenhuma | tabela de códigos de saída |
| `skill` | `topico?` (`cli`, `tui`, `mcp`, `config`, `codigos`) | documentação em Markdown |
| `config_list` | nenhuma | chaves de settings.json em vigor e o esquema |
| `config_get` | `chave` | valor da chave; `isError` quando não existe |
| `credentials_status` | nenhuma | arquivo, origem da chave mestra, quantidade e nomes |

Nenhuma tool devolve o valor de uma credencial, e nenhuma tool grava. Escrita
continua no CLI, onde há confirmação humana.

## Resources

| URI | Conteúdo |
| --- | --- |
| `{{bin}}://about` | identidade em JSON |
| `{{bin}}://exit-codes` | códigos de saída em JSON |
| `{{bin}}://skill` | documentação completa em Markdown |
| `{{bin}}://skill/{topico}` | uma seção; o template lista os tópicos |

## Prompts

| Prompt | Argumentos | Função |
| --- | --- | --- |
| `operar` | `tarefa` | instrui o agente a ler `skill cli` e executar a tarefa pelo CLI com `--json` |

## Listar sem iniciar

```bash
{{bin}} mcp --list
{{bin}} mcp --list --json
```

## Testar

```bash
npx @modelcontextprotocol/inspector {{bin}} mcp
```

O Inspector abre uma página local para chamar tools, ler resources e
inspecionar as mensagens JSON-RPC.

## Como adicionar uma tool

1. Copie `template/tool/exemplo.ts` para `src/mcp/tools/<nome>.ts`.
2. Declare `inputSchema` com Zod e descreva cada campo com `.describe()`. A
   descrição da tool diz quando usar e o que ela devolve.
3. Devolva `content` em texto e, quando a saída for estruturada,
   `structuredContent` com o mesmo objeto.
4. Acrescente a tool ao `catalogo.tools` para que `mcp --list` a enxergue.
5. Registre a função em `registrarTudo` em `src/mcp/servidor.ts`.
6. Teste com o Inspector e com `bun test`.

Nomes de tools usam `snake_case`. Tools que gravam ou chamam APIs externas
precisam dizer isso na descrição e nunca devem ecoar segredos na resposta.
