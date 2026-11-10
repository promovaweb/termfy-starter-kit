# Configuração e credenciais

Tudo que o binário persiste fica em `~/.{{bin}}/`:

| Arquivo | Conteúdo | Permissão |
| --- | --- | --- |
| `settings.json` | preferências em texto claro | 0600 |
| `credentials.json` | envelope AES-256-GCM com os segredos | 0600 |
| `master.key` | chave mestra em hexadecimal, criada na primeira gravação | 0600 |

A pasta é criada com 0700. A variável `{{BIN}}_HOME` troca a raiz, útil em
testes e CI.

## settings.json

Chaves em notação de ponto. O esquema do esqueleto:

| Chave | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `saida.formato` | `texto` ou `json` | `texto` | formato padrão da saída do CLI |
| `saida.cores` | boolean | `true` | cores ANSI na saída de texto |
| `tui.abaInicial` | `overview` ou `about` | `overview` | aba aberta ao iniciar a TUI |
| `tui.tema` | `noite` ou `dia` | `noite` | paleta da TUI |
| `telemetria.ativa` | boolean | `false` | reservado para projetos derivados |

Comandos:

```bash
{{bin}} config list
{{bin}} config get tui.tema
{{bin}} config set saida.formato json
{{bin}} config unset telemetria.ativa
{{bin}} config path
{{bin}} config schema
```

Chaves fora do esquema são aceitas como texto. Para que uma chave nova ganhe
tipo, padrão e documentação, acrescente-a a `ESQUEMA_SETTINGS` em
`src/config/settings.ts`.

## credentials.json

O arquivo guarda um envelope:

```json
{ "versao": 1, "algoritmo": "aes-256-gcm", "iv": "<base64>", "tag": "<base64>", "dados": "<base64>" }
```

`dados` é o JSON `{ "nome": "valor" }` cifrado. Nomes seguem
`[a-z0-9][a-z0-9_.-]{0,63}`, por exemplo `openai.api_key` ou `github.token`.

A chave mestra tem 32 bytes e vem, nesta ordem:

1. da variável `{{BIN}}_MASTER_KEY` (64 caracteres hexadecimais);
2. do arquivo `master.key`, gerado automaticamente.

Gere uma chave para a variável com `openssl rand -hex 32`. Quando a variável
está definida, `master.key` é ignorado.

Comandos:

```bash
{{bin}} credentials set openai.api_key            # digita sem eco
printf '%s' "$TOKEN" | {{bin}} credentials set github.token --stdin
{{bin}} credentials get openai.api_key            # mascarado
{{bin}} credentials get openai.api_key --reveal   # em claro
{{bin}} credentials list
{{bin}} credentials remove github.token
{{bin}} credentials status
{{bin}} credentials clear --yes
```

## O que a cifra protege

A cifra protege o arquivo contra leitura casual, cópia em backup e varredura
do disco por outras ferramentas. Quem tem acesso à mesma conta do sistema
consegue ler `master.key` e decifrar o conteúdo. Para um nível acima, injete a
chave por `{{BIN}}_MASTER_KEY` a partir de um gerenciador de segredos e não
grave `master.key` em disco.

## Usar uma credencial no código

```ts
import { obterCredencial } from "../config/credenciais.ts";

const token = obterCredencial("github.token"); // lança ErroApp(4) quando não existe
```

Nunca escreva o valor em log, em erro, em `dados` do `--json` nem em
resposta de tool MCP.

## Variáveis de ambiente

| Variável | Efeito |
| --- | --- |
| `{{BIN}}_HOME` | troca `~/.{{bin}}/` por outra pasta |
| `{{BIN}}_MASTER_KEY` | chave mestra em hex; dispensa `master.key` |
| `NO_COLOR` | desliga cores na saída de texto |
