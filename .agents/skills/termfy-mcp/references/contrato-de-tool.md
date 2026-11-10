# Contrato de uma tool

Exemplo para `src/mcp/tools/example.ts`:

```ts
import { z } from "zod";
import type { Registrar } from "../server.ts";

export function registerExampleTools({ server, catalog }: Registrar): void {
  const name = "items_preview";
  const description = "Preview a target and its item limit. Returns the requested values.";
  catalog.tools.push({ name, description });
  server.registerTool(
    name,                                   // snake_case, verbo no fim
    {
      title: "Preview items",                        // nome legível para o cliente
      description,     // quando usar + o que devolve
      inputSchema: {
        target: z.string().min(1).describe("Target to preview."),     // cada campo com describe()
        limit: z.number().int().positive().max(100).optional().describe("Maximum item count. Defaults to 10."),
      },
    },
    async ({ target, limit }) => {
      const data = { target, limit: limit ?? 10 };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
        // isError: true  em falha prevista
      };
    },
  );
}
```

## Nome

`<group>_<action>`: `config_get`, `credentials_status`, `orders_list`.
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

Antes de `registerTool`, acrescente `{ name, description }` em
`catalog.tools`. Use os mesmos campos em `catalog.prompts` e inclua
`uri` em `catalog.resources`. `mcp --list` lê esse catálogo.
