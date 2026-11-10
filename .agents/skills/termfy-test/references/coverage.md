# Cobertura antes de concluir uma entrega

Relacione o `{#id}` do `CLISPEC.md` aos testes que exercitam seu comportamento.
Escolha os casos aplicáveis abaixo; explique os que não se aplicam. Percentual
de linhas executadas não substitui assertions sobre a saída e os efeitos.

## Command

- Uma chamada válida em texto e outra com `--json`, com exit code conferido
  nas duas. No JSON, confira `command`, `data` e o resultado do domínio.
- Argument obrigatório ausente, option desconhecida e enum inválido, quando
  existirem. Confira `ExitCode.USAGE`, stderr no modo texto e o envelope de erro.
- Uma falha prevista de cada família introduzida pela entrega, por exemplo
  `error.network` produzindo `ExitCode.NETWORK_OR_API`, sem acessar rede real.
- Valores padrão, limites, coleção vazia e aliases alterados.
- Efeito no disco ou estado, além da mensagem de sucesso. Uma operação recusada
  não pode aplicar parcialmente a alteração.
- Help com descriptions das options e arguments; saída de progresso em stderr.
- Quando houver segredo, ausência do valor em stdout, stderr e JSON mascarado;
  revelação apenas com `--reveal`. Confira também chamadas de preparo.
- Quando houver interação, comportamento sem TTY e as alternativas declaradas
  como `--stdin` e `--yes`. Não simule uma TUI real para testar esse erro.

## Tool MCP

- Presença em `listTools` e chamada por `Client.callTool` com entrada válida.
- `content` e `structuredContent` coerentes quando a resposta for estruturada.
- Entrada inválida rejeitada pelo schema de `registerTool`; falha de domínio
  como `isError: true`. Diferencie erro de protocolo de erro retornado pela tool.
- Ausência de credenciais em todas as partes da resposta e nos diagnósticos.
- Nenhum texto alheio ao JSON-RPC em stdout. A chamada deve funcionar sem rede.
- Resources e prompts alterados também são descobertos e lidos com o Client.
- Cliente e transporte fechados no sucesso e na falha, sem processos pendurados.

## Screen

- Frame inicial com os dados da spec, sem segredo e com tema esperado.
- Navegação até a screen, ação de tecla própria, help e encerramento.
- Para `listPanel`, seleção por teclado, item ativado, rolagem e lista vazia.
  Consulte `tests/tui-list.test.ts` e `src/tui/components.ts`.
- Estado vazio e falha de carregamento, quando a screen carregar dados.
- Mudança de aba dispara a limpeza prevista; saída destrói o renderer.
- Renderização após cada interação antes de capturar o frame. Timers e
  subscriptions não permanecem ativos depois do teste.

## Configuração

- Padrões de `SETTINGS_SCHEMA`, conversão de tipo e rejeição de enum inválido.
- Persistência e nova leitura; arquivo ausente e arquivo inválido.
- `getCredential` para nome existente e ausente; cifragem sem valor em texto
  claro no arquivo; permissões esperadas e prioridade da variável de ambiente.
- Restauração do ambiente do processo e remoção apenas da pasta do teste.

## Fechamento

Rode `bun run typecheck`, `bun test` e `bun run dev -- spec check --strict`.
Associe o resultado ao estado atual dos arquivos. Se um caso essencial falhar
ou não puder rodar, não marque o item como concluído. Uma suíte sem assertions
sobre a entrega não autoriza marcar `[x]`.
