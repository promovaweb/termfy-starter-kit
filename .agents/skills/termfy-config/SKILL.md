---
name: termfy-config
description: Mantém settings.json, o cofre cifrado credentials.json, a chave mestra e as variáveis de ambiente do binário Termfy, incluindo chaves novas no esquema e uso seguro de credenciais em comandos e tools.
---

# Configuração e credenciais

Use esta skill para acrescentar chaves de configuração, consumir ou gravar
credenciais, mudar a política da chave mestra ou depurar a pasta
`~/.<bin>/`.

## Leia antes

- A spec aberta, com `bun run dev -- spec show <id> --json`: as entradas
  de `settings` e `credentials` em `changes`, o Behavior, o Design e os
  itens `#termfy-config` de Tasks e Tests. O `CLISPEC.md`
  (`bun run dev -- spec show --json`) mostra o que já foi entregue. Se
  nenhuma spec aberta cobrir o pedido, rode a skill `termfy-spec` antes de
  continuar.
- `docs/configuration.md`.
- `src/config/paths.ts`, `src/config/settings.ts`, `src/config/crypto.ts`
  e `src/config/credentials.ts`.
- `references/security-model.md`: o que a cifra cobre e o que não cobre.
- `references/settings-keys.md`: como declarar uma chave nova.

## Regras

1. Preferência vai para `settings.json`; segredo vai para `credentials.json`.
   Nada que dê acesso a um serviço entra em settings.
2. Toda chave de configuração nova entra em `SETTINGS_SCHEMA` com tipo,
   padrão e descrição. Sem isso ela é aceita como texto livre e não aparece
   em `config schema`.
3. Segredos nunca passam por argumento de linha de comando, log, mensagem de
   erro, `data` do `--json` sem `--reveal`, resposta de tool MCP ou frame da
   TUI.
4. Leitura de credencial em código usa `getCredential(name)`, que lança
   `AppError` com código 4 quando o valor não existe. Não capture esse erro para
   seguir sem o valor.
5. Nomes de credencial seguem `service.purpose` em minúsculas:
   `github.token`, `openai.api_key`, `smtp.password`.
6. Arquivos continuam com permissão 0600 e a pasta com 0700. Não relaxe.
7. A variável `<BIN>_MASTER_KEY` tem prioridade sobre `master.key`. Em CI e
   em servidores, use a variável e não grave a chave em disco. Para trocar a
   chave, `credentials rotate-key` decifra com a atual e grava uma nova
   chave em disco, inclusive com `--from-env`. Nesse modo, a chave antiga
   vem de `master.key` e a nova vem da variável. Sem a flag, remova a
   variável antiga do shell após a rotação. Não oriente apagar o cofre.

## Passos para uma chave de configuração

1. Acrescente a definição em `SETTINGS_SCHEMA`.
2. Leia o valor com `getPath(readSettings(), "group.key")`.
3. Se a chave alimentar `--tab` ou outra opção, atualize os `values`
   correspondentes. Para `tui.theme`, mantenha os valores do esquema
   alinhados às paletas de `src/tui/theme.ts`.
4. Teste em `tests/config.test.ts` (conversão e padrão).
5. Atualize a tabela em `docs/configuration.md`.

## Passos para consumir uma credencial

1. Defina o nome e documente-o em `docs/configuration.md` e na
   `longDescription` do comando que a usa.
2. Chame `getCredential(name)` no início de `run` do comando ou do
   callback registrado por `server.registerTool`, antes de qualquer efeito.
3. No registro do comando, acrescente `ExitCode.CREDENTIALS` em
   `exitCodes`. Na tool, converta falhas previstas em `isError: true`.
4. Oriente a gravação com `<bin> credentials set <name>` na mensagem de erro.

## Itens da spec

Ao concluir e testar cada entrega, marque o item com
`bun run dev -- spec done <id> <item>`, usando o `{#id}` sem `{#}`. Não edite
o checkbox à mão nem marque nada no `CLISPEC.md`. Item novo entra por
`spec task add` ou `spec test add`, que geram o id. Ao começar,
rode `spec start <id>`; não mude o status para `done` à mão.
Se o escopo mudar, revise `changes`, Behavior, Design e o texto do item com
`termfy-spec`; registre a alteração em `## Notes` da spec.
Rode `bun run dev -- spec check --json`: a key nova aparece em `pending`
enquanto a spec está aberta, sem virar aviso. Relate separadamente as
pendências de outras entregas. Ao concluir o escopo inteiro, rode
`bun run validate` e exija saída 0; com todos os itens da spec marcados,
ela é fechada com `bun run dev -- spec close <id>`.

## Marcos

Esquema atualizado e `config schema` exibindo a chave; testes verdes;
documentação ajustada.

## Saída

Liste chaves ou credenciais adicionadas, arquivos alterados e os testes
executados. Nunca cole valores de credenciais na resposta.

## Compatibilidade

Starter kit 0.8.x. Caminhos citados: `src/config/paths.ts`,
`src/config/settings.ts`, `src/config/crypto.ts`,
`src/config/credentials.ts`, `tests/config.test.ts` e `docs/configuration.md`.
