---
name: termfy-api-import
description: Recebe a documentação de uma API (OpenAPI, Postman, página de referência ou texto) e a converte em entradas do CLISPEC.md (commands por recurso, tools MCP, settings e credenciais), prontas para a termfy-api e a termfy-command-set implementarem.
---

# Converter a documentação de uma API em CLI

Use esta skill quando a pessoa enviar uma documentação de API (arquivo
OpenAPI ou Swagger em JSON ou YAML, coleção Postman, URL de referência,
PDF ou texto colado) e pedir um CLI para ela. O resultado não é código: é a
spec. Esta skill lê a documentação, propõe a forma do CLI e grava as
entradas em `CLISPEC.md`; depois `termfy-api` cria o client e
`termfy-command-set` gera commands, tools e screens.

## Leia antes

- `AGENTS.md` do repositório e `CLISPEC.md` atual.
- `references/mapping.md`: como endpoint, parâmetro, autenticação e
  paginação viram command, option, credencial e setting.
- `references/sources.md`: como ler cada formato de documentação e o que
  extrair de cada um.
- `docs/spec.md` do starter kit (ou `references/clispec-contract.md` da
  `termfy-spec`) para o formato das entradas.

## Regras

1. Leia a documentação inteira antes de propor. Com OpenAPI, use o arquivo
   como fonte: paths, methods, parameters, requestBody, responses,
   securitySchemes e servers. Com texto, extraia a mesma lista e marque o
   que ficou incerto em `## Notes`.
2. Agrupe por recurso, não por endpoint. `GET /orders`, `GET /orders/{id}`
   e `POST /orders` viram `orders list`, `orders show <id>` e
   `orders create`. Recurso em inglês, singular no path da API vira plural
   no command quando a API já usa plural.
3. Comece pequeno. Proponha os recursos de leitura (`list`, `show`) de
   todos os recursos relevantes e as escritas só dos recursos que a pessoa
   citou. O resto vai para `## Out of scope` com uma linha por recurso.
4. Parâmetros de query viram options com o mesmo nome em kebab-case
   (`page_size` → `--page-size`), com `values` quando a doc enumera e
   `default` quando a doc informa. Path params viram arguments
   obrigatórios. Body de `create` e `update` vira `--field value` para
   poucos campos ou `--input <file>` (JSON) para muitos; registre a escolha.
5. Autenticação vira credencial `service.token`, `service.api_key` ou
   `service.client_secret`, com `howToObtain` apontando a seção da doc. A
   base URL vira setting `service.baseUrl` com o `servers[0].url` como
   padrão. Nunca copie exemplos de token da documentação.
6. Toda entrada recebe `exitCodes` com 4 (credencial) e 5 (rede ou API) e,
   quando o endpoint devolve 404, 6.
7. Paginação e rate limit entram em `## Notes` com o esquema da API
   (cursor, página, cabeçalhos), para a `termfy-api` implementar.
8. Mostre a proposta à pessoa como tabela (command, endpoint, options,
   credencial) antes de gravar. Ela escolhe o que entra; nada é código
   ainda.

## Passos

1. Rode `git status --short` e `bun run dev -- spec show --json`.
2. Obtenha a documentação: arquivo no repositório, URL (baixe para
   `tmp/`, fora do controle de versão) ou texto colado. Identifique o
   formato com `references/sources.md`.
3. Extraia recursos, endpoints, parâmetros, autenticação, servers,
   paginação e erros em uma tabela de trabalho.
4. Aplique `references/mapping.md` e monte a proposta: commands por
   recurso, tools MCP espelhadas (uma por command de leitura; escritas só
   com `effect: write` e confirmação), settings e credenciais.
5. Apresente a proposta e colha os ajustes: nomes, o que entra agora, o que
   fica para depois.
6. Grave em `CLISPEC.md`: entradas em `commands`, `mcp.tools`, `settings` e
   `credentials`; itens na `## Checklist` por recurso (`#termfy-api` para o
   client, `#termfy-command-set` por recurso); fonte da documentação,
   paginação, rate limit e dúvidas em `## Notes`. Avance `updatedAt`.
7. Rode `bun run dev -- spec check`. Erros de contrato são corrigidos
   agora; avisos de commands ainda sem código são esperados.
8. Indique a sequência: `termfy-config` para settings e credenciais,
   `termfy-api` para o client, `termfy-command-set` por recurso.

## Marcos

Documentação lida; proposta aprovada; spec gravada e conferida; sequência
indicada.

## Saída

Relate a fonte lida, o número de recursos e endpoints encontrados, o que
entrou na spec e o que ficou fora, as dúvidas em `## Notes` e as skills
seguintes.

## Compatibilidade

Starter kit 0.7.x. Caminhos citados: `CLISPEC.md`, `docs/spec.md` e o
script `dev`.
