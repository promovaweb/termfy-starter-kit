# OpenMCP e economia de tokens

OpenMCP (https://www.open-mcp.org) é um padrão para converter APIs web
(OpenAPI, gRPC, OpenRPC, GraphQL, SOAP, PostgREST) em servidores MCP com
descrições econômicas em tokens. O registro em `/servers` publica cada
servidor como endpoint remoto Streamable HTTP e como pacote npm local.

O Termfy não gera servidores a partir de especificações. O que ele aproveita
do OpenMCP é a disciplina de economia:

1. Descrição curta e precisa por tool. O agente lê todas as descrições a cada
   conversa; cada palavra a mais custa em todas as chamadas.
2. Schemas enxutos. Campos opcionais com padrão na descrição, sem repetir o
   óbvio.
3. Respostas recortadas. Devolva campos úteis; ofereça `limit` e `cursor`
   quando a lista cresce.
4. Uma tool de descoberta (`skill`) em vez de dezenas de tools de
   documentação.
5. Resources para dados passivos (documentação, tabelas), tools para ação.

## Quando um projeto derivado consome uma API externa

Se a API tem OpenAPI, avalie gerar o servidor pelo OpenMCP e manter o
Termfy focado no que a API não oferece (estado local, credenciais,
orquestração). Se a API não tem especificação, escreva as tools à mão
seguindo `tool-contract.md`.

## Configuração de cliente para servidores remotos OpenMCP

```json
{
  "mcpServers": {
    "{server-id}": {
      "transport": "streamableHttp",
      "url": "https://mcp.open-mcp.org/api/server/{server-id}@latest/mcp"
    }
  }
}
```

Variáveis podem ser encaminhadas por cabeçalho ou query com o prefixo
`FORWARD_VAR_`. O site desaconselha enviar tokens de autenticação por esse
caminho.
