---
name: termfy-config
description: Mantém settings.json, o cofre cifrado credentials.json, a chave mestra e as variáveis de ambiente do binário Termfy, incluindo chaves novas no esquema e uso seguro de credenciais em comandos e tools.
---

# Configuração e credenciais

Use esta skill para acrescentar chaves de configuração, consumir ou gravar
credenciais, mudar a política da chave mestra ou depurar a pasta
`~/.<bin>/`.

## Leia antes

- `CLISPEC.md` na raiz do projeto: a seção que descreve o que será
  implementado. Se o arquivo não existir ou não cobrir o pedido, rode a
  skill `termfy-spec` antes de continuar.
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
4. Leitura de credencial em código usa `getCredential(name)`, que encerra
   com código 4 quando o valor não existe. Não capture esse erro para
   seguir sem o valor.
5. Nomes de credencial seguem `service.purpose` em minúsculas:
   `github.token`, `openai.api_key`, `smtp.password`.
6. Arquivos continuam com permissão 0600 e a pasta com 0700. Não relaxe.
7. A variável `<BIN>_MASTER_KEY` tem prioridade sobre `master.key`. Em CI e
   em servidores, use a variável e não grave a chave em disco.

## Passos para uma chave de configuração

1. Acrescente a definição em `SETTINGS_SCHEMA`.
2. Leia o valor com `getPath(readSettings(), "group.key")`.
3. Se a chave alimentar `--tab` ou outra opção, atualize os `values`
   correspondentes. Para `tui.theme`, mantenha os valores do esquema
   alinhados às paletas de `src/tui/theme.ts`.
4. Teste em `tests/config.test.ts` (conversão e padrão).
5. Atualize a tabela em `docs/configuration.md`, avance `ebook/VERSION` e rode
   `bun run ebook`.

## Passos para consumir uma credencial

1. Defina o nome e documente-o em `docs/configuration.md` e na
   `longDescription` do comando que a usa.
2. No comando ou na tool, chame `getCredential(name)` no início de
   `run`, antes de qualquer efeito.
3. Em `--help`, acrescente `ExitCode.CREDENTIALS` em `exitCodes`.
4. Oriente a gravação com `<bin> credentials set <name>` na mensagem de erro.

## Marcos

Esquema atualizado e `config schema` exibindo a chave; testes verdes;
documentação ajustada.

## Saída

Liste chaves ou credenciais adicionadas, arquivos alterados e os testes
executados. Nunca cole valores de credenciais na resposta.

## Compatibilidade

Starter kit 0.3.x. Caminhos citados: `src/config/paths.ts`,
`src/config/settings.ts`, `src/config/crypto.ts`,
`src/config/credentials.ts`, `tests/config.test.ts` e `docs/configuration.md`.
