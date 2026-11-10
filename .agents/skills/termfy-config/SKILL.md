---
name: termfy-config
description: Mantém settings.json, o cofre cifrado credentials.json, a chave mestra e as variáveis de ambiente do binário Termfy, incluindo chaves novas no esquema e uso seguro de credenciais em comandos e tools.
---

# Configuração e credenciais

Use esta skill para acrescentar chaves de configuração, consumir ou gravar
credenciais, mudar a política da chave mestra ou depurar a pasta
`~/.<bin>/`.

## Leia antes

- `docs/configuracao.md`.
- `src/config/caminhos.ts`, `src/config/settings.ts`, `src/config/cripto.ts`
  e `src/config/credenciais.ts`.
- `references/modelo-de-seguranca.md`: o que a cifra cobre e o que não cobre.
- `references/chaves-de-configuracao.md`: como declarar uma chave nova.

## Regras

1. Preferência vai para `settings.json`; segredo vai para `credentials.json`.
   Nada que dê acesso a um serviço entra em settings.
2. Toda chave de configuração nova entra em `ESQUEMA_SETTINGS` com tipo,
   padrão e descrição. Sem isso ela é aceita como texto livre e não aparece
   em `config schema`.
3. Segredos nunca passam por argumento de linha de comando, log, mensagem de
   erro, `dados` do `--json` sem `--reveal`, resposta de tool MCP ou frame da
   TUI.
4. Leitura de credencial em código usa `obterCredencial(nome)`, que encerra
   com código 4 quando o valor não existe. Não capture esse erro para
   seguir sem o valor.
5. Nomes de credencial seguem `servico.finalidade` em minúsculas:
   `github.token`, `openai.api_key`, `smtp.senha`.
6. Arquivos continuam com permissão 0600 e a pasta com 0700. Não relaxe.
7. A variável `<BIN>_MASTER_KEY` tem prioridade sobre `master.key`. Em CI e
   em servidores, use a variável e não grave a chave em disco.

## Passos para uma chave de configuração

1. Acrescente a definição em `ESQUEMA_SETTINGS`.
2. Leia o valor com `obterCaminho(lerSettings(), "grupo.chave")`.
3. Se a chave alimentar `--aba`, `--tema` ou outra opção, atualize os
   `valores` da opção correspondente.
4. Teste em `tests/config.test.ts` (conversão e padrão).
5. Atualize a tabela em `docs/configuracao.md`, avance `ebook/VERSION` e rode
   `bun run ebook`.

## Passos para consumir uma credencial

1. Defina o nome e documente-o em `docs/configuracao.md` e na
   `descricaoLonga` do comando que a usa.
2. No comando ou na tool, chame `obterCredencial(nome)` no início de
   `executar`, antes de qualquer efeito.
3. Em `--help`, acrescente `CodigoSaida.CREDENCIAIS` em `codigosSaida`.
4. Oriente a gravação com `<bin> credentials set <nome>` na mensagem de erro.

## Marcos

Esquema atualizado e `config schema` exibindo a chave; testes verdes;
documentação ajustada.

## Saída

Liste chaves ou credenciais adicionadas, arquivos alterados e os testes
executados. Nunca cole valores de credenciais na resposta.

## Compatibilidade

Starter kit 0.2.x. Caminhos citados: `src/config/caminhos.ts`,
`src/config/settings.ts`, `src/config/cripto.ts`,
`src/config/credenciais.ts`, `tests/config.test.ts` e `docs/configuracao.md`.
