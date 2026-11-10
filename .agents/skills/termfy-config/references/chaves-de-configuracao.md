# Declarar uma chave de configuração

```ts
// src/config/settings.ts
{
  chave: "api.timeoutMs",
  tipo: "number",
  padrao: 10000,
  descricao: "Tempo máximo de espera por resposta da API, em milissegundos.",
},
{
  chave: "saida.idioma",
  tipo: "enum",
  padrao: "pt-BR",
  valores: ["pt-BR", "en"],
  descricao: "Idioma das mensagens de texto.",
},
```

## Tipos

| Tipo | Conversão em `config set` | Validação |
| --- | --- | --- |
| `string` | texto como veio | nenhuma |
| `number` | `Number(texto)` | precisa ser finito |
| `boolean` | `true/false`, `sim/nao`, `1/0`, `on/off` | fora disso falha com 3 |
| `enum` | texto como veio | precisa estar em `valores` |

## Nomes

`grupo.chave` em camelCase: `saida.formato`, `tui.abaInicial`,
`api.timeoutMs`. Grupos existentes: `saida`, `tui`, `telemetria`. Crie um
grupo novo quando o domínio for outro (`api`, `sync`, `editor`).

## Leitura no código

```ts
import { lerSettings, obterCaminho } from "../config/settings.ts";

const timeout = Number(obterCaminho(lerSettings(), "api.timeoutMs") ?? 10000);
```

`lerSettings()` já mescla o arquivo com os padrões, então o valor nunca é
`undefined` para chaves do esquema.

## Documentação

Acrescente a linha na tabela de `docs/configuracao.md`. O comando
`config schema` lê o esquema e já exibe a chave.
