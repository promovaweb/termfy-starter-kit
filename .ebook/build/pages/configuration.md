# Configuração e credenciais

Tudo que o binário persiste fica em `~/.termfy/`:

| Arquivo | Conteúdo | Permissão |
| --- | --- | --- |
| `settings.json` | preferências em texto claro | 0600 |
| `credentials.json` | envelope AES-256-GCM com os segredos | 0600 |
| `master.key` | master key em hexadecimal, criada na primeira gravação | 0600 |

A pasta é criada com 0700. A variável `TERMFY_HOME` troca a raiz, útil em
testes e CI.

## settings.json

Keys em notação de ponto. O schema do esqueleto:

| Key | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `output.format` | `text` ou `json` | `text` | formato padrão da saída do CLI |
| `output.colors` | boolean | `true` | cores ANSI na saída de texto |
| `tui.initialTab` | `overview` ou `about` | `overview` | aba aberta ao iniciar a TUI |
| `tui.theme` | `night` ou `day` | `night` | paleta da TUI |
| `telemetry.enabled` | boolean | `false` | reservado para projetos derivados |

Commands:

```bash
termfy config list
termfy config get tui.theme
termfy config set output.format json
termfy config unset telemetry.enabled
termfy config path
termfy config schema
```

Keys fora do schema são aceitas como texto. Para que uma key nova ganhe tipo,
padrão e documentação, acrescente-a a `SETTINGS_SCHEMA` em
`src/config/settings.ts`.

## credentials.json

O arquivo guarda um envelope:

```json
{ "version": 1, "algorithm": "aes-256-gcm", "iv": "<base64>", "tag": "<base64>", "data": "<base64>" }
```

`data` é o JSON `{ "name": "value" }` cifrado. Names seguem
`[a-z0-9][a-z0-9_.-]{0,63}`, por exemplo `openai.api_key` ou `github.token`.

A master key tem 32 bytes e vem, nesta ordem:

1. da variável `TERMFY_MASTER_KEY` (64 caracteres hexadecimais);
2. do arquivo `master.key`, gerado automaticamente.

Gere uma chave para a variável com `openssl rand -hex 32`. Quando a variável
está definida, `master.key` é ignorado.

Commands:

```bash
termfy credentials set openai.api_key            # digita sem eco
printf '%s' "$TOKEN" | termfy credentials set github.token --stdin
termfy credentials get openai.api_key            # mascarado
termfy credentials get openai.api_key --reveal   # em claro
termfy credentials list
termfy credentials remove github.token
termfy credentials status
termfy credentials clear --yes
```

## O que a cifra protege

A cifra protege o arquivo contra leitura casual, cópia em backup e varredura
do disco por outras ferramentas. Quem tem acesso à mesma conta do sistema
consegue ler `master.key` e decifrar o conteúdo. Para um nível acima, injete a
chave por `TERMFY_MASTER_KEY` a partir de um gerenciador de segredos e não
grave `master.key` em disco.

## Usar uma credencial no código

```ts
import { getCredential } from "../config/credentials.ts";

const token = getCredential("github.token"); // lança AppError(4) quando não existe
```

Nunca escreva o valor em log, em erro, em `data` do `--json` nem em
resposta de tool MCP.

## Variáveis de ambiente

| Variável | Efeito |
| --- | --- |
| `TERMFY_HOME` | troca `~/.termfy/` por outra pasta |
| `TERMFY_MASTER_KEY` | master key em hex; dispensa `master.key` |
| `NO_COLOR` | desliga cores na saída de texto |
