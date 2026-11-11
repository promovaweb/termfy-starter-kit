---
schemaVersion: 2.0.0
id: "0005"
title: Bun, TypeScript e OpenTUI mais recentes
status: done
createdAt: "2026-11-11T07:25:45.864Z"
updatedAt: "2026-11-11T07:25:47.411Z"
closedAt: "2026-11-11T07:25:47.411Z"
---
## Goal

Manter o esqueleto nas versões mais recentes do Bun e das bibliotecas, e
impedir que a release puxe uma versão diferente da travada no lockfile.

## Behavior

Nenhuma mudança de superfície. `doctor` passa a exigir Bun 1.4.4 ou
superior. A release compila os cinco alvos com os pacotes nativos do
OpenTUI na versão do `bun.lock`.

## Design

- `package.json`: `@opentui/core` 0.8.4, `@types/bun` 1.4.4, TypeScript 7
  e `engines.bun` >=1.4.4.
- `scripts/credential-calls.ts`: tokenizador próprio para as chamadas de
  `getCredential`, porque o TypeScript 7 não tem a API JavaScript do
  compilador; `scripts/check-spec.ts` passa a usá-lo.
- `.github/workflows/release.yml`: `bun install --frozen-lockfile --os="*"
  --cpu="*"` no lugar de instalar `@opentui/core` sem versão.

## Tasks

- [x] Dependências e engines na versão mais recente `#termfy-release` {#a4f7}
- [x] Scanner de credenciais sem a API do compilador `#termfy-test` {#gzg3}
- [x] Release instala os pacotes nativos pelo lockfile `#termfy-release` {#611o}

## Tests

- [x] bun run build:all compila os cinco alvos {#5crn}
- [x] Tokenizador ignora comentários, strings e templates computados {#v75l}

## Notes
