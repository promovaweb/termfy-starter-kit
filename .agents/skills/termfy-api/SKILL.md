---
name: termfy-api
description: Integra serviços externos com client HTTP compartilhado, credenciais no cofre, configuração tipada, timeout, retries limitados e testes locais com Bun.serve.
---

# Integrar um serviço externo

Use esta skill para implementar o acesso HTTP de um serviço consumido pelo
CLI, pela TUI ou pelo MCP. Crie sob `src/` a pasta nova `api` e o arquivo
`<service>.ts` dentro dela. Crie sob `tests/` o arquivo novo
`api-<service>.test.ts`. Esses destinos são entregas do projeto derivado,
não arquivos já fornecidos pelo starter kit.

## Leia antes

- A spec aberta (`bun run dev -- spec show <id> --json`): `changes` com
  commands, settings e credentials do serviço, Behavior, Design e os itens
  `#termfy-api` de Tasks e Tests. O `CLISPEC.md`
  (`bun run dev -- spec show --json`) mostra o que já foi entregue.
- `docs/configuration.md`, `docs/cli.md` e `docs/spec.md`.
- `src/config/credentials.ts`, `src/config/settings.ts`,
  `src/config/paths.ts`, `src/app/errors.ts` e `src/app/exit-codes.ts`.
- `tests/config.test.ts` para isolar configuração e cofre.
- [Contrato do client](references/client-contract.md).
- [Testes com Bun.serve](references/testing-with-bun-serve.md).
- A documentação oficial do serviço para autenticação, endpoints,
  paginação, limites e idempotência. Não suponha contratos ausentes.

## Regras

1. Implemente somente as operações previstas na spec aberta, seguindo o
   Behavior e o Design dela. Se faltar contrato, revise a spec com
   `termfy-spec` antes de implementar.
2. Centralize `fetch` no client. Exporte funções de domínio com parâmetros
   e resultados tipados, compartilhadas pelos três modos. Não importe o
   registry CLI, o servidor MCP nem componentes TUI no client.
3. Leia o token com `getCredential("<service>.token")`, substituindo o
   marcador por uma string literal, como `getCredential("shop.token")`.
   Não receba tokens por arguments, options ou campos de tools. Preserve
   `AppError` de configuração e credenciais, sem convertê-lo em falha de rede.
4. Declare `<service>.baseUrl` em `SETTINGS_SCHEMA` com `key`, `type`,
   `default` e `description`. Use `readSettings` e `getPath` para ler a URL.
   Valide protocolo e origem antes de enviar a credencial. Permita HTTP
   local somente no contexto de teste; use HTTPS no serviço real.
5. Use `AbortSignal.timeout(timeoutMs)` novo em cada tentativa. Limite
   tentativas e tempo total. Faça retries para falhas de rede e 5xx apenas
   quando repetir a operação não duplicar efeitos. Não repita gravações
   sem idempotência documentada pelo serviço.
6. Converta HTTP não bem-sucedido e falhas de transporte esgotadas em
   `error.network(message, details)`, com `ExitCode.NETWORK_OR_API`.
   Inclua status e corpo resumido e sanitizado nos `details` quando houver
   resposta. Nunca inclua token, cookies, headers de autenticação ou dados
   pessoais. Consulte os limites na referência do client.
7. Trate paginação e 429 explicitamente. Não faça loops sem teto nem
   percorra todas as páginas quando o pedido solicitar apenas uma.
8. Use `Bun.serve` em loopback nos testes. Nenhum teste depende da API real
   ou do cofre da pessoa. Não faça requests ao importar o módulo.

## Passos

1. Rode `git status --short` e preserve mudanças existentes. Liste operações,
   endpoints, limites, formato de resposta e itens da spec a implementar.
2. Crie a pasta `api` sob `src/` e o módulo `<service>.ts`. Separe montagem
   da request, execução com timeout, retries, validação e normalização.
3. Acrescente a key de URL em `src/config/settings.ts`. Confira que a key,
   a credencial e seus consumidores estão em `changes` da spec aberta; o
   `CLISPEC.md` recebe essas entradas no `spec close`. Use `termfy-config` para
   manter o mesmo contrato de armazenamento.
4. Implemente a leitura do token e URL em tempo de chamada. Crie erros de
   transporte usando `src/app/errors.ts`; não encerre o processo no client.
5. Crie `api-<service>.test.ts` sob `tests/`, seguindo a referência de testes.
   Confira sucesso, autenticação enviada, query, payload, timeout, retries,
   erro final, sanitização, paginação e ausência de repetição de gravações.
6. Use o client nos consumidores previstos. Nos commands, declare
   `ExitCode.CREDENTIALS`, `ExitCode.CONFIG` e `ExitCode.NETWORK_OR_API`
   quando aplicáveis. Nas tools, transforme falhas previstas em
   `isError: true`; na TUI, apresente estado de erro sem expor segredos.
7. Documente a configuração em `docs/configuration.md` e o uso nos capítulos
   existentes que cobrem os consumidores. Rode `bun test`,
   `bun run typecheck` e `bun run spec:check`. Se a CLI mudar, rode
   `bun run opencli` antes de `bun run validate`.
8. Marque somente os itens implementados e testados com
   `bun run dev -- spec done <id> <item>`; não edite o checkbox à mão nem
   marque nada no `CLISPEC.md`. Mantenha `in_progress` enquanto
   houver entregas pendentes. Registre desvios em `## Notes` da spec. Código
   à frente do `CLISPEC.md` aparece como `pending` em `spec check` enquanto
   a spec está aberta; com todos os itens marcados, a spec é fechada com
   `bun run dev -- spec close <id>`.

## Marcos

Contrato do serviço confirmado; client compartilhado pronto; credencial e
URL declaradas; testes locais passando; consumidores conferidos; itens da spec
marcados e validação completa com saída 0 ao concluir o escopo inteiro.

## Saída

Liste arquivos criados ou alterados, operações integradas, política de
retries e timeout, key de configuração, nome da credencial e resultados
dos testes. Informe pendências sem imprimir valores de credenciais.

## Compatibilidade

Starter kit 0.8.x. Referências existentes em `src/config/settings.ts`,
`src/config/credentials.ts`, `src/config/paths.ts`, `src/app/errors.ts`,
`src/app/exit-codes.ts`, `tests/config.test.ts`, `docs/configuration.md`,
`docs/cli.md` e `docs/spec.md`. A pasta `api` sob `src/` e o teste por
serviço sob `tests/` são criados pela aplicação desta skill.
