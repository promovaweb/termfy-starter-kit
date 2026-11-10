# Contrato de uma tool

```ts
servidor.registerTool(
  "grupo_acao",                                   // snake_case, verbo no fim
  {
    title: "Ação do grupo",                        // nome legível para o cliente
    description: "Use quando ... Devolve ...",     // quando usar + o que devolve
    inputSchema: {
      alvo: z.string().min(1).describe("..."),     // cada campo com describe()
      limite: z.number().int().positive().max(100).optional().describe("Padrão 10."),
    },
  },
  async ({ alvo, limite }) => {
    const d = { ... };
    return {
      content: [{ type: "text", text: JSON.stringify(d, null, 2) }],
      structuredContent: d,
      // isError: true  em falha prevista
    };
  },
);
```

## Nome

`<grupo>_<acao>`: `config_get`, `credentials_status`, `pedidos_listar`.
Grupo é o domínio; ação é verbo ou substantivo curto. Sem prefixo do binário:
o cliente já sabe de qual servidor a tool veio.

## Descrição

Duas frases: a primeira diz quando o agente deve chamar; a segunda diz o que
volta. Mencione limites (`até 100 itens`), efeitos (`grava em disco`) e
pré-requisitos (`exige a credencial github.token`).

## Schema

- Zod v4 (`import { z } from "zod"`).
- Todo campo com `.describe()`. Enum com `z.enum([...])`.
- Opcionais com `.optional()` e padrão explicado na descrição.
- Sem campos para segredos. Se a tool precisa de token, ela lê do cofre.

## Resposta

- `content[0]` em texto, JSON formatado com dois espaços.
- `structuredContent` com o mesmo objeto, para clientes que leem estrutura.
- Erro previsto: `isError: true` e `content` com a mensagem e a ação
  sugerida ("rode `<bin> credentials set x`").
- Erro imprevisto: deixe a exceção subir; o SDK a converte em erro de
  protocolo.

## Resources

- URI `<bin>://<caminho>`; template `<bin>://<caminho>/{param}`.
- `mimeType` correto (`application/json`, `text/markdown`).
- Template com `list` devolvendo as URIs conhecidas.

## Prompts

- Nome em minúsculas; `argsSchema` em Zod com `.describe()`.
- Mensagem orienta o agente a ler `skill` antes de agir e a usar `--json`.

## Catálogo

Antes de `registerTool`, acrescente `{ nome, descricao }` em
`catalogo.tools` (ou `resources`, `prompts`). `mcp --list` lê esse catálogo.
