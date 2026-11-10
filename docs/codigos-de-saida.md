# Códigos de saída

Zero é sucesso. Cada família de falha tem um número fixo. Scripts e agentes
devem tratar o código antes de interpretar a mensagem.

| Código | Nome | Quando |
| --- | --- | --- |
| 0 | `SUCESSO` | operação concluída |
| 1 | `ERRO_GENERICO` | falha inesperada sem classificação |
| 2 | `USO_INVALIDO` | argumentos, opções ou subcomando inválidos; também quando o binário roda sem argumentos fora de um TTY |
| 3 | `CONFIGURACAO` | settings.json ausente, inválido ou chave desconhecida |
| 4 | `CREDENCIAIS` | credentials.json ilegível, chave mestra ausente ou credencial não encontrada |
| 5 | `REDE_OU_API` | falha de rede ou resposta de API fora do esperado |
| 6 | `NAO_ENCONTRADO` | recurso solicitado não existe |
| 7 | `PERMISSAO` | permissão negada no sistema de arquivos |
| 8 | `TERMINAL_INDISPONIVEL` | a TUI exige um terminal interativo |
| 9 | `MCP` | o servidor MCP falhou ao iniciar ou perdeu o transporte |
| 130 | `INTERROMPIDO` | entrada cancelada ou processo interrompido com Ctrl+C |

A fonte única é `src/app/saida.ts`. A mesma tabela aparece em `--help`, em
`--opencli`, na tool MCP `exit_codes` e na resource `{{bin}}://exit-codes`.

## Em shell

```bash
if ! {{bin}} credentials get github.token --json > /tmp/saida.json; then
  case $? in
    4) echo "grave a credencial com: {{bin}} credentials set github.token" ;;
    *) echo "falha: veja /tmp/saida.json" ;;
  esac
fi
```

## No código

```ts
import { erro } from "../app/erros.ts";

throw erro.rede("A API respondeu 503.", { status: 503 }); // sai com 5
```

Para uma família nova, acrescente a constante e a descrição em
`src/app/saida.ts` e um atalho em `src/app/erros.ts`. Não reutilize números.
