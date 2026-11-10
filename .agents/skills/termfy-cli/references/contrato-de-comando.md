# Contrato de um comando

Um comando é um objeto `Comando` (ver `src/cli/registro.ts`).

| Campo | Obrigatório | Uso |
| --- | --- | --- |
| `nome` | sim | minúsculas, sem espaços; aparece em `--help` e no OpenCLI |
| `descricao` | sim | uma linha, começa com verbo no presente |
| `descricaoLonga` | não | parágrafos para o `--help` do próprio comando |
| `aliases` | não | nomes alternativos; evite mais de um |
| `argumentos` | não | posicionais; só o último pode ser `variadico` |
| `opcoes` | não | `--nome` longo; `aliases` para curtos; `argumento` quando recebe valor |
| `subcomandos` | não | comandos agrupadores não têm `executar` |
| `exemplos` | sim quando há `executar` | linhas completas começando pelo binário |
| `codigosSaida` | sim quando há `executar` | famílias além de 0, 1 e 2 |
| `interativo` | quando exige TTY | marca OpenCLI `interactive` |
| `oculto` | não | some do `--help` e do OpenCLI |
| `executar` | sim em comandos finais | `(ctx) => Resultado` |

## Contexto

`ctx.args` traz os posicionais validados; `ctx.opcoes` traz as opções pelo
nome longo sem hifens (`--no-color` vira `ctx.opcoes["no-color"]`);
`ctx.json` indica o formato; `ctx.stderr` recebe progresso; `ctx.interativo`
diz se há TTY.

## Resultado

```ts
return {
  dados: { chave: valor },          // vai em --json
  texto: () => tabela([...]),       // função para só renderizar quando preciso
  codigo: CodigoSaida.SUCESSO,      // opcional
};
```

## Códigos de saída por situação

| Situação | Atalho | Código |
| --- | --- | --- |
| argumento ou opção inválida depois do parse | `erro.uso` | 2 |
| chave de configuração inexistente ou inválida | `erro.configuracao` | 3 |
| credencial ausente, cofre ilegível | `erro.credenciais` | 4 |
| HTTP fora de 2xx, timeout, DNS | `erro.rede` | 5 |
| arquivo ou registro inexistente | `erro.naoEncontrado` | 6 |
| EACCES, EPERM | `erro.permissao` | 7 |
| TUI sem TTY | `erro.terminal` | 8 |
| transporte MCP | `erro.mcp` | 9 |
| cancelamento pelo usuário | `erro.interrompido` | 130 |

Para erros de sistema de arquivos, `classificarErroFs(e, padrao, contexto)`
converte `code` do Node em família.

## Nomes

- Comandos e subcomandos em inglês curto quando forem verbos de ferramenta já
  consagrados (`list`, `get`, `set`, `remove`), com alias em português quando
  ajudar (`about` / `sobre`).
- Opções em inglês quando forem convenção da comunidade (`--json`, `--yes`,
  `--stdin`, `--reveal`), em português quando forem do domínio do produto.
- Chaves de `dados` em camelCase português (`quantidade`, `arquivo`).
